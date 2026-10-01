-- =====================================================================
--  GENIUS PROPERTY — MIGRATION MULTI-AGENCES
--  À exécuter APRÈS GENIUS_PROPERTY_SUPABASE_COMPLET.sql
--  Rejouable sans risque. Ne supprime aucune donnée.
--  Conseil : fais un export/sauvegarde de gp_app_data avant.
--
--  Principe : chaque agence = 1 ligne dans gp_agencies
--             + 1 ligne dans gp_app_data (ses données JSON)
--             chaque utilisateur appartient à UNE agence
--  Rôle super_admin : propriétaire de la plateforme, voit toutes les agences.
-- =====================================================================

begin;

-- 1. AGENCES ----------------------------------------------------------
create table if not exists public.gp_agencies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Agence par défaut : reçoit toutes tes données et utilisateurs actuels
insert into public.gp_agencies (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Agence principale', 'principale')
on conflict (id) do nothing;

-- 2. PROFILS : rattachement à une agence + rôle super_admin -------------
alter table public.gp_user_profiles
  add column if not exists agency_id uuid references public.gp_agencies(id);

update public.gp_user_profiles
   set agency_id = '00000000-0000-0000-0000-000000000001'
 where agency_id is null;

alter table public.gp_user_profiles drop constraint if exists gp_user_profiles_role_check;
alter table public.gp_user_profiles
  add constraint gp_user_profiles_role_check
  check (role in ('super_admin','admin','gestionnaire','agent','comptable','readonly','lecture'));

create index if not exists idx_profiles_agency on public.gp_user_profiles(agency_id);

-- 3. DONNÉES : une ligne par agence ------------------------------------
alter table public.gp_app_data
  add column if not exists agency_id uuid references public.gp_agencies(id);

update public.gp_app_data
   set agency_id = '00000000-0000-0000-0000-000000000001'
 where id = 'main' and agency_id is null;

create unique index if not exists uq_app_data_agency on public.gp_app_data(agency_id);

-- 4. FONCTIONS D'IDENTITÉ ------------------------------------------------
-- Agence courante de l'utilisateur (null si inactif ou agence désactivée)
create or replace function public.gp_v22_agency()
returns uuid
language sql stable security definer set search_path = public
as $$
  select p.agency_id
    from public.gp_user_profiles p
    join public.gp_agencies a on a.id = p.agency_id
   where p.id = auth.uid() and p.is_active = true and a.is_active = true;
$$;

create or replace function public.gp_is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.gp_user_profiles
                  where id = auth.uid() and is_active = true and lower(role) = 'super_admin');
$$;

-- Le super_admin est vu comme « admin » par toutes les règles existantes.
-- Un utilisateur dont l'agence est désactivée n'a plus aucun droit.
create or replace function public.gp_v22_role()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select case when lower(p.role) = 'super_admin' then 'admin' else lower(p.role) end
       from public.gp_user_profiles p
       join public.gp_agencies a on a.id = p.agency_id
      where p.id = auth.uid() and p.is_active = true and a.is_active = true),
    'anonymous'
  );
$$;

-- 5. RLS : isolation par agence -----------------------------------------
drop policy if exists gp_v23_profile_admin_read on public.gp_user_profiles;
create policy gp_v23_profile_admin_read on public.gp_user_profiles
  for select to authenticated
  using (
    public.gp_is_super_admin()
    or (public.gp_v22_role() = 'admin' and agency_id = public.gp_v22_agency())
  );

drop policy if exists gp_v22_app_select on public.gp_app_data;
create policy gp_v22_app_select on public.gp_app_data
  for select to authenticated
  using (
    agency_id = public.gp_v22_agency()
    and public.gp_v22_role() in ('admin','gestionnaire','agent','comptable','readonly','lecture')
  );

alter table public.gp_agencies enable row level security;
revoke all on public.gp_agencies from anon;
drop policy if exists gp_agencies_select on public.gp_agencies;
create policy gp_agencies_select on public.gp_agencies
  for select to authenticated
  using (public.gp_is_super_admin() or id = public.gp_v22_agency());

-- 6. LECTURE / ÉCRITURE : filtrées sur l'agence de l'utilisateur ----------
-- Même signature qu'avant : l'application n'a pas à changer ses appels.
create or replace function public.gp_get_app_data()
returns table(payload jsonb, version bigint, updated_at timestamptz, updated_by uuid)
language sql stable security definer set search_path = public
as $$
  select a.payload, a.version, a.updated_at, a.updated_by
    from public.gp_app_data a
   where a.agency_id = public.gp_v22_agency()
     and public.gp_v22_role() in ('admin','gestionnaire','agent','comptable','readonly','lecture');
$$;

