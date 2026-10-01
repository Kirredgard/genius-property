# V27 — Data Core authoritative

## Root cause fixed
The project had legacy modules writing `geniusproperty_db_clean_v1` directly and multiple modules pushing full-document snapshots to Supabase. A delayed/empty snapshot could advance the local revision and make a later legitimate edit look stale, causing the UI to reload an empty/stale document.

## V27 design
1. `GPDB.save()` is the authoritative local write path.
2. Every accepted save is mirrored to `geniusproperty_db_authoritative_v1`.
3. `GPDB.load()` compares revisions across the legacy key, authoritative snapshot and active storage cache, preferring the highest revision and repairing the legacy key.
4. `GPSupabase.push()` always reloads the latest authoritative GPDB snapshot before sending; a stale caller cannot push an old snapshot.
5. Legacy direct Supabase pushes were removed from runtime/owner/biens/crud-actions.
6. The cloud pull never replaces a local snapshot at the same revision.

## Diagnostic
`GPDataConsistency.snapshot()`
`GPDataConsistency.audit()`
`GPDB.authoritativeSnapshot()`

## Operational rule
All module CRUD operations may mutate `window.DB`, but only `GPDB.save()` is allowed to persist a database snapshot. Legacy direct writes to the primary raw key were removed from active CRUD paths.
