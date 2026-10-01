# Genius Property — refonte progressive

Cette refonte est volontairement réversible.

## Ordre d'exécution

1. Sauvegarder/exporter le JSON actuel.
2. Exécuter `supabase/migrations/001_security_and_concurrency.sql`.
3. Vérifier la connexion avec un compte existant.
4. Exécuter `supabase/migrations/002_relational_core.sql`.
5. Convertir l'export :
   `node scripts/refactor/migrate-json-export.mjs export.json ./migration-output`
6. Importer et contrôler les volumes avant de migrer les écrans.

## Sécurité

- Aucun utilisateur authentifié ne peut créer son propre profil.
- Un profil absent donne `anonymous`, jamais `admin`.
- L'ancienne table JSON n'est plus modifiable directement par le navigateur.
- Les écritures temporaires passent par `gp_update_app_data(payload, expected_version)`.
- Une écriture concurrente échoue explicitement au lieu d'écraser silencieusement l'autre.

## Limite volontaire

Les tables relationnelles gardent `legacy_data` pendant la transition. Les écrans existants ne sont pas basculés automatiquement sur ces tables tant que leurs relations métier n'ont pas été vérifiées. Cela évite une migration destructive.
