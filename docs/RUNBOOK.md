# Guide des Opérations & Runbook — Jaayma.sn 🇸🇳

> Ce runbook documente l'ensemble des procédures d'exploitation, de développement local, de migration de base de données, de déploiement et de reprise après sinistre pour la plateforme **Jaayma.sn** sur Cloudflare Workers, Cloudflare D1 et Cloudflare R2.

---

## 1. Vue d'Ensemble de l'Architecture Opérationnelle

Jaayma.sn fonctionne en architecture **100% serverless autonome** :
- **Runtime :** Cloudflare Workers (Edge runtime mondial, réactivité immédiate à Dakar/Afrique de l'Ouest).
- **Adaptateur Next.js :** `@opennextjs/cloudflare` avec App Router.
- **Base de données :** Cloudflare D1 (SQLite serverless répliqué, accédé via Drizzle ORM).
- **Stockage Objets (Médias) :** Cloudflare R2 (`jaayma-images` via le binding `MEDIA_BUCKET`).
- **Cache Incrémental Next.js :** Cloudflare R2 (`jaayma-next-cache` via `NEXT_INC_CACHE_R2_BUCKET`).
- **Aucune dépendance externe :** Plus de serveur NestJS, plus de Hugging Face, plus de Neon.

---

## 2. Prérequis & Environnement de Développement

### Outils requis
- **Node.js :** v20.x LTS ou v22.x LTS
- **npm :** v10.x+
- **Wrangler CLI :** inclus en dépendance de développement (`npx wrangler`)
- **Git**

### Variables d'environnement locales (`.env`)
Créer un fichier `.env` à la racine (copier `.env.example`) :
```ini
APP_URL=http://localhost:3000
ADMIN_PHONES=+221771234567,+221781234567
SUPPORT_WHATSAPP=+221771234567
BILLING_WAVE_NUMBER=+221771234567
BILLING_ORANGE_MONEY_NUMBER=+221771234567
```

> [!NOTE]
> `API_BASE_URL` et `NEXT_PUBLIC_API_URL` sont dépréciées et ne sont plus utilisées par l'application.

---

## 3. Procédures Quotidiennes de Développement

### A. Installation des dépendances
```bash
npm install
```

### B. Initialisation de la base de données D1 locale
Wrangler simule Cloudflare D1 localement dans `.wrangler/state/v3/d1`.

1. **Appliquer les migrations SQL Drizzle :**
   ```bash
   npx wrangler d1 migrations apply jaayma-db --local
   ```
2. **Insérer le seed de démonstration (idempotent) :**
   ```bash
   npx tsx drizzle/seeds/demo.ts
   ```

### C. Démarrer le serveur Next.js en développement
```bash
npm run dev
```
L'application démarre sur `http://localhost:3000`.
- Vitrine de démo : `http://localhost:3000/awa-couture`
- Explorer : `http://localhost:3000/explorer`
- Espace Vendeur : `http://localhost:3000/espace`
- Administration : `http://localhost:3000/admin` (accessible avec l'un des numéros listés dans `ADMIN_PHONES`)

---

## 4. Gestion des Schémas et Migrations D1

Le schéma Drizzle est défini dans `src/db/schema.ts`.

### Générer une nouvelle migration après modification du schéma
```bash
npx drizzle-kit generate
```
Cette commande crée un nouveau fichier SQL versionné dans `drizzle/migrations/XXXX_nom_migration.sql`.

### Appliquer les migrations
- **En local :**
  ```bash
  npx wrangler d1 migrations apply jaayma-db --local
  ```
- **En prévisualisation / staging :**
  ```bash
  npx wrangler d1 migrations apply jaayma-db --preview
  ```
- **En production :**
  ```bash
  npx wrangler d1 migrations apply jaayma-db --remote
  ```

> [!CAUTION]
> Ne jamais exécuter de migration destructrice (`DROP TABLE`, `ALTER COLUMN` supprimant des données) sur l'environnement distant sans avoir préalablement sauvegardé la base avec un export D1.

---

## 5. Suite de Validation & Contrôle Qualité

Avant tout commit ou déploiement, exécuter la suite complète de vérification :

```bash
# 1. Vérification du formatage et des règles ESLint
npm run lint

# 2. Vérification statique des types TypeScript
npx tsc --noEmit

# 3. Exécution des tests unitaires (85+ tests)
npm test

# 4. Compilation de production Next.js
npm run build

# 5. Compilation du bundle Cloudflare Worker OpenNext
npm run build:cloudflare
```

Tous les scripts doivent se terminer avec le code de sortie `0`.

---

## 6. Déploiement Cloudflare (Prévisualisation & Production)

### Étape 1 : Création des ressources Cloudflare (Une seule fois)

1. **Créer la base de données D1 :**
   ```bash
   npx wrangler d1 create jaayma-db
   ```
   Noter l'`id` retourné et le renseigner dans `wrangler.jsonc` au niveau de `database_id`.

2. **Créer les deux buckets R2 distincts :**
   ```bash
   # Bucket pour les images et médias utilisateurs
   npx wrangler r2 bucket create jaayma-images

   # Bucket pour le cache incrémental Next.js OpenNext
   npx wrangler r2 bucket create jaayma-next-cache
   ```

### Étape 2 : Configuration des secrets Cloudflare
Configurer les variables d'environnement de production :
```bash
npx wrangler secret put ADMIN_PHONES
npx wrangler secret put SUPPORT_WHATSAPP
npx wrangler secret put BILLING_WAVE_NUMBER
npx wrangler secret put BILLING_ORANGE_MONEY_NUMBER
```

### Étape 3 : Application des migrations D1 sur la production
```bash
npx wrangler d1 migrations apply jaayma-db --remote
```

### Étape 4 : Déploiement de l'application
```bash
npm run deploy
```
La commande compile le bundle OpenNext et le publie sur Cloudflare Workers via Wrangler.

---

## 7. Sauvegarde, Restauration et Plan de Reprise d'Activité (PRA)

### A. Sauvegarde automatique et manuelle de Cloudflare D1
Cloudflare D1 intègre la fonctionnalité Time Travel (restauration à n'importe quel point des 30 derniers jours).

Pour créer un export SQL complet de sécurité :
```bash
npx wrangler d1 export jaayma-db --remote --output=./backups/d1-backup-$(date +%Y%m%d-%H%M%S).sql
```

### B. Restauration d'une sauvegarde D1
Pour réimporter un export SQL dans D1 :
```bash
npx wrangler d1 execute jaayma-db --remote --file=./backups/d1-backup-XXXXXX.sql
```

### C. Restauration via D1 Time Travel
En cas d'erreur opérationnelle (ex: suppression accidentelle), restaurer la base à un timestamp précis :
```bash
# Obtenir les bookmarks disponibles
npx wrangler d1 time-travel info jaayma-db --remote

# Restaurer à un bookmark ou un timestamp donné
npx wrangler d1 time-travel restore jaayma-db --remote --timestamp="2026-11-01T15:00:00Z"
```

---

## 8. Dépannage & Diagnostic (Troubleshooting)

### Problème 1 : Erreur de binding D1 ou R2 manquant au démarrage local
- **Symptôme :** `getDb()` ou `getMediaBucket()` lève une exception indiquant que le binding n'est pas trouvé.
- **Cause :** Wrangler n'a pas initialisé l'état local dans `.wrangler/state`.
- **Solution :**
  Exécuter `npx wrangler d1 migrations apply jaayma-db --local` pour initialiser le conteneur SQLite local.

### Problème 2 : Images non affichées ou erreur 404 sur `/api/images/...`
- **Symptôme :** Les vignettes de produits ou logos renvoient une 404.
- **Cause :** L'image n'a pas été uploadée dans le bucket R2 local ou la clé R2 ne correspond pas.
- **Solution :**
  Vérifier la route `/api/images/[...key]`. En local sans R2 émulé configuré, le composant utilise des fallbacks visuels élégants SVG. En production, vérifier que le bucket `jaayma-images` est bien lié avec la variable `MEDIA_BUCKET`.

### Problème 3 : Accès administrateur refusé (`/admin` redirige ou affiche 403)
- **Symptôme :** Un utilisateur connecté ne peut pas accéder aux pages `/admin/*`.
- **Cause :** Le numéro de téléphone de son compte vendeur ne figure pas dans `ADMIN_PHONES`.
- **Solution :**
  Vérifier le format international normalisé du numéro (ex: `+221771234567`). S'assurer qu'il est présent dans la variable `ADMIN_PHONES` (séparé par des virgules si plusieurs numéros).

### Problème 4 : Échec de build OpenNext sous Windows
- **Symptôme :** Avertissement sur les liaisons de fichiers ou mémoire lors de `npm run build:cloudflare`.
- **Solution :**
  OpenNext recommande WSL (Windows Subsystem for Linux) pour les builds de déploiement continu. Dans l'environnement Windows natif, `npm run build:cloudflare` utilise `opennextjs-cloudflare build` configuré dans `open-next.config.ts`.

