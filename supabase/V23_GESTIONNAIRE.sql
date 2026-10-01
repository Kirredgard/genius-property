-- Genius Property V23 — rôle « gestionnaire »
-- Accès à toute l'application sauf Maintenance & Sécurité (restriction appliquée dans l'interface).
-- À exécuter UNE FOIS dans Supabase > SQL Editor (après V22_INSTALL.sql et les migrations 001/002).

begin;

-- 1) Autoriser le nouveau rôle dans les profils
alter table public.gp_user_profiles drop constraint if exists gp_user_profiles_role_check;
alter table public.gp_user_profiles
  add constraint gp_user_profiles_role_check
  check (role in ('admin','gestionnaire','agent','comptable','readonly','lecture'));

-- 2) Lecture des données
drop policy if exists gp_v22_app_select on public.gp_app_data;
create policy gp_v22_app_select on public.gp_app_data
for select to authenticated
using (public.gp_v22_role() in ('admin','gestionnaire','agent','comptable','readonly','lecture'));

create or replace function public.gp_get_app_data()
returns table(payload jsonb, version bigint, updated_at timestamptz, updated_by uuid)
language sql stable security definer set search_path = public as $$
  select a.payload, a.version, a.updated_at, a.updated_by
  from public.gp_app_data a
  where a.id = 'main'
    and public.gp_v22_role() in ('admin','gestionnaire','agent','comptable','readonly','lecture');
$$;

-- 3) Écriture des données
create or replace function public.gp_update_app_data(p_payload jsonb, p_expected_version bigint)
returns table(version bigint, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_role text := public.gp_v22_role();
  v_version bigint;
begin
  if v_role not in ('admin','gestionnaire','agent','comptable') then
    raise exception 'permission denied';
  end if;
  if p_payload is null then
    raise exception 'payload cannot be null';
  end if;
  update public.gp_app_data
     set payload = p_payload, version = version + 1, updated_by = auth.uid(), updated_at = now()
   where id = 'main' and version = p_expected_version
   returning public.gp_app_data.version, public.gp_app_data.updated_at into v_version, updated_at;
  if not found then
    raise exception 'stale_data: server version changed';
  end if;
  version := v_version;
  return next;
end;
$$;

revoke all on function public.gp_get_app_data() from public;
revoke all on function public.gp_update_app_data(jsonb,bigint) from public;
grant execute on function public.gp_get_app_data() to authenticated;
grant execute on function public.gp_update_app_data(jsonb,bigint) to authenticated;

-- 4) Tables relationnelles (si la migration 002 est installée)
do $$
declare t text;
begin
  foreach t in array array['proprietaires','biens','locataires','contrats','paiements','depenses'] loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists gp_rel_select on public.%I', t);
      execute format('drop policy if exists gp_rel_write on public.%I', t);
      execute format('create policy gp_rel_select on public.%I for select to authenticated using (public.gp_v22_role() in (''admin'',''gestionnaire'',''agent'',''comptable'',''readonly'',''lecture''))', t);
      execute format('create policy gp_rel_write on public.%I for all to authenticated using (public.gp_v22_role() in (''admin'',''gestionnaire'',''agent'',''comptable'')) with check (public.gp_v22_role() in (''admin'',''gestionnaire'',''agent'',''comptable''))', t);
    end if;
  end loop;
end $$;

commit;
