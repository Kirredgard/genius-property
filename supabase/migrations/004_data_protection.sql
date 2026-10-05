-- Genius Property V30 — protection des données
-- À exécuter APRÈS 003_multi_agences.sql (SQL Editor > Run). Ne supprime aucune donnée.
--
-- Ce que ça ajoute :
--   1. Un compteur d'enregistrements (gp_count_records).
--   2. Un historique automatique des versions de gp_app_data (gp_app_data_history).
--   3. Un garde-fou : un UPDATE qui vide (ou presque) une agence contenant déjà des
--      données est REFUSÉ (erreur shrink_refused), quel que soit le client
--      (application, SQL Editor, script).
--   4. gp_update_app_data accepte un paramètre p_allow_shrink (admin uniquement) pour
--      autoriser volontairement une grosse suppression.
--   5. Deux fonctions admin : lister / restaurer une version de l'historique.

begin;

-- 1) Compteur d'enregistrements -------------------------------------------
create or replace function public.gp_count_records(p jsonb)
returns integer
language sql
immutable
as $$
  select coalesce(sum(
           case when jsonb_typeof(p -> k) = 'array'
                then jsonb_array_length(p -> k) else 0 end
         ), 0)::integer
    from unnest(array[
      'employes','proprietaires','locataires','biens','locatives','contrats',
      'paiements','depenses','fichiers','messages','conversations','agenda'
    ]) as k;
$$;

-- 2) Historique -----------------------------------------------------------
create table if not exists public.gp_app_data_history (
  hid          bigserial primary key,
  agency_id    uuid,
  row_id       text,
  version      bigint,
  payload      jsonb not null,
  record_count integer not null default 0,
  saved_at     timestamptz not null default now(),
  saved_by     uuid
);
create index if not exists idx_gp_app_data_history_agency
  on public.gp_app_data_history (agency_id, hid desc);

-- Personne ne lit/écrit cette table directement depuis le navigateur :
-- uniquement via les fonctions security definer ci-dessous.
alter table public.gp_app_data_history enable row level security;
revoke all on table public.gp_app_data_history from anon, authenticated;
revoke all on sequence public.gp_app_data_history_hid_seq from anon, authenticated;

-- 3) Garde-fou + historique (déclenché avant chaque UPDATE de gp_app_data) -----
create or replace function public.gp_app_data_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_n int := public.gp_count_records(old.payload);
  new_n int := public.gp_count_records(new.payload);
  last_save timestamptz;
begin
  -- Refus d'un écrasement massif (vide, ou perte de plus de 80 % des enregistrements).
  if old_n >= 5
     and coalesce(current_setting('gp.allow_shrink', true), '') <> 'on'
     and (new_n = 0 or new_n < old_n * 0.2) then
    raise exception 'shrink_refused: % -> % enregistrements', old_n, new_n
      using errcode = 'P0001';
  end if;

  -- Historique : on conserve l'ancienne version si elle contenait des données, au plus
  -- une toutes les 10 minutes, et TOUJOURS quand le nombre d'enregistrements diminue.
  if old_n > 0 and old.payload is distinct from new.payload then
    select max(saved_at) into last_save
      from public.gp_app_data_history where agency_id is not distinct from old.agency_id;
    if last_save is null or last_save < now() - interval '10 minutes' or new_n < old_n then
      insert into public.gp_app_data_history
        (agency_id, row_id, version, payload, record_count, saved_by)
      values
        (old.agency_id, old.id, old.version, old.payload, old_n, auth.uid());

      -- Garde les 200 dernières versions par agence.
      delete from public.gp_app_data_history h
       where h.agency_id is not distinct from old.agency_id
         and h.hid not in (
           select hid from public.gp_app_data_history
            where agency_id is not distinct from old.agency_id
            order by hid desc limit 200);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_gp_app_data_guard on public.gp_app_data;
create trigger trg_gp_app_data_guard
  before update on public.gp_app_data
  for each row execute function public.gp_app_data_guard();

-- 4) gp_update_app_data avec p_allow_shrink ----------------------------------
drop function if exists public.gp_update_app_data(jsonb, bigint);

create or replace function public.gp_update_app_data(
  p_payload          jsonb,
  p_expected_version bigint,
  p_allow_shrink     boolean default false
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
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object';
  end if;

  -- Seul un admin peut autoriser volontairement une grosse suppression.
  if p_allow_shrink and v_role = 'admin' then
    perform set_config('gp.allow_shrink', 'on', true);
  else
    perform set_config('gp.allow_shrink', 'off', true);
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

revoke all on function public.gp_update_app_data(jsonb, bigint, boolean) from public;
grant execute on function public.gp_update_app_data(jsonb, bigint, boolean) to authenticated;

-- 5) Lister / restaurer l'historique (admin de l'agence) --------------------
create or replace function public.gp_list_app_data_history()
returns table(hid bigint, version bigint, saved_at timestamptz, record_count integer)
language sql stable security definer set search_path = public
as $$
  select h.hid, h.version, h.saved_at, h.record_count
    from public.gp_app_data_history h
   where h.agency_id = public.gp_v22_agency()
     and public.gp_v22_role() = 'admin'
   order by h.hid desc
   limit 200;
$$;

create or replace function public.gp_restore_app_data_history(p_hid bigint)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_agency  uuid := public.gp_v22_agency();
  v_payload jsonb;
  v_version bigint;
begin
  if public.gp_v22_role() <> 'admin' or v_agency is null then
    raise exception 'permission denied';
  end if;
  select payload into v_payload
    from public.gp_app_data_history
   where hid = p_hid and agency_id = v_agency;
  if v_payload is null then
    raise exception 'history version not found';
  end if;

  -- La version actuelle est elle-même archivée par le trigger avant remplacement.
  perform set_config('gp.allow_shrink', 'on', true);
  update public.gp_app_data
     set payload = v_payload, version = public.gp_app_data.version + 1,
         updated_by = auth.uid(), updated_at = now()
   where agency_id = v_agency
  returning public.gp_app_data.version into v_version;
  return v_version;
end;
$$;

revoke all on function public.gp_list_app_data_history() from public;
revoke all on function public.gp_restore_app_data_history(bigint) from public;
grant execute on function public.gp_list_app_data_history() to authenticated;
grant execute on function public.gp_restore_app_data_history(bigint) to authenticated;

commit;

-- Vérification :
--   select hid, version, saved_at, record_count from public.gp_app_data_history order by hid desc;
-- Restauration manuelle depuis le SQL Editor (choisir un hid avec record_count > 0) :
--   begin;
--   select set_config('gp.allow_shrink','on', true);
--   update public.gp_app_data a
--      set payload = h.payload, version = a.version + 1, updated_at = now()
--     from public.gp_app_data_history h
--    where h.hid = <HID> and a.agency_id = h.agency_id;
--   commit;
