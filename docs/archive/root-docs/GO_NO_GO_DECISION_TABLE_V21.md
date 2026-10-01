# Go / No-Go Decision Table V21

| Critère | Go si | No-Go si |
|---|---|---|
| Auth | Login/logout OK | Login impossible |
| Firestore | CRUD propriétaire/bien/locataire OK | permission-denied global |
| Storage | Upload/suppression test OK | storage/unauthorized global |
| Billing | Plan affiché + Stripe test OK | checkout impossible |
| Emails | Invitation envoyée | SMTP/API KO |
| Health | Rapport sans erreur critique | erreurs bloquantes |
| Status | services operational/degraded connu | down inconnu |
| Feedback | feedback enregistré | aucun retour possible |
| Rollback | procédure testée | rollback flou |
| Support | guide accessible | beta sans documentation |

## Décision recommandée

- **GO beta contrôlée** si tous les critères critiques Auth/Firestore/Storage/Health/Rollback sont OK.
- **NO-GO public launch** tant que Stripe, emails et monitoring externe ne sont pas validés en staging réel.
