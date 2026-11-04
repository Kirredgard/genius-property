# Tests de sécurité de synchronisation

Exécuter depuis la racine du projet :

```bash
node tests/sync-safety/tombstones.test.cjs
```

Ce test vérifie la fusion des snapshots et la conservation d'un marqueur de suppression ancien. Il ne remplace pas un test multi-appareils contre Supabase.
