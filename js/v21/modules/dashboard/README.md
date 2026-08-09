# Dashboard Migration V21

Ce module représente le premier domaine migré depuis le legacy bundle.

## Objectifs

- Isoler la logique dashboard
- Supprimer la dépendance au bundle legacy
- Préparer TypeScript
- Préparer Vite code splitting
- Centraliser les services Firestore

## Structure

- services/
- ui/
- widgets/
- module bootstrap

## Étapes suivantes

1. Brancher Firestore réel
2. Migrer graphiques
3. Migrer navigation dashboard
4. Retirer le code dashboard du legacy bundle