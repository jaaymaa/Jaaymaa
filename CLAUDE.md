# CLAUDE.md — Guide de reprise Jaayma.sn

> Ce fichier est le point d'entrée pour toute session Claude Code sur ce dépôt.
> Lis-le entièrement avant toute action de code.

---

## 🗂️ État du projet

- **Phase actuelle :** Phase 0 ✅ (Audit complet — novembre 2026)
- **Phase en cours :** Phase 1 ⬜ (Infrastructure D1 + Drizzle)
- **Tracker détaillé :** [docs/PROGRESS.md](./docs/PROGRESS.md)

---

## 🛠️ Stack & Versions exactes

| Outil | Version |
|---|---|
| Next.js | 16.4.2 (App Router, Server Components, Server Actions) |
| React | 19.0.0 |
| TypeScript | 5.x (strict) |
| @opennextjs/cloudflare | 1.20.8 |
| Wrangler | 4.147.0 |
| Tailwind CSS | 3.4.1 |
| Zustand | 5.0.15 |
| Vitest | 5.0.3 |
| Vite | 8.3.2 |
| ulid | 3.0.2 |
| lucide-react | 1.52.0 |
| Drizzle ORM | ❌ PAS ENCORE INSTALLÉ — à faire en Phase 1 |

**Runtime cible :** Cloudflare Workers (via `@opennextjs/cloudflare`)

---

## ⚡ Commandes

```bash
# Développement local (Turbopack, sans bindings Cloudflare)
npm run dev

# Développement avec bindings Cloudflare réels (nécessite CF_REMOTE_DEV=true)
CF_REMOTE_DEV=true npm run dev

# Build Next.js standard
npm run build

# Build pour Cloudflare Workers (OpenNext)
npm run build:cloudflare

# Preview local complet (Workers + D1 + R2 simulés)
npm run preview

# Déployer en production
npm run deploy

# Lint ESLint
npm run lint

# Tests unitaires (Vitest, mode run)
npm run test

# Tests en mode watch
npm run test:watch
```

### Commandes Wrangler D1

```bash
# Appliquer migrations locales
npx wrangler d1 execute jaayma-db --local --file=./db/migrations/<fichier>.sql

# Appliquer migrations en production
npx wrangler d1 execute jaayma-db --remote --file=./db/migrations/<fichier>.sql

# Générer une migration Drizzle (après Phase 1)
npx drizzle-kit generate

# Inspecter la D1 locale
npx wrangler d1 execute jaayma-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 🔑 Accès aux bindings Cloudflare

Dans les Server Components, Server Actions et Route Handlers, utilise **toujours** :

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Accès asynchrone (recommandé dans App Router)
const { env } = await getCloudflareContext({ async: true });

// Binding D1
const db = env.DB; // D1Database

// Binding R2 (cache OpenNext uniquement — NE PAS UTILISER pour les médias)
const cache = env.NEXT_INC_CACHE_R2_BUCKET; // R2Bucket

// Binding ASSETS (fichiers statiques)
const assets = env.ASSETS;
```

> ⚠️ Ne jamais lire `process.env.DB` ou similaire — les bindings D1/R2 ne sont
> **pas** des variables d'environnement, ils sont accessibles uniquement via
> `getCloudflareContext()` dans le runtime Workers.

---

## 📐 Conventions du projet

### Langue
- **UI / Contenus / Messages utilisateurs :** Français (Sénégal), tutoiement
- **Code source / identifiants / variables / commentaires techniques :** Anglais
- **Fuseau horaire affiché :** `Africa/Dakar` (GMT+0)

### Montants
- Tous les montants sont des **entiers en FCFA/XOF** (pas de centimes, pas de virgule)
- Format affichage : `18 500 FCFA` (via `formatFcfa()` dans `src/lib/money.ts`)
- Parsing : via `parseFcfa()` qui accepte `"18500"`, `"18 500"`, `"18.500"`
- **Jamais** stocker ou transmettre des flottants pour des montants

### Téléphones
- Format de stockage : `+221XXXXXXXXX` (E.164 international)
- Normalisation via `normalizePhone()` dans `src/lib/phone.ts`

### Images
- Formats acceptés upload : JPEG, PNG, WebP, AVIF, HEIC, HEIF
- Taille max : 8 MB par fichier
- Compression côté client recommandée : < 200 Ko WebP avant envoi
- Résolution via `getImageUrl()` dans `src/lib/images.ts`

