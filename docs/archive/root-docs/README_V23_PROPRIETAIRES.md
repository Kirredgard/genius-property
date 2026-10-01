# V24.0 — correction définitive Propriétaires

- Contrôleur CRUD unique, sans dépendance aux anciens IDs de formulaires.
- Création/modification/suppression par ID.
- Écriture locale atomique avant le cloud.
- Marqueur de données locales en attente (`gp_data_dirty_at`) pour empêcher un pull Supabase plus ancien d’écraser une modification.
- Push Supabase en `upsert` pour garantir la ligne `gp_app_data/main`.
- Reprise des modifications locales au prochain login si le push précédent a échoué.
