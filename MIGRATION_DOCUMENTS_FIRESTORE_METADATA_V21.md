# Documents Firestore Metadata V21

## Ajouts

- `document-metadata.service.ts`
- `uploadAndSaveBusinessDocument`
- tests metadata
- façade documents enrichie

## Objectif

Chaque fichier uploadé dans Storage peut maintenant avoir une trace dans Firestore :

- chemin Storage
- URL
- type de document
- entité liée
- taille
- date upload

## Prochaine étape

Brancher l’UI documents pour afficher la liste depuis `listDocumentMetadata`.
