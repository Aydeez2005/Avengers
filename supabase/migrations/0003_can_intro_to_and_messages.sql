-- Scout: reverse-matching capability + 3-party intro threads
--
-- Two things:
--   1. profiles.can_intro_to — what *this person* says they can introduce others to.
--      Indexed at weight A so a goal like "neurotech founders" surfaces bridges
--      who self-tagged that capability, not only targets.
--   2. intro_messages — the slicker flow: when a bridge accepts, we auto-create
--      the first message (from the agent's draft, editable). Target + requester
--      can chat with the bridge inside the thread.

alter table public.profiles
  add column if not exists can_intro_to text[] default '{}';

-- Rebuild the search_text function to include can_intro_to at weight A.
create or replace function public.profiles_search_text(p public.profiles)
returns tsvector language sql immutable as $$
  select
    setweight(to_tsvector('simple', coalesce(p.headline, '')),               'A') ||
    setweight(to_tsvector('simple', array_to_string(p.interests, ' ')),      'A') ||
    setweight(to_tsvector('simple', array_to_string(p.can_intro_to, ' ')),   'A') ||
    setweight(to_tsvector('simple', coalesce(p.current_title, '')),          'B') ||
    setweight(to_tsvector('simple', coalesce(p.current_company, '')),        'B') ||
    setweight(to_tsvector('simple', array_to_string(p.roles, ' ')),          'C') ||
    setweight(to_tsvector('simple', coalesce(p.bio, '')),                    'C') ||
    setweight(to_tsvector('simple', coalesce(p.full_name, '')),              'D') ||
    setweight(to_tsvector('simple', coalesce(p.location, '')),               'D')
$$;

-- Backfill existing rows so the new column flows through to search_text.
update public.profiles set search_text = public.profiles_search_text(profiles.*);

-- =========================================================
-- intro_messages: 3-party thread per intro
-- =========================================================
create table if not exists public.intro_messages (
  id          uuid primary key default gen_random_uuid(),
  intro_id    uuid not null references public.intros(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists intro_messages_intro_idx on public.intro_messages(intro_id, created_at);

alter table public.intro_messages enable row level security;

drop policy if exists intro_messages_party_read on public.intro_messages;
drop policy if exists intro_messages_party_write on public.intro_messages;

create policy intro_messages_party_read on public.intro_messages for select
  using (
    exists (
      select 1 from public.intros i
      where i.id = intro_messages.intro_id
        and auth.uid() in (i.requester_id, i.bridge_id, i.target_profile_id)
    )
  );

create policy intro_messages_party_write on public.intro_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.intros i
      where i.id = intro_messages.intro_id
        and auth.uid() in (i.requester_id, i.bridge_id, i.target_profile_id)
    )
  );
