# Permissions UI V21

## Ajouts

- `js/v21/permissions/permission-ui.ts`
- application automatique des permissions sur les boutons/actions
- attribut `data-requires-permission`
- styles disabled
- tests permissions UI

## Permissions

```html
<button data-requires-permission="write">Créer</button>
<button data-requires-permission="admin">Supprimer</button>
<button data-requires-permission="billing">Facturation</button>
```

## Console

```js
GPV21PermissionUI.apply()
GPV21PermissionUI.has('write')
```

## Prochaine étape

Brancher les permissions directement dans les services pour empêcher aussi l’écriture côté logique, pas seulement côté UI.
