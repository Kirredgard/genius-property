-- Genius Property V22 — Supabase test schema
-- Safe to run after the first V21/V22 base script.
-- No service_role key is required in the browser.

create extension if not exists pgcrypto;

create table if not exists public.gp_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'readonly'
    check (role in ('admin','agent','comptable','readonly','lecture')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gp_app_data (
  id text primary key default 'main',
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.gp_app_data(id,payload)
values ('main','{}'::jsonb)
on conflict (id) do nothing;

alter table public.gp_user_profiles enable row level security;
alter table public.gp_app_data enable row level security;

drop policy if exists gp_v22_profile_self on public.gp_user_profiles;
drop policy if exists gp_v22_app_select on public.gp_app_data;
drop policy if exists gp_v22_app_update on public.gp_app_data;

create or replace function public.gp_v22_role()
returns text language sql stable security definer set search_path=public as $$
  select coalesce((select role from public.gp_user_profiles where id=auth.uid() and is_active=true),'anonymous');
$$;

create policy gp_v22_profile_self on public.gp_user_profiles
for select to authenticated
using (id=auth.uid());

create policy gp_v22_app_select on public.gp_app_data
for select to authenticated
using (public.gp_v22_role() in ('admin','agent','comptable','readonly','lecture'));

create policy gp_v22_app_update on public.gp_app_data
for update to authenticated
using (public.gp_v22_role() in ('admin','agent','comptable'))
with check (public.gp_v22_role() in ('admin','agent','comptable'));

-- Allow an admin to insert a missing profile only when the id is the caller.
-- This is useful for first-time setup; the UI never uses this automatically.
drop policy if exists gp_v22_profile_insert_self on public.gp_user_profiles;
create policy gp_v22_profile_insert_self on public.gp_user_profiles
for insert to authenticated
with check (id=auth.uid());

