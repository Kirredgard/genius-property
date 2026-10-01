# V20 — Messages & Journal

Cette version unifie les pages Messages et Journal avec la même logique d'interface que les autres modules récents.

## Messages
- une seule page de messagerie ;
- conversations existantes conservées ;
- nouveau message dans un drawer latéral ;
- réponse directement dans la conversation ;
- suppression d'une conversation ;
- recherche et filtres Tous / Non lus / Urgents ;
- données `DB.messages` et `DB.conversations` conservées.

## Journal
- une seule vue chronologique ;
- recherche, filtre par action et module ;
- KPI simples ;
- détail d'une activité dans le même drawer latéral ;
- export CSV ;
- suppression du journal via confirmation ;
- données existantes `gp_auditlog` conservées.

Les anciens formulaires/modal HTML Messages et Journal ont été retirés du runtime principal. Les fonctions historiques du bundle legacy restent présentes uniquement pour compatibilité avec les données et modules non encore migrés.
