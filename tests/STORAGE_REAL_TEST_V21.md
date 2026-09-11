# Test Storage réel V21

## Page ajoutée

`storage-test.v21.html`

## Utilisation

```bash
npm run dev
```

Puis ouvrir :

`http://localhost:5173/storage-test.v21.html`

## Ce que la page teste

- initialisation Firebase Storage
- upload d’un fichier réel
- récupération URL publique/téléchargeable
- suppression du dernier fichier uploadé

## Si erreur `storage/unauthorized`

Vérifier les règles Firebase Storage.

## Si erreur configuration

Vérifier `.env.local`.

## Chemin utilisé

Les fichiers de test sont envoyés dans :

`test-uploads/manual-test/<filename>`
