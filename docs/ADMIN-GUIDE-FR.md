# Guide d'Administration de la Plateforme — Jaayma.sn 🇸🇳

> Ce guide détaille les fonctionnalités, les processus de gestion et les procédures opérationnelles réservés aux administrateurs de **Jaayma.sn**.

---

## 1. Accès & Droits d'Administration

### A. Comment accéder au panneau d'administration ?
L'interface d'administration est accessible à l'adresse :
```text
https://jaayma.sn/admin
(ou http://localhost:3000/admin en local)
```

### B. Attribution des privilèges administrateur
L'accès au panneau d'administration est doublement protégé :
1. Le compte utilisateur doit disposer du rôle `ADMIN` en base de données.
2. Le numéro de téléphone du compte (au format international canonique, ex: `+221771234567`) doit être présent dans la variable d'environnement Cloudflare `ADMIN_PHONES`.

Pour ajouter ou modifier un administrateur en production :
```bash
# Exemple de mise à jour de la variable secrète Cloudflare
npx wrangler secret put ADMIN_PHONES
# Saisir les numéros séparés par une virgule : +221771234567,+221781234567
```

---

## 2. Tableau de Bord Global (`/admin`)

La page d'accueil de l'administration offre une vue synthétique des indicateurs clés (KPIs) :
- **Nombre total de boutiques** et boutiques actives.
- **Nombre total de commandes** passées sur la plateforme.
- **Volume d'Affaires Brut (GMV)** calculé en FCFA.
- **Nombre de comptes vendeurs** enregistrés.
- **Alertes opérationnelles :** abonnements en attente de validation manuelle, commandes récentes.

---

## 3. Gestion des Boutiques (`/admin/boutiques`)

Cette section permet de superviser l'ensemble des vitrines créées sur Jaayma.

### Actions disponibles :
- **Recherche & Filtrage :** Rechercher par nom de boutique, slug ou numéro de téléphone du vendeur.
- **Changement de Statut :**
  - `ACTIVE` : Boutique en ligne, visible sur son lien unique et sur l'Explorer.
  - `INACTIVE` : Boutique temporairement désactivée par le vendeur.
  - `SUSPENDED` : Boutique suspendue par l'administration (non visible au public, accès vendeur bloqué en cas de non-respect des conditions d'utilisation).
- **Attribution d'un Plan :**
  - Passer manuellement une boutique sur l'offre `FREE`, `PRO` ou `PRO_PLUS`.
  - Fixer ou prolonger la date d'expiration d'un abonnement offert ou commercial.

---

## 4. Gestion des Abonnements & Paiements (`/admin/abonnements`)

Jaayma fonctionne selon un modèle de paiement **Wave / Orange Money manuel et vérifié** :
1. Le vendeur initie une demande d'abonnement Pro ou Pro+ depuis son espace (`/espace/abonnement`).
2. Le vendeur effectue le transfert Wave ou Orange Money vers le numéro officiel de facturation Jaayma (`BILLING_WAVE_NUMBER` ou `BILLING_ORANGE_MONEY_NUMBER`).
3. Le vendeur soumet la référence de transaction dans son formulaire.

### Procédure de validation pour l'administrateur :
1. Se rendre dans `/admin/abonnements`.
2. Consulter la liste des paiements ayant le statut `PENDING`.
3. Vérifier sur le téléphone marchand de facturation la réception effective du montant en FCFA correspondant à la référence de transaction fournie.
4. Cliquer sur **« Valider le paiement »** :
   - Le statut passe à `PAID`.
   - Le plan de la boutique est immédiatement mis à niveau (`PRO` ou `PRO_PLUS`).
   - La durée d'abonnement (30 jours ou 365 jours) est automatiquement ajoutée à la date courante de la boutique.
5. En cas de fraude ou de référence introuvable, cliquer sur **« Rejeter »** avec indication du motif.

---

## 5. Gestion des Commandes (`/admin/commandes`)

Permet de suivre les flux de commandes à l'échelle du pays :
- Visualisation de chaque commande : référence publique `JYM-XXXXXX`, nom de la boutique émettrice, coordonnées du client, adresse de livraison, montant total en FCFA et mode de paiement choisi.
- Les litiges ou signalements de commandes non honorées peuvent être analysés depuis cette vue.

---

## 6. Réglages de la Plateforme (`/admin/reglages`)

Cette interface permet d'ajuster les paramètres globaux de Jaayma en temps réel sans redéploiement :

### A. Fonctionnalités Publiques
- **Explorer Public (`explorer_enabled`) :** Activer ou désactiver la page `/explorer` (annuaire public des boutiques et produits sénégalais).
- **Mode Maintenance (`maintenance_enabled`) :** Met l'ensemble de la plateforme en page d'attente soignée avec message informatif en français/wolof lors de migrations lourdes ou d'interventions planifiées.

### B. Tarification des Abonnements
- **Prix du Plan Pro :** Montant mensuel en FCFA (par défaut : 5 000 FCFA).
- **Prix du Plan Pro+ :** Montant mensuel en FCFA (par défaut : 12 000 FCFA).
Ces montants sont stockés en base D1 dans la table `platform_settings` et sont immédiatement appliqués aux nouveaux réabonnements.

---

## 7. Notifications & Diffusions (`/admin/notifications`)

Permet de communiquer avec la communauté des commerçants Jaayma :
- **Envoi d'un message broadcast :** Diffuse une notification à l'ensemble des vendeurs abonnés aux notifications push web (Web Push / VAPID).
- **Historique des diffusions :** Suivi des annonces déjà envoyées avec date, titre, message et taux de réception.

