# Audit Logs & Tracking V21

## Ajouts

- audit logs multi-agence
- tracking événements produit
- dashboard audit local
- règles Firestore audit
- tracking onboarding/team/billing
- tests audit/tracking

## Firestore

```txt
agencies/{agencyId}/auditLogs/{logId}
```

## Événements suivis

- page_view
- agency_created
- team_invite_created
- billing_upgrade

## Dashboard

```txt
saas-analytics.v21.html
```

## Prochaine étape

Ajouter monitoring infra et alerting centralisé.
