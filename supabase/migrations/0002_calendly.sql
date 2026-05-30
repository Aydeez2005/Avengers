-- Add Calendly URL to profiles. Every Scout user provides one at signup —
-- it's how anyone on the platform actually books time with them.

alter table public.profiles
  add column if not exists calendly_url text;
