# Employés — formulaire V18

Le formulaire « Nouvel employé » utilise maintenant le même drawer que les autres modules de l'application.

- un seul drawer pour création et modification ;
- fermeture par X, Annuler, clic sur le fond et Échap ;
- données existantes préremplies en modification ;
- l'ID de l'employé est conservé lors d'une modification ;
- création du compte via `GPFirebaseAuth.createEmployeeAccount` ;
- rôle, statut et permissions regroupés dans le même formulaire ;
- photo conservée si aucune nouvelle photo n'est choisie ;
- les anciens drawers/scripts employés ont été retirés du runtime.

Le script V18 est chargé en dernier afin que les anciens `editRow` génériques ne puissent pas reprendre la main sur les employés.
