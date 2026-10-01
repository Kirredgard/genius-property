-- Genius Property — sécurité + concurrence (transition avant migration relationnelle)
-- À exécuter APRÈS V22_INSTALL.sql.
-- Cette migration ne supprime aucune donnée.

begin;

-- 1) Un profil ne peut plus être créé/modifié par l'utilisateur lui-même.
-- La création des employés doit passer par create-employee-account (service role).
drop policy if exists gp_v22_profile_insert_self on public.gp_user_profiles;
drop policy if exists gp_v22_profile_update_self on public.gp_user_profiles;

-- 2) Un profil absent ne doit JAMAIS devenir admin.
create or replace function public.gp_v22_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(role)
      from public.gp_user_profiles
      where id = auth.uid() and is_active = true
    ),
    'anonymous'
  );
$$;

-- 3) Concurrence optimiste côté serveur pour l'ancien stockage JSON.
alter table public.gp_app_data
  add column if not exists version bigint not null default 1;

-- Initialise une version cohérente pour la ligne existante.
update public.gp_app_data
set version = greatest(coalesce(version, 1), 1)
where id = 'main';

-- Aucun UPDATE direct depuis le navigateur.
drop policy if exists gp_v22_app_update on public.gp_app_data;

-- Lecture contrôlée par rôle.
drop policy if exists gp_v22_app_select on public.gp_app_data;
create policy gp_v22_app_select on public.gp_app_data
for select to authenticated
using (public.gp_v22_role() in ('admin','agent','comptable','readonly','lecture'));

-- Lecture de l'état + version sans exposer une permission UPDATE directe.
create or replace function public.gp_get_app_data()
returns table(payload jsonb, version bigint, updated_at timestamptz, updated_by uuid)
language sql
stable
security definer
set search_path = public
as $$
  select a.payload, a.version, a.updated_at, a.updated_by
  from public.gp_app_data a
  where a.id = 'main'
    and public.gp_v22_role() in ('admin','agent','comptable','readonly','lecture');
$$;

-- Écriture atomique : si quelqu'un a déjà écrit depuis le dernier pull,
-- la transaction échoue avec une erreur explicite au lieu d'écraser ses données.
create or replace function public.gp_update_app_data(
  p_payload jsonb,
  p_expected_version bigint
)
returns table(version bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.gp_v22_role();
  v_version bigint;
begin
  if v_role not in ('admin','agent','comptable') then
    raise exception 'permission denied';
  end if;

  if p_payload is null then
    raise exception 'payload cannot be null';
  end if;

  update public.gp_app_data
     set payload = p_payload,
         version = version + 1,
         updated_by = auth.uid(),
         updated_at = now()
   where id = 'main'
     and version = p_expected_version
   returning public.gp_app_data.version, public.gp_app_data.updated_at
   into v_version, updated_at;

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

commit;
