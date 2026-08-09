# Email API V21

Endpoints :

- `POST /api/emails/send-invite`
- `POST /api/emails/send-welcome`
- `POST /api/emails/send-billing-status`

Variables :

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Genius Property <noreply@domain.com>"
```


Sécurité :

- Les endpoints `send-invite`, `send-welcome` et `send-beta-welcome` exigent un Firebase ID token et un rôle `owner`/`admin` sur `agencyId`.
- `send-billing-status` est réservé aux appels backend avec `X-Internal-API-Key: $EMAIL_API_INTERNAL_SECRET`.
- Ne jamais exposer `EMAIL_API_INTERNAL_SECRET` dans un fichier `VITE_*` ou dans le frontend.
