-- Genius Property — modèle relationnel cible.
-- Les colonnes legacy_data servent uniquement de filet de sécurité pendant la migration.
-- Une fois les écrans migrés, elles peuvent être supprimées progressivement.

begin;

create table if not exists public.proprietaires (
  id text primary key,
  nom text,
  prenom text,
  email text,
  telephone text,
  adresse text,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.biens (
  id text primary key,
  nom text,
  type text,
  adresse text,
  proprietaire_id text references public.proprietaires(id) on update cascade on delete set null,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.locataires (
  id text primary key,
  nom text,
  prenom text,
  email text,
  telephone text,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.contrats (
  id text primary key,
  bien_id text references public.biens(id) on update cascade on delete set null,
  locataire_id text references public.locataires(id) on update cascade on delete set null,
  statut text,
  date_debut date,
  date_fin date,
  loyer numeric,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.paiements (
  id text primary key,
  contrat_id text references public.contrats(id) on update cascade on delete set null,
  montant numeric,
  paye numeric,
  reste numeric,
  statut text,
  date date,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.depenses (
  id text primary key,
  bien_id text references public.biens(id) on update cascade on delete set null,
  montant numeric,
  date date,
  type text,
  legacy_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_biens_proprietaire on public.biens(proprietaire_id);
create index if not exists idx_contrats_bien on public.contrats(bien_id);
create index if not exists idx_contrats_locataire on public.contrats(locataire_id);
create index if not exists idx_paiements_contrat on public.paiements(contrat_id);
create index if not exists idx_depenses_bien on public.depenses(bien_id);

-- RLS : aucun accès anonyme. Les droits fins seront renforcés après la migration des écrans.

do $$
declare
  t text;
begin
  foreach t in array array['proprietaires','biens','locataires','contrats','paiements','depenses'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists gp_rel_select on public.%I', t);
    execute format('drop policy if exists gp_rel_write on public.%I', t);
    execute format('create policy gp_rel_select on public.%I for select to authenticated using (public.gp_v22_role() in (''admin'',''agent'',''comptable'',''readonly'',''lecture''))', t);
    execute format('create policy gp_rel_write on public.%I for all to authenticated using (public.gp_v22_role() in (''admin'',''agent'',''comptable'')) with check (public.gp_v22_role() in (''admin'',''agent'',''comptable''))', t);
  end loop;
end $$;

commit;
