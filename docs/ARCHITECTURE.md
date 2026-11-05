# Architecture Jaayma.sn

> Document vivant — mis à jour à chaque changement d'architecture significatif.
> Dernière mise à jour : Phase 0 Audit (novembre 2026)

---

## 1. Vue d'ensemble

Jaayma.sn est une plateforme e-commerce mobile-first pour commerçants sénégalais.
Elle tourne entièrement sur **Cloudflare Workers** via `@opennextjs/cloudflare`.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Cloudflare Worker (jaayma-sn)               │   │
│  │                                                           │   │
│  │  Next.js App Router (OpenNext adapter)                   │   │
│  │  ├── Server Components                                    │   │
│  │  ├── Server Actions                                       │   │
│  │  └── Route Handlers (API routes)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                        │
│          ┌──────────────┼──────────────┐                        │
│          ▼              ▼              ▼                         │
│  ┌──────────────┐ ┌──────────┐ ┌────────────┐                   │
│  │  D1 (SQLite) │ │  R2      │ │  ASSETS    │                   │
│  │  jaayma-db   │ │  bucket  │ │  (static)  │                   │
│  │  [NON UTILISÉ│ │  (cache  │ │            │                   │
│  │   métiermen] │ │  OpenNext│ │            │                   │
│  └──────────────┘ └──────────┘ └────────────┘                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Durable Objects (OpenNext cache)                        │   │
│  │  ├── DOQueueHandler (NEXT_CACHE_DO_QUEUE)                │   │
│  │  └── DOShardedTagCache (NEXT_TAG_CACHE_DO_SHARDED)       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼ HTTP / fetch()
┌─────────────────────────────────────────────────────────────────┐
│           Backend Externe (Hugging Face Space)                   │
│       https://madutech7-jaaymaa.hf.space                        │
│                                                                  │
│  NestJS API                                                      │
│  ├── /auth/*         — Auth JWT                                  │
│  ├── /shops/*        — CRUD boutiques                            │
│  ├── /products/*     — CRUD produits                             │
│  ├── /orders/*       — CRUD commandes                            │
│  ├── /uploads/*      — Génération signed URLs Neon Storage       │
│  ├── /subscriptions/*— Paiements Wave/OM                         │
│  ├── /admin/*        — Back-office admin                         │
│  └── /notifications/*— Push VAPID                                │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Neon Storage (S3-compatible)                        │
│    Stockage des images : logos, covers, products, misc          │
│    Accès via signed URLs temporaires                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Bindings Cloudflare (wrangler.jsonc)

| Binding | Type | Nom | Usage actuel | Usage cible |
|---|---|---|---|---|
| `DB` | D1 Database | `jaayma-db` | ❌ Non utilisé métier | ✅ Toutes données métier |
| `NEXT_INC_CACHE_R2_BUCKET` | R2 Bucket | `jaayma-images` | Cache OpenNext | ⚠️ À séparer |
| `ASSETS` | Assets | `.open-next/assets` | Fichiers statiques | Inchangé |
| `WORKER_SELF_REFERENCE` | Service | `jaayma-sn` | Auto-référence cron | Inchangé |
| `NEXT_CACHE_DO_QUEUE` | Durable Object | `DOQueueHandler` | Cache OpenNext | Inchangé |
| `NEXT_TAG_CACHE_DO_SHARDED` | Durable Object | `DOShardedTagCache` | Cache tags Next.js | Inchangé |

### Problème R2 actuel
Le bucket `jaayma-images` est utilisé pour le cache incrémental OpenNext via le
binding `NEXT_INC_CACHE_R2_BUCKET`. Il n'y a **pas** de second bucket dédié aux
médias métier (les images sont stockées sur Neon Storage, pas sur R2).

### Cible Phase 1
Créer un second bucket R2 `jaayma-media` dédié aux images vendeurs, et ne
laisser que `jaayma-next-cache` (renommé) pour OpenNext.

---

## 3. Variables d'environnement

### vars Wrangler (wrangler.jsonc — non-secrets)
| Variable | Valeur | Usage |
|---|---|---|
| `API_BASE_URL` | `https://madutech7-jaaymaa.hf.space` | Client API → backend |
| `NEXT_PUBLIC_API_URL` | `https://madutech7-jaaymaa.hf.space` | Idem (legacy) |
| `GA_MEASUREMENT_ID` | `G-2SVKFRMHT3` | Google Analytics |
| `NEXT_INC_CACHE_R2_PREFIX` | `next-incremental-cache` | Préfixe R2 OpenNext |

### secrets Wrangler (à configurer via `wrangler secret put`)
| Secret | Usage |
|---|---|
| `SUPPORT_WHATSAPP` | Numéro WhatsApp support |
| `BILLING_WAVE_NUMBER` | Numéro Wave abonnements |
| `ADMIN_PHONES` | Liste admins séparés par virgules |

### variables .env local (développement uniquement)
| Variable | Usage |
|---|---|
| `APP_URL` | URL locale (`http://localhost:3000`) |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | URL publique R2 (vide en local) |
| `NEXT_PUBLIC_BASE_URL` | URL canonique pour metadata OG |

---

## 4. Flux Auth

### État actuel (Phase 0)

```
Client Browser
    │
    │  POST /connexion (form)
    ▼
Server Action auth.ts::login()
    │
    │  POST /auth/login { phone, password }
    ▼
Backend NestJS
    │
    │  { user, shop, token: "JWT_RAW" }
    ▼
Server Action
    │
    │  setSessionCookie("jaay_session", JWT_RAW, httpOnly)
    ▼
Cookie Browser (30 jours, httpOnly, sameSite=lax)

──── Requête protégée ────

Client Browser
    │  Cookie: jaay_session=JWT_RAW
    ▼
Middleware (src/middleware.ts)
    │  Vérifie la présence du cookie (cookie-only, pas de validation JWT)
    │  Redirige /connexion si absent
    ▼
Server Component / Server Action
    │
    ├── getSessionToken()  → lit cookie jaay_session
    │
    └── getCurrentSellerContext()
            │
            │  GET /auth/me  (Bearer JWT_RAW)
            ▼
        Backend NestJS  ← validation JWT réelle
            │
            │  { user, shop }
            ▼
        Contexte vendeur disponible
```

### Cible Phase 2 (sessions locales D1)

```
Login:
  POST /connexion → hash PBKDF2-SHA256(password) → stocker dans D1
  Générer token cryptographique aléatoire (32 bytes hex)
  Stocker { token_hash: SHA256(token), user_id, expires_at } dans D1.sessions
  Cookie: jaay_session = raw_token (httpOnly, secure)

Validation:
  getSessionToken() → raw_token
  D1 query: SELECT user_id FROM sessions WHERE token_hash = SHA256(raw_token) AND expires_at > NOW()
  → pas d'appel réseau externe
```

---

## 5. Flux Upload Images

### État actuel (Phase 0 — Neon Storage)

```
Client Browser
    │  POST /api/upload  (multipart, ≤ 8MB)
    ▼
Route Handler /api/upload/route.ts
    │  Vérifie auth (getCurrentSellerId + getSessionToken)
    │  Valide type MIME + taille
    │
    │  POST /uploads/image { folder, fileName, contentType }
    ▼
Backend NestJS
    │
    │  { key, uploadUrl (signed), method, headers, expiresIn }
    ▼
Route Handler
    │
    │  PUT uploadUrl (signed Neon Storage)  ← fichier binaire
    ▼
Neon Storage (S3)
    │
    │  { key: "logos/xxx.webp" }
    ▼
Route Handler → { key } → Client

Client → stocke key dans FormData
Server Action → envoie key dans shopData.logoUrl / productData.images[].url
Backend → stocke key dans sa DB
```

### Résolution images (src/lib/images.ts)

```
getImageUrl(key)
  ├── Si key = URL absolue http/https → retourner tel quel (ou /api/images/ si localhost)
  └── Si key = chemin relatif ("logos/xxx.webp") → /api/images/logos/xxx.webp

/api/images/[...key] (src/app/api/images/[...key]/route.ts)
  → Edge cache Cloudflare (immutable si Cache-Control: public, immutable)
  → Proxy GET ${API_BASE_URL}/uploads/file/${key}
  → Neon Storage
```

### Cible Phase 3 (R2 direct)

```
Client → POST /api/upload
Route Handler → generate presigned R2 URL
              → PUT direct R2 depuis client (ou depuis Worker)
              → key = "jaayma-media/logos/xxx.webp"
src/lib/images.ts → getImageUrl(key)
  → ${NEXT_PUBLIC_R2_PUBLIC_URL}/${key}
  (URL publique R2, sans proxy Workers)
```

---

## 6. Cartographie api.ts → D1 (cible)

| Groupe | Fonction api.ts actuelle | Endpoint backend | Service D1 cible |
|---|---|---|---|
| **Auth** | `api.register()` | POST /auth/register | `createUser()` + `createSession()` |
| **Auth** | `api.login()` | POST /auth/login | `verifyPassword()` + `createSession()` |
| **Auth** | `api.getMe()` | GET /auth/me | `getSessionUser()` (D1 sessions) |
| **Shops** | `api.getShops()` | GET /shops | `db.select().from(shops)` |
| **Shops** | `api.getShopBySlug()` | GET /shops/:slug | `db.select().from(shops).where(eq(shops.slug, slug))` |
| **Shops** | `api.getShopByOwner()` | GET /shops/by-owner/:id | `db.select().from(shops).where(eq(shops.ownerId, id))` |
| **Shops** | `api.createShop()` | POST /shops | `db.insert(shops).values(...)` |
| **Shops** | `api.updateShop()` | PUT /shops/:id | `db.update(shops).set(...).where(eq(shops.id, id))` |
| **Products** | `api.getProductsByShop()` | GET /shops/:id/products | `db.select().from(products).where(eq(products.shopId, id))` |
| **Products** | `api.createProduct()` | POST /shops/:id/products | `db.insert(products).values(...)` |
| **Products** | `api.updateProduct()` | PUT /products/:id | `db.update(products).set(...).where(...)` |
| **Products** | `api.deleteProduct()` | DELETE /products/:id | `db.delete(products).where(...)` |
| **Orders** | `api.createOrder()` | POST /orders | `db.insert(orders).values(...)` |
| **Orders** | `api.getOrdersByShop()` | GET /orders/shops/:id | `db.select().from(orders).where(...)` |
| **Orders** | `api.updateOrderStatus()` | PATCH /orders/:id/status | `db.update(orders).set({ status }).where(...)` |
| **Admin** | `api.getAdminAccess()` | GET /admin/access | Vérif ADMIN_PHONES dans env |
| **Admin** | `api.getAdminOverview()` | GET /admin/overview | Agrégations D1 |
| **Admin** | `api.adminUpdateShopPlan()` | PATCH /admin/shops/:id/plan | `db.update(shops).set({ plan })` |
| **Push** | `api.savePushSubscription()` | POST /notifications/push-subscriptions | `db.insert(push_subscriptions)` |
| **Upload** | `api.createImageUpload()` | POST /uploads/image | R2 presigned URL (Phase 3) |

---

## 7. Schéma de données proposé (D1 / Drizzle)

Basé sur les types TypeScript de `src/types/schema.ts` et le comportement de `api.ts`.

```sql
-- users (vendeurs)
CREATE TABLE users (
  id         TEXT PRIMARY KEY,         -- ulid()
  phone      TEXT NOT NULL UNIQUE,     -- +221XXXXXXXXX E.164
  name       TEXT,
  password_hash TEXT NOT NULL,         -- PBKDF2-SHA256 + salt hex
  created_at INTEGER NOT NULL          -- Unix timestamp ms
);

-- sessions
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,         -- ulid()
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,     -- SHA-256 hex du token brut
  expires_at INTEGER NOT NULL,         -- Unix timestamp ms
  created_at INTEGER NOT NULL
);

-- shops
CREATE TABLE shops (
  id                TEXT PRIMARY KEY,  -- ulid()
  owner_id          TEXT NOT NULL REFERENCES users(id),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  headline          TEXT,
  area              TEXT,              -- quartier
  description       TEXT,
  category          TEXT,
  theme_color       TEXT DEFAULT 'blue',
  whatsapp          TEXT,              -- E.164
  wave_number       TEXT,
  wave_payment_link TEXT,
  orange_money_number TEXT,
  accepts_cash      INTEGER DEFAULT 1, -- BOOLEAN (0/1)
  delivery_fee      INTEGER DEFAULT 0, -- FCFA entier
  delivery_note     TEXT,
  logo_url          TEXT,              -- clé image (storage)
  cover_url         TEXT,
  facebook_pixel_id TEXT,
  tiktok_pixel_id   TEXT,
  plan              TEXT DEFAULT 'free', -- 'free' | 'pro' | 'pro_plus'
  plan_expires_at   INTEGER,           -- Unix timestamp ms
  status            TEXT DEFAULT 'DRAFT', -- 'DRAFT' | 'ACTIVE' | 'SUSPENDED'
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

-- products
CREATE TABLE products (
  id          TEXT PRIMARY KEY,
  shop_id     TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       INTEGER NOT NULL,        -- FCFA entier
  stock       INTEGER DEFAULT 0,
  position    INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'DRAFT',    -- 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  options_json TEXT,                   -- JSON stringifié des options
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- product_images
CREATE TABLE product_images (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,            -- clé image (storage)
  alt        TEXT,
  position   INTEGER DEFAULT 0
);

-- orders
CREATE TABLE orders (
  id               TEXT PRIMARY KEY,
  reference        TEXT NOT NULL UNIQUE, -- JY-XXXX
  shop_id          TEXT NOT NULL REFERENCES shops(id),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_address TEXT,
  note             TEXT,
  payment_method   TEXT,               -- 'wave' | 'orange_money' | 'cash'
  payment_status   TEXT DEFAULT 'pending', -- 'pending' | 'paid'
  subtotal         INTEGER NOT NULL,   -- FCFA entier
  delivery_fee     INTEGER DEFAULT 0,
  total            INTEGER NOT NULL,
  status           TEXT DEFAULT 'new', -- 'new' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

-- order_items
CREATE TABLE order_items (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  name       TEXT NOT NULL,            -- snapshot nom produit
  unit_price INTEGER NOT NULL,         -- snapshot prix
  quantity   INTEGER NOT NULL,
  options    TEXT                       -- snapshot option choisie
);

-- settings (clé-valeur admin)
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- push_subscriptions
CREATE TABLE push_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- shop_visits (déduplication quotidienne)
CREATE TABLE shop_visits (
  id         TEXT PRIMARY KEY,
  shop_id    TEXT NOT NULL REFERENCES shops(id),
  visitor_id TEXT NOT NULL,            -- cookie anonyme
  visited_at INTEGER NOT NULL,         -- debut de journée UTC (truncate to day)
  UNIQUE(shop_id, visitor_id, visited_at)
);
```

---

## 8. Routes & Pages

### Parcours public
| Route | Description |
|---|---|
| `/` | Page d'accueil |
| `/explorer` | Catalogue produits/boutiques |
| `/[shopSlug]` | Vitrine boutique publique |
| `/[shopSlug]/checkout` | Passage de commande (sans compte) |
| `/[shopSlug]/commande/[publicToken]` | Suivi de commande acheteur |

### Espace vendeur (protégé — middleware cookie)
| Route | Description |
|---|---|
| `/inscription` | Création de compte vendeur |
| `/connexion` | Connexion |
| `/espace` | Dashboard vendeur |
| `/espace/boutique` | Configuration boutique |
| `/espace/produits` | Gestion catalogue |
| `/espace/commandes` | Gestion commandes |
| `/espace/abonnement` | Abonnement Pro |

### Admin (protégé — middleware + vérification backend)
| Route | Description |
|---|---|
| `/admin` | Vue d'ensemble métriques |
| `/admin/boutiques` | Liste boutiques |
| `/admin/abonnements` | Abonnements Pro |
| `/admin/commandes` | Toutes commandes |
| `/admin/comptes` | Comptes vendeurs |
| `/admin/analytics` | Google Analytics embed |
| `/admin/notifications` | Historique push notifications |
| `/admin/reglages` | Configuration plateforme |

### Routes API
| Route | Description |
|---|---|
| `/api/explore` | Proxy explore vers backend |
| `/api/explore/shops` | Proxy shops explore |
| `/api/images/[...key]` | Proxy images Neon (edge-cached) |
| `/api/upload` | Upload image → signed URL Neon |
| `/api/admin/analytics/realtime` | Proxy analytics temps réel |
| `/api/shops/[shopSlug]/catalog.xml` | Flux XML produits |
| `/api/cron/keepalive` | Ping backend keepalive |

---

## 9. Middleware (src/middleware.ts)

- **Auth guard** : `/espace/**` et `/admin/**` → redirige `/connexion` si cookie absent
- **Redirect authentifié** : `/connexion` et `/inscription` → redirige `/espace` si cookie présent
- **Mode maintenance** : fetch backend `/admin/public-features` (cache 3s) → rewrite vers `/maintenance` (503)
- **En-têtes sécurité** : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` (prod)
- **Cache edge** : `/explorer` et `/{shopSlug}` → `Cloudflare-CDN-Cache-Control: public, max-age=15, stale-while-revalidate=30`

> ⚠️ Le middleware NE VALIDE PAS le JWT — il vérifie uniquement la présence du cookie.
> La validation réelle se fait côté serveur via `getCurrentSellerContext()` → `api.getMe()`.

---

## 10. Cron Worker (worker.js)

- Déclenchement : `*/5 * * * *`
- Action : ping `${API_BASE_URL}/health` pour garder le Hugging Face Space actif (évite le cold start)
- **À supprimer en Phase 2** quand le backend D1 local remplace le backend externe
