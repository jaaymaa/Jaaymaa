# Journal des Décisions d'Architecture (ADR) — Jaayma.sn

> Ce document consigne les décisions structurantes prises pour l'évolution de Jaayma.sn vers une architecture Cloudflare autonome.

---

## ADR-001 : Maintien d'OpenNext Cloudflare comme adaptateur de déploiement
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Jaayma utilise actuellement Next.js 16.4.2 avec `@opennextjs/cloudflare` 1.20.8. Le prompt mentionne de ne pas basculer vers Vinext sans preuve documentée de blocage.
* **Décision :** Conserver `@opennextjs/cloudflare` pour exécuter Next.js App Router sur Cloudflare Workers.
* **Conséquences :** 
  - Préserve les configurations existantes dans `open-next.config.ts`, `worker.js`, et les bindings Durable Objects pour le cache incrémental et le tag cache.
  - L'accès aux bindings Cloudflare se fait via `getCloudflareContext({ async: true })` de `@opennextjs/cloudflare`.

---

## ADR-002 : Adoption de Drizzle ORM avec Cloudflare D1
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Le backend externe NestJS + PostgreSQL (sur Hugging Face) doit être remplacé par Cloudflare D1 (SQLite serverless). Un ORM TypeScript typé et performant au runtime Workers est requis.
* **Décision :** Utiliser `drizzle-orm` (driver `drizzle-orm/d1`) avec `drizzle-kit` pour la modélisation, le typage strict et la génération des migrations SQL.
* **Conséquences :**
  - Requêtes SQL compilées sans surcoût d'un moteur lourd (comme Prisma engine).
  - Migrations versionnées en SQL pur exécutables via `wrangler d1 migrations apply`.
  - Intégrité référentielle et index SQLite optimisés.

---

## ADR-003 : Séparation stricte des buckets R2 (Médias vs Cache OpenNext)
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Dans `wrangler.jsonc`, le binding `NEXT_INC_CACHE_R2_BUCKET` pointait sur le bucket `jaayma-images`. Cela mélangeait les métadonnées de cache Next.js et les photos des vendeurs/produits.
* **Décision :**
  - Conserver le bucket `jaayma-images` avec le binding dédié `MEDIA_BUCKET` exclusivement pour les photos de profil, logos, couvertures et images de produits.
  - Allouer un bucket distinct `jaayma-next-cache` sous le binding `NEXT_INC_CACHE_R2_BUCKET` pour le cache incrémental OpenNext.
* **Conséquences :** Aucune collision de clés, purge de cache isolée, contrôle d'accès et sécurité simplifiés.

---

## ADR-004 : Authentification par sessions cryptographiques et PBKDF2 en D1
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Le backend externe utilisait des tokens HMAC personnalisés validés à distance via `api.getMe()`.
* **Décision :**
  - Sessions stockées en D1 (`sessions`) avec token opaque aléatoire (64 chars hex/base64) côté client dans le cookie `jaay_session`.
  - Seul le hash SHA-256 du token est stocké dans D1 pour éviter toute fuite en cas de dump.
  - Hachage des mots de passe avec Web Crypto PBKDF2 (SHA-256 ou SHA-512) compatible avec le schéma historique `salt:hash:iterations`.
  - Cookie configuré en `HttpOnly`, `SameSite=Lax`, `Secure` en production, `Path=/`, durée 30 jours avec glissement/révocation.
* **Conséquences :** Indépendance totale du backend externe, révocation de session possible en base.

---

## ADR-005 : Montants monétaires en entiers FCFA / XOF
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Le FCFA n'a pas de sous-unité (pas de centimes). Les calculs avec nombres à virgule flottante (`Float`) risquent d'induire des erreurs d'arrondi.
* **Décision :** Tous les montants (prix des produits, frais de livraison, sous-totaux, totaux, abonnements) sont stockés et manipulés sous forme d'entiers stricts (`Int` SQLite/D1, type `number` entier en TS).
* **Conséquences :** Aucun calcul avec `parseFloat` pour les prix. Le serveur recalcule systématiquement tous les montants à la commande sans se fier aux totaux clients.

---

## ADR-006 : Paiements Wave / Orange Money manuels sans intégration externe
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Jaayma propose Wave, Orange Money et Espèces. Aucun contrat marchand automatique ni clé d'API de paiement n'a été fourni.
* **Décision :**
  - Conserver le modèle d'intention de paiement : le choix de Wave ou Orange Money enregistre le mode de paiement choisi et redirige vers le lien marchand ou affiche le numéro de la boutique.
  - Ne pas inventer d'API de confirmation automatique. Le vendeur met à jour manuellement le statut de paiement (`PAID`) dans son espace.
* **Conséquences :** Parcours simple, robuste et sans dépendances tierces fragiles.

---

## ADR-007 : Amorçage et contrôle des administrateurs via variable d'environnement
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** Comment identifier les administrateurs de la plateforme sans risquer de compromettre l'accès ou devoir créer une table complexe ?
* **Décision :**
  - La variable `ADMIN_PHONES` (liste de numéros normalisés séparés par des virgules) dans l'environnement Cloudflare Worker sert de source d'autorité pour les droits administrateur.
  - Le rôle est vérifié côté serveur sur chaque action et route `/admin/*`.
* **Conséquences :** Sécurité robuste sans risque d'escalade de privilèges via injection SQL ou modification client.

---

## ADR-008 : Suppression du ping keepalive externe et du cron associé
* **Date :** 01 novembre 2026
* **Statut :** Accepté
* **Contexte :** `worker.js` contenait un gestionnaire `scheduled` déclenché toutes les 5 minutes pour maintenir éveillé le Hugging Face Space externe (`https://madutech7-jaaymaa.hf.space/health`).
* **Décision :** Supprimer le bloc `scheduled` et le cron trigger dans `wrangler.jsonc` une fois D1 déployé.
* **Conséquences :** Fin de la dépendance à l'API externe, économie de requêtes et de complexité dans le Worker.

