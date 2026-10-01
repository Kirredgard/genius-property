# V22 Runtime Fix

This build adds one final runtime guard loaded after the legacy scripts.
It makes the active page deterministic for Biens, Propriétaires, Locations,
Encaissements, Dépenses, Messages, Journal and Équipe, and surfaces a visible
error instead of leaving a page blank when a renderer throws.

No business data is deleted or migrated by this patch.

For local testing, use a fresh folder and run `npm install` then `npm run dev`.