create or replace function public.gp_update_app_data(
  p_payload          jsonb,
  p_expected_version bigint
)
returns table(version bigint, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_role    text := public.gp_v22_role();
  v_agency  uuid := public.gp_v22_agency();
  v_version bigint;
begin
  if v_role not in ('admin','gestionnaire','agent','comptable') or v_agency is null then
    raise exception 'permission denied';
  end if;
  if p_payload is null then
    raise exception 'payload cannot be null';
  end if;

  update public.gp_app_data
     set payload    = p_payload,
         version    = public.gp_app_data.version + 1,
         updated_by = auth.uid(),
         updated_at = now()
   where agency_id = v_agency
     and public.gp_app_data.version = p_expected_version
  returning public.gp_app_data.version, public.gp_app_data.updated_at
       into v_version, updated_at;

  if not found then
    raise exception 'stale_data: server version changed';
  end if;

  version := v_version;
  return next;
end;
$$;

-- 7. FONCTIONS SUPER ADMIN -----------------------------------------------
-- Créer une agence (+ sa ligne de données vide)
create or replace function public.gp_create_agency(p_name text, p_slug text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not public.gp_is_super_admin() then
    raise exception 'permission denied';
  end if;
  insert into public.gp_agencies (name, slug) values (p_name, p_slug) returning id into v_id;
  insert into public.gp_app_data (id, agency_id, payload) values (v_id::text, v_id, '{}'::jsonb);
  return v_id;
end;
$$;

-- Le super_admin « entre » dans une agence (change son agence active)
create or replace function public.gp_switch_agency(p_agency uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.gp_is_super_admin() then
    raise exception 'permission denied';
  end if;
  if not exists (select 1 from public.gp_agencies where id = p_agency) then
    raise exception 'agency not found';
  end if;
  update public.gp_user_profiles set agency_id = p_agency, updated_at = now()
   where id = auth.uid();
end;
$$;

-- Activer / suspendre une agence
create or replace function public.gp_set_agency_active(p_agency uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.gp_is_super_admin() then
    raise exception 'permission denied';
  end if;
  update public.gp_agencies set is_active = p_active where id = p_agency;
end;
$$;

revoke all on function public.gp_v22_agency(), public.gp_is_super_admin(),
  public.gp_create_agency(text,text), public.gp_switch_agency(uuid),
  public.gp_set_agency_active(uuid,boolean) from public, anon;
grant execute on function public.gp_v22_agency(), public.gp_is_super_admin(),
  public.gp_create_agency(text,text), public.gp_switch_agency(uuid),
  public.gp_set_agency_active(uuid,boolean) to authenticated;

-- 8. TABLES RELATIONNELLES (réserve) : agency_id + isolation -------------
do $$
declare t text;
begin
  foreach t in array array['proprietaires','biens','locataires','contrats','paiements','depenses'] loop
    execute format('alter table public.%I add column if not exists agency_id uuid
                    default public.gp_v22_agency() references public.gp_agencies(id)', t);
    execute format('update public.%I set agency_id = %L where agency_id is null',
                   t, '00000000-0000-0000-0000-000000000001');
    execute format('create index if not exists idx_%s_agency on public.%I(agency_id)', t, t);
    execute format('drop policy if exists gp_rel_select on public.%I', t);
    execute format('drop policy if exists gp_rel_write  on public.%I', t);
    execute format($p$create policy gp_rel_select on public.%I for select to authenticated
      using (agency_id = public.gp_v22_agency()
             and public.gp_v22_role() in ('admin','gestionnaire','agent','comptable','readonly','lecture'))$p$, t);
    execute format($p$create policy gp_rel_write on public.%I for all to authenticated
      using      (agency_id = public.gp_v22_agency()
                  and public.gp_v22_role() in ('admin','gestionnaire','agent','comptable'))
      with check (agency_id = public.gp_v22_agency()
                  and public.gp_v22_role() in ('admin','gestionnaire','agent','comptable'))$p$, t);
  end loop;
end $$;

commit;

-- =====================================================================
-- 9. TOI = SUPER ADMIN (propriétaire de la plateforme)
--    Remplace l'email puis exécute ce bloc seul.
-- =====================================================================
do $$
declare v_email text := 'TON-EMAIL@EXEMPLE.COM';  -- <<< À REMPLACER
begin
  if v_email = 'TON-EMAIL@EXEMPLE.COM' then
    raise notice 'Étape 9 ignorée : remplace l''email.';
    return;
  end if;
  update public.gp_user_profiles set role = 'super_admin', is_active = true, updated_at = now()
   where lower(email) = lower(v_email);
end $$;

-- Exemple : créer une 2e agence (à lancer en étant connecté en super_admin
-- depuis l'appli, via supabase.rpc('gp_create_agency', {p_name:'Agence Thiès'}))