### IDs
- Utiliser `ulid()` de la librairie `ulid` pour tous les nouveaux IDs métier

### Plans vendeurs
- `free` : produits actifs limités
- `pro` : 30 jours, fonctionnalités marketing activées
- `pro_plus` : 365 jours

---

## 🏗️ Architecture actuelle (Phase 0)

### Backend externe
- Toutes les opérations métier passent par `src/lib/api.ts`
- Backend : `https://madutech7-jaaymaa.hf.space` (Hugging Face Space / NestJS)
- Images : Neon Storage (S3-compatible), proxy via `/api/images/[...key]/route.ts`
- Upload : via `api.createImageUpload()` → signed URL Neon → PUT direct

### Auth actuelle
- Cookie `jaay_session` contient le **token JWT brut** du backend externe
- Validation : `api.getMe(token)` → backend externe à chaque requête protégée
- Session duration : 30 jours

### D1 actuelle
- Binding `DB` déclaré dans `wrangler.jsonc` → database `jaayma-db`
- **NON UTILISÉE** pour les données métier (Phase 1 à faire)
- Utilisée uniquement par OpenNext pour les Durable Objects de cache

### R2 actuelle
- Un seul bucket `jaayma-images` partagé pour :
  - Cache incrémental OpenNext (`NEXT_INC_CACHE_R2_BUCKET`)
  - ⚠️ Médias (non utilisé directement, Neon Storage est utilisé à la place)
- Problème : pas de séparation cache / médias → à corriger en Phase 1

---

## ⚠️ Règles absolues

1. **Ne jamais lire `.env`** — ce fichier contient des secrets réels
2. **Ne jamais commiter `.env`** — il est dans `.gitignore`
3. **Ne jamais migrer D1 sans sauvegarde** en production
4. **Ne jamais modifier `wrangler.jsonc`** sans valider l'impact sur les Durable Objects OpenNext
5. **Toujours vérifier les limites du plan Cloudflare gratuit** avant d'ajouter des appels D1 :
   - Lectures D1 : 5M/jour
   - Écritures D1 : 100K/jour
   - Workers : 100K requêtes/jour
6. **Ne jamais faire confiance aux calculs client** — recalculer les totaux côté serveur via `calculateOrderTotals()` dans `src/lib/orders.ts`

---

## 📁 Structure src/

```
src/
├── app/
│   ├── actions/          # Server Actions (admin, auth, checkout, order, product, shop, subscription, visit)
│   ├── api/              # Route Handlers (explore, images, upload, admin/analytics, shops/catalog.xml, cron)
│   ├── [shopSlug]/       # Pages boutique publique + checkout + commande
│   ├── espace/           # Pages vendeur protégées
│   ├── admin/            # Pages admin protégées
│   ├── connexion/        # Auth pages
│   ├── inscription/
│   └── layout.tsx        # Root layout (fonts, GoogleAnalytics, ServiceWorker, PWA)
├── components/           # Composants React réutilisables
├── lib/
│   ├── api.ts            # ⭐ Client HTTP vers backend externe (825 lignes)
│   ├── auth.ts           # Session cookie + getCurrentSellerContext()
│   ├── money.ts          # formatFcfa() / parseFcfa()
│   ├── orders.ts         # Business logic commandes + status transitions
│   ├── images.ts         # getImageUrl() — résolution clés → URLs
│   ├── phone.ts          # normalizePhone()
│   ├── slug.ts           # isAvailableSlug() / suggestSlug()
│   ├── plans.ts          # getEffectivePlan() / canActivateProduct()
│   └── __tests__/        # Tests Vitest
└── types/
    └── schema.ts         # Types TypeScript : Shop, Product, Order, OrderItem, User, Seller
```

---

## 🔗 Liens utiles

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Architecture actuelle et cible
- [docs/DECISIONS.md](./docs/DECISIONS.md) — Journal des décisions
- [docs/PROGRESS.md](./docs/PROGRESS.md) — Tracker de progression
- [docs/MIGRATION-PLAN.md](./docs/MIGRATION-PLAN.md) — Plan de migration api.ts → D1
- [docs/SKILLS-INSTALLED.md](./docs/SKILLS-INSTALLED.md) — Outils disponibles
