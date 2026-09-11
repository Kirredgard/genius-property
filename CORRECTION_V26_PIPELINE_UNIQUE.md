# V26 — pipeline de sauvegarde unique

Cause racine confirmée : `GPDB.writeRaw()` appelait `GPStorage.writeRaw()`, et l'adapter Supabase exécutait lui-même un `push()`. En parallèle, `GPDB.save()` poussait également. Cela créait plusieurs écritures complètes de `gp_app_data/main`, parfois avec des snapshots différents. Un snapshot tardif pouvait donc remplacer une modification récente.

Correction :
- `GPDB.save()` est désormais l'unique propriétaire de la persistance et du push cloud.
- `supabase-adapter.writeRaw()` est cache-only.
- `firebase.js` ne monkey-patche plus `GPDB.save()`.
- Le CRUD propriétaire passe par `GPDB.save()` et non par des écritures directes de localStorage.
- Un pull cloud à révision égale ou inférieure ne peut plus remplacer le local.
- La révision monotone `meta.localRevision` reste la barrière anti-snapshot-obsolète.

Le correctif est global : les autres pages qui utilisent `GPDB.save()` bénéficient du même pipeline.
