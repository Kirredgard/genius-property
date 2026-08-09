# Beta Program V21

## Ajouts

- suivi agences beta
- feedback utilisateurs
- pages `beta.v21.html` et `feedback.v21.html`
- règles Firestore beta/feedback
- fallback localStorage

## Collections

```txt
betaProgram/{agencyId}
feedback/{feedbackId}
```

## Statuts beta

- candidate
- invited
- active
- paused
- completed

## Process beta recommandé

1. ajouter agence candidate
2. inviter owner/admin
3. activer feature flags
4. suivre feedback
5. corriger incidents
6. passer agence en completed
