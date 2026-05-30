-- Scout: connection graph + agentic intros
-- Run via: supabase db push  (or paste in SQL editor)
--
-- Matching uses Postgres full-text search (no embeddings needed). Claude
-- handles semantic reranking on top of the lexical shortlist.

create extension if not exists pgcrypto;

-- =========================================================
-- profiles: one row per Scout user. Mirrors auth.users.
-- =========================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  headline        text,
  bio             text,
  location        text,
  roles           text[]      default '{}',
  interests       text[]      default '{}',
  linkedin_url    text,
  linkedin_id     text unique,
  current_company text,
  current_title   text,
  search_text     tsvector,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Build the tsvector from every text-ish field. Weighted: headline > interests > bio > etc.
create or replace function public.profiles_search_text(p public.profiles)
returns tsvector language sql immutable as $$
  select
    setweight(to_tsvector('simple', coalesce(p.headline, '')),            'A') ||
    setweight(to_tsvector('simple', array_to_string(p.interests, ' ')),   'A') ||
    setweight(to_tsvector('simple', coalesce(p.current_title, '')),       'B') ||
    setweight(to_tsvector('simple', coalesce(p.current_company, '')),     'B') ||
    setweight(to_tsvector('simple', array_to_string(p.roles, ' ')),       'C') ||
    setweight(to_tsvector('simple', coalesce(p.bio, '')),                 'C') ||
    setweight(to_tsvector('simple', coalesce(p.full_name, '')),           'D') ||
    setweight(to_tsvector('simple', coalesce(p.location, '')),            'D')
$$;

create or replace function public.profiles_search_trigger()
returns trigger language plpgsql as $$
begin
  new.search_text := public.profiles_search_text(new);
  return new;
end $$;

drop trigger if exists profiles_search_text_trg on public.profiles;
create trigger profiles_search_text_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_search_trigger();

create index if not exists profiles_search_text_idx on public.profiles using gin(search_text);

-- =========================================================
-- external_contacts: people in a user's graph who are NOT
-- on Scout. Imported from LinkedIn CSV or added manually.
-- Becomes a "ghost" node we can later resolve to a profile.
-- =========================================================
create table if not exists public.external_contacts (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  full_name            text not null,
  email                text,
  linkedin_url         text,
  company              text,
  title                text,
  source               text not null default 'manual',  -- 'linkedin_csv' | 'manual' | 'extracted'
  resolved_profile_id  uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);

create index if not exists external_contacts_owner_idx on public.external_contacts(owner_id);
create index if not exists external_contacts_email_idx on public.external_contacts(lower(email));
create index if not exists external_contacts_linkedin_idx on public.external_contacts(linkedin_url);

-- =========================================================
-- connections: directed edges in the social graph.
-- Either endpoint can be a profile OR an external_contact.
-- tie_strength is 0..1 (0 = barely know, 1 = close friend).
-- =========================================================
create table if not exists public.connections (
  id              uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles(id) on delete cascade,
  to_profile_id   uuid references public.profiles(id) on delete cascade,
  to_external_id  uuid references public.external_contacts(id) on delete cascade,
  tie_strength    real not null default 0.3,
  context         text,            -- "worked together at X", "met at hackathon"
  source          text not null default 'manual',  -- 'linkedin_csv' | 'manual' | 'intro' | 'mutual_match'
  created_at      timestamptz not null default now(),
  constraint connections_one_target check (
    (to_profile_id is not null)::int + (to_external_id is not null)::int = 1
  ),
  constraint connections_no_self check (from_profile_id <> to_profile_id)
);

create unique index if not exists connections_unique_profile
  on public.connections(from_profile_id, to_profile_id) where to_profile_id is not null;
create unique index if not exists connections_unique_external
  on public.connections(from_profile_id, to_external_id) where to_external_id is not null;
create index if not exists connections_from_idx on public.connections(from_profile_id);
create index if not exists connections_to_profile_idx on public.connections(to_profile_id);

-- =========================================================
-- intros: a request for one user to introduce another.
-- requester -> bridge -> target. Target can be profile OR external.
-- =========================================================
do $$ begin
  create type intro_status as enum (
    'suggested',  -- agent surfaced it, not yet sent
    'pending',    -- sent to bridge, awaiting decision
    'declined',   -- bridge declined
    'forwarded',  -- bridge made the intro
    'connected',  -- target accepted, both sides connected
    'expired'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.intros (
  id                  uuid primary key default gen_random_uuid(),
  requester_id        uuid not null references public.profiles(id) on delete cascade,
  bridge_id           uuid not null references public.profiles(id) on delete cascade,
  target_profile_id   uuid references public.profiles(id) on delete cascade,
  target_external_id  uuid references public.external_contacts(id) on delete cascade,
  goal                text not null,        -- "want to break into neurotech"
  context             text,                 -- why this match makes sense
  draft_message       text,                 -- agent-drafted intro the bridge can send
  relevance_score     real,
  status              intro_status not null default 'suggested',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint intros_one_target check (
    (target_profile_id is not null)::int + (target_external_id is not null)::int = 1
  ),
  constraint intros_distinct check (requester_id <> bridge_id)
);

create index if not exists intros_requester_idx on public.intros(requester_id, status);
create index if not exists intros_bridge_idx    on public.intros(bridge_id, status);

-- =========================================================
-- RLS: a user can read/write only rows they own.
-- Service-role bypasses all of this for agent writes.
-- =========================================================
alter table public.profiles            enable row level security;
alter table public.external_contacts   enable row level security;
alter table public.connections         enable row level security;
alter table public.intros              enable row level security;

drop policy if exists profiles_self_read   on public.profiles;
drop policy if exists profiles_self_write  on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_read   on public.profiles for select using (true);
create policy profiles_self_write  on public.profiles for update using (auth.uid() = id);
create policy profiles_self_insert on public.profiles for insert with check (auth.uid() = id);

drop policy if exists external_owner_all on public.external_contacts;
create policy external_owner_all on public.external_contacts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists connections_owner_all on public.connections;
create policy connections_owner_all on public.connections
  for all using (auth.uid() = from_profile_id) with check (auth.uid() = from_profile_id);

drop policy if exists intros_party_read     on public.intros;
drop policy if exists intros_requester_write on public.intros;
drop policy if exists intros_bridge_update  on public.intros;
create policy intros_party_read on public.intros for select
  using (auth.uid() in (requester_id, bridge_id, target_profile_id));
create policy intros_requester_write on public.intros for insert
  with check (auth.uid() = requester_id);
create policy intros_bridge_update on public.intros for update
  using (auth.uid() in (requester_id, bridge_id));

-- =========================================================
-- match_profiles: lexical full-text search.
-- Takes a free-text goal string (parsed via websearch_to_tsquery so
-- the agent can write goals naturally), returns ranked profile candidates.
-- =========================================================
create or replace function public.match_profiles(
  goal_text   text,
  exclude_id  uuid,
  match_count int default 50
) returns table (
  id          uuid,
  full_name   text,
  headline    text,
  similarity  real
) language sql stable as $$
  with q as (
    select websearch_to_tsquery('simple', goal_text) as query
  )
  select p.id, p.full_name, p.headline,
         ts_rank_cd(p.search_text, (select query from q))::real as similarity
  from public.profiles p, q
  where p.search_text @@ q.query
    and p.id <> exclude_id
  order by similarity desc
  limit match_count;
$$;
