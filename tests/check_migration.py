from pathlib import Path
p=Path(__file__).parents[1]/'supabase/migrations/20261104_gp_record_versions.sql'
s=p.read_text()
checks={
 'table agence/collection/id': 'primary key (agency_id, collection, record_id)' in s,
 'version attendue': 'p_expected_version bigint' in s,
 'conflit explicite': 'record_conflict' in s,
 'suppression logique': 'deleted_at timestamptz' in s,
 'RLS activée': 'enable row level security' in s,
 'aucun accès anon': 'from public, anon' in s,
 'RPC authentifiée': 'to authenticated' in s,
 'snapshot legacy non touché': 'update public.gp_app_data' not in s.lower(),
}
for name,ok in checks.items(): print(('OK' if ok else 'FAIL')+' - '+name)
if not all(checks.values()): raise SystemExit(1)
