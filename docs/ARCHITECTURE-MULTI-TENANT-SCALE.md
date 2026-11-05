# Architecture Multi-Tenant & Stratégie de Montée en Charge — Jaaymaa 🇸🇳

> **Statut :** Spécification d'Architecture Cible & Plan Directeur  
> **Auteur :** Antigravity Engineering  
> **Date :** Novembre 2026  
> **Cible :** 10 000 boutiques, 1 000 000 produits, 5 000 visiteurs simultanés (pic)  
> **Plateforme :** Cloudflare Edge-First (Next.js 16 via OpenNext, Cloudflare D1, R2, KV, Queues, Durable Objects, WAF, Cloudflare for SaaS)

---

## 1. Audit Technique de l'Existant & Bilan de Compatibilité

### 1.1. Historique & Situation Actuelle
Initialement conceptualisé avec un backend externe NestJS et une base Neon PostgreSQL, le projet a été **entièrement rapatrié sur Cloudflare Workers** afin d'éliminer la latence transcontinentale, supprimer les coûts de serveurs traditionnels et fournir un temps de réponse minimal aux utilisateurs sénégalais (via le point de présence Cloudflare DKR à Dakar).

| Composant | Ancien Système (Legacy) | État Actuel Déployé (Phase 7) | Cible Multi-Tenant Scale (10k) |
|---|---|---|---|
| **Runtime** | Node.js sur Hugging Face Space | Cloudflare Workers (`jaayma-sn`) | Cloudflare Workers Multi-Zone / for SaaS |
| **Framework** | Next.js 16 + NestJS externe | Next.js 16.4.2 via `@opennextjs/cloudflare` | Next.js 16 App Router Multi-Tenant Unifié |
| **Base de Données** | Neon Serverless PostgreSQL | Cloudflare D1 unique (`jaayma-db`) | **10 Bases D1 Shardées** (1 Control Plane + 9 Shards) |
| **Stockage Médias** | Neon S3-compatible | Cloudflare R2 (`jaayma-images`) | Cloudflare R2 avec hiérarchie multi-tenant & Direct Upload |
| **Cache App** | Inexistant / Mémoire Node.js | R2 (`jaayma-next-cache`) + Durable Objects | Cloudflare KV (routage + configs) + DO + Cache API |
| **Files Asynchrones** | Inexistantes | Exécution synchrone & Server Actions | Cloudflare Queues (Workers Paid) / waitUntil (Free) |
| **Authentification** | JWT backend externe | PBKDF2-SHA512 (100k itér.) + Sessions D1 | Sessions D1 Control Plane + JWT Edge léger en lecture |

### 1.2. Inventaire des 12 Tables Actuelles
Le schéma unifié Drizzle SQLite comprend actuellement :
1. `users` : Comptes commerçants et administrateurs.
2. `sessions` : Jetons cryptographiques de session hachés en SHA-256 (`token_hash`).
3. `shops` : Profil, slug, plan, coordonnées Wave/Orange Money, personnalisation de thème.
4. `products` : Fiche produit, prix en FCFA/XOF, options JSON, stock.
5. `product_images` : Clés R2 et positions des images de galerie.
6. `orders` : Commandes, références `JYM-XXXXXX`, jeton public imprévisible `publicToken`, statut.
7. `order_items` : Lignes d'articles et snapshot du prix au moment de l'achat.
8. `subscriptionPayments` : Traçabilité des paiements d'abonnement commerçant (Wave, OM).
9. `platformSettings` : Réglages globaux (maintenance, explorer, prix des plans).
10. `shopVisits` : Horodatage des visites pour analytics boutique.
11. `pushSubscriptions` : Points de terminaison WebPush VAPID.
12. `adminBroadcasts` : Historique des annonces de plateforme.

### 1.3. Facteurs de Saturation du Modèle Monocellulaire (1 Base D1)
- **Quota de taille :** Une base D1 est limitée à 500 Mo en plan gratuit (10 Go en payant). À 10 000 boutiques et 1 million de produits, la taille estimée de la base brute dépasse 1,8 Go avec les index.
- **Quota d'écritures :** Le plan gratuit Cloudflare D1 accorde **100 000 écritures par jour** pour l'ensemble du compte. En période de forte affluence (Tabaski, Korité, soldes, rush de fin de mois), 10 000 boutiques générant chacune seulement 15 événements/jour atteindraient 150 000 écritures.
- **Concurrence & Verrous SQLite :** Bien que D1 gère les lectures concurrentes de manière distribuée, les écritures restent sérialisées au niveau du moteur SQLite sous-jacent. Le sharding horizontal divise la charge d'écriture par 9.

---

## 2. Architecture Globale Cloudflare Cible

### 2.1. Principes Fondamentaux
1. **Edge-First & Latence Minimale :** Traitement des requêtes au plus près des utilisateurs à Dakar et dans la sous-région.
2. **Isolation Stricte par `tenant_id` :** Aucune requête SQL de données métier ne s'exécute sans clause `tenant_id = ?`.
3. **Séparation Stricte du Control Plane et du Data Plane :** L'authentification et l'attribution des shards résident dans une base centrale ; les données d'exploitation (produits, commandes) résident dans des shards dédiés.
4. **Zéro Donnée Transactionnelle dans KV :** KV sert exclusivement pour la résolution DNS/Domaine, la configuration publique et le cache à haute fréquence.

```
                                      [ INTERNET / VISITEURS & COMMERÇANTS ]
                                                         │
                                                         ▼
                                       ┌───────────────────────────────────┐
                                       │   Cloudflare Anycast DNS & DDoS   │
                                       │     WAF & Bot Management          │
                                       │    Cloudflare for SaaS (SSL)      │
                                       └─────────────────┬─────────────────┘
                                                         │
                                                         ▼
                                       ┌───────────────────────────────────┐
                                       │   Next.js 16 / OpenNext Worker    │
                                       │   (Routing, SSR, Server Actions)  │
                                       └───────┬─────────┬─────────┬───────┘
                                               │         │         │
                        ┌──────────────────────┘         │         └──────────────────────┐
                        ▼                                ▼                                ▼
             ┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
             │    Cloudflare KV    │          │    Cloudflare R2    │          │  Cloudflare Queues  │
             │   (Routage & Dom.)  │          │   (Médias & Cache)  │          │   (Traitements Asy) │
             │  - domaine -> tenant│          │  - jaayma-images    │          │  - order-events     │
             │  - tenant -> shard  │          │  - jaayma-next-cache│          │  - notification-sms │
             │  - config publique  │          │  - direct upload    │          │  - image-processing │
             └─────────────────────┘          └─────────────────────┘          └─────────────────────┘
                        │
                        ▼
    ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
    │                                CLOUDFLARE D1 (10 BASES SHARDÉES)                               │
    │                                                                                                │
    │  ┌────────────────────────┐  ┌──────────────────────────────────────────────────────────────┐  │
    │  │    D1-01 CONTROL PLANE │  │                    D1-02 à D1-10 DATA SHARDS                 │  │
    │  │  - Utilisateurs / Auth │  │  Shard 01 (Boutiques 1..1000)  Shard 02 (1001..2000)        │  │
    │  │  - Sessions vendeurs   │  │  Shard 03 (2001..3000)         Shard 04 (3001..4000)        │  │
    │  │  - Registre des tenants│  │  Shard 05 (4001..5000)         Shard 06 (5001..6000)        │  │
    │  │  - Abonnements Wave/OM │  │  Shard 07 (6001..7000)         Shard 08 (7001..8000)        │  │
    │  │  - Paramètres globaux  │  │  Shard 09 (8001..10000 + Débordement VIP)                    │  │
    │  └────────────────────────┘  └──────────────────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Schéma et Organisation des 10 Bases D1

### 3.1. Tableau Récapitulatif des Bases

| Base | Identifiant Binding | Rôle | Entités Stockées | Capacité Allouée |
|---|---|---|---|---|
| **D1-01** | `DB_CONTROL` | **Control Plane Global** | `users`, `sessions`, `tenants`, `tenant_domains`, `subscriptions`, `platform_settings`, `admin_broadcasts`, `shard_directory` | 500 Mo |
| **D1-02** | `DB_SHARD_1` | **Data Plane Shard 1** | Boutiques 1 à 1 000 (`shops`, `products`, `orders`, `order_items`, `visits`) | 500 Mo |
| **D1-03** | `DB_SHARD_2` | **Data Plane Shard 2** | Boutiques 1 001 à 2 000 | 500 Mo |
| **D1-04** | `DB_SHARD_3` | **Data Plane Shard 3** | Boutiques 2 001 à 3 000 | 500 Mo |
| **D1-05** | `DB_SHARD_4` | **Data Plane Shard 4** | Boutiques 3 001 à 4 000 | 500 Mo |
| **D1-06** | `DB_SHARD_5` | **Data Plane Shard 5** | Boutiques 4 001 à 5 000 | 500 Mo |
| **D1-07** | `DB_SHARD_6` | **Data Plane Shard 6** | Boutiques 5 001 à 6 000 | 500 Mo |
| **D1-08** | `DB_SHARD_7` | **Data Plane Shard 7** | Boutiques 6 001 à 7 000 | 500 Mo |
| **D1-09** | `DB_SHARD_8` | **Data Plane Shard 8** | Boutiques 7 001 à 8 000 | 500 Mo |
| **D1-10** | `DB_SHARD_9` | **Data Plane Shard 9** | Boutiques 8 001 à 10 000 & Shard VIP grandes boutiques | 500 Mo |

### 3.2. Schéma D1-01 (Control Plane)
```sql
-- D1-01 : Registre des Tenants & Routage
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,                       -- e.g. "tnt_01HQX..." (ULID)
  slug TEXT NOT NULL UNIQUE,                 -- e.g. "awa-couture"
  owner_id TEXT NOT NULL REFERENCES users(id),
  shard_id INTEGER NOT NULL DEFAULT 1,      -- 1 à 9 (correspond à D1-02..D1-10)
  plan TEXT NOT NULL DEFAULT 'free',         -- 'free', 'pro', 'pro_plus'
  plan_expires_at INTEGER,
  custom_domain TEXT UNIQUE,                 -- e.g. "boutique-awa.sn"
  status TEXT NOT NULL DEFAULT 'ACTIVE',     -- 'ACTIVE', 'SUSPENDED', 'MAINTENANCE'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE tenant_domains (
  domain TEXT PRIMARY KEY,                   -- e.g. "awa-couture.jaayma.sn" ou "boutique-awa.sn"
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  verified_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE shard_directory (
  shard_id INTEGER PRIMARY KEY,              -- 1 à 9
  binding_name TEXT NOT NULL,                -- e.g. "DB_SHARD_1"
  current_tenant_count INTEGER NOT NULL DEFAULT 0,
  max_tenant_capacity INTEGER NOT NULL DEFAULT 1200,
  is_writable INTEGER NOT NULL DEFAULT 1,    -- 1 = accepte de nouvelles boutiques
  updated_at INTEGER NOT NULL
);
```

### 3.3. Schéma Modèle des Shards D1-02 à D1-10 (Data Plane)
Toutes les tables d'un shard possèdent obligatoirement la colonne `tenant_id` avec index préfixé.
```sql
-- D1-02 à D1-10 : Données Exploitation par Boutique
CREATE TABLE shops (
  id TEXT PRIMARY KEY,                       -- Correspond au tenant_id
  tenant_id TEXT NOT NULL,                   -- Même valeur pour filtrage strict
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  category TEXT,
  theme_color TEXT NOT NULL DEFAULT '#C8265A',
  whatsapp TEXT,
  wave_number TEXT,
  orange_money_number TEXT,
  accepts_cash INTEGER NOT NULL DEFAULT 1,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  logo_url TEXT,
  cover_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_shops_tenant ON shops(tenant_id);
CREATE INDEX idx_shops_slug ON shops(tenant_id, slug);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,                    -- En centimes ou entiers XOF (0 décimale)
  stock INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  options_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_products_tenant_status ON products(tenant_id, status, position);
CREATE INDEX idx_products_tenant_shop ON products(tenant_id, shop_id);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  url TEXT NOT NULL,                         -- Clé R2 : tenants/tnt_xxx/products/img_yyy.webp
  alt TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_product_images_tenant_prod ON product_images(tenant_id, product_id);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reference TEXT NOT NULL,                   -- e.g. JYM-849201
  public_token TEXT NOT NULL UNIQUE,         -- 64 hex chars pour suivi client
  shop_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  note TEXT,
  payment_method TEXT NOT NULL,              -- 'cash', 'wave', 'orange_money'
  payment_status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  idempotency_key TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_orders_tenant_status_date ON orders(tenant_id, status, created_at);
CREATE INDEX idx_orders_tenant_public_token ON orders(tenant_id, public_token);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  options TEXT
);
CREATE INDEX idx_order_items_tenant_order ON order_items(tenant_id, order_id);
```

---

## 4. Stratégie de Sharding & Dimensionnement Mathématique

### 4.1. Dimensionnement des Données (Objectif 10 000 Boutiques)
- **Nombre total de boutiques :** 10 000.
- **Répartition :** 9 shards de boutiques (D1-02 à D1-10) = **~1 111 boutiques par shard**.
- **Catalogue :** 1 000 000 produits au total = moyenne de **100 produits par boutique**.
- **Produits par shard :** 1 111 × 100 = **~111 100 produits par shard**.
- **Images :** Stockées **exclusivement sur R2**. D1 ne stocke que la clé textuelle (moyenne 60 octets).
- **Commandes :** Estimation de 50 commandes par mois par boutique active = ~55 500 commandes / mois / shard.

#### Estimation du Poids par Shard (Stockage Disque SQLite)
| Entité | Lignes / Shard | Taille Moyenne Ligne | Volume Données Brutes | Volume Index (+40%) |
|---|---|---|---|---|
| `shops` | 1 111 | 450 octets | ~0,50 Mo | ~0,20 Mo |
| `products` | 111 100 | 280 octets | ~31,10 Mo | ~12,44 Mo |
| `product_images` | 333 300 (3 img/prod) | 120 octets | ~40,00 Mo | ~16,00 Mo |
| `orders` (sur 6 mois) | 333 000 | 320 octets | ~106,56 Mo | ~42,62 Mo |
| `order_items` | 666 000 | 110 octets | ~73,26 Mo | ~29,30 Mo |
| **TOTAL ESTIMÉ PAR SHARD** | — | — | **~251,42 Mo** | **~100,56 Mo** |

> **Conclusion de dimensionnement :**  
> Un shard plein à 1 111 boutiques et 111 000 produits occupe **~352 Mo** avec index, restant **confortablement sous la limite de 500 Mo par base D1 du plan gratuit**. Cela laisse plus de 148 Mo de marge de sécurité par base pour les migrations et données d'audit.

### 4.2. Algorithme de Routage & Résolution Multi-Tenant
La résolution d'un domaine ou sous-domaine vers les données s'exécute selon un pattern **Read-Through Cache à 2 niveaux** :

```
[ Requête HTTP ]
      │
      ▼
1. Vérification du Hostname (ex: "awa-couture.jaayma.sn" ou "mon-domaine.sn")
      │
      ▼
2. Lecture Cache KV (Clé: "dom:{host}") ──► [ HIT (99.2%) ] ──► { tenantId, shardId }
      │
      └─► [ MISS ]
            │
            ▼
      3. Lecture D1-01 Control Plane (`tenant_domains` JOIN `tenants`)
            │
            ├── Écriture KV (TTL: 86400s / 24h)
            │
            ▼
      4. Obtention du { tenantId, shardId }
            │
            ▼
5. Sélection du Binding D1 (`env[shard_binding]`)
      │
      ▼
6. Exécution SQL sécurisée : SELECT ... WHERE tenant_id = ?
```

### 4.3. Gestion des Boutiques VIP & "Noisy Neighbors"
Une boutique générant un volume de trafic ou de commandes anormalement élevé (ex: un grand influenceur avec 2 000 commandes/jour) est isolée pour protéger les autres commerçants :
1. Le Control Plane (D1-01) réaffecte le `shard_id` de la boutique vers le **Shard 9 (D1-10)** dédié ou un shard à faible densité.
2. Un script d'export/import transfère les données de la boutique entre les deux D1.
3. La clé KV du domaine est invalidée immédiatement. Zéro interruption de service.

---

## 5. Stratégie de Stockage Cloudflare R2

### 5.1. Hiérarchie Stricte des Fichiers
R2 applique une arborescence préfixée par `tenant_id` garantissant qu'aucun commerçant ne peut écraser ou accéder aux fichiers d'un autre :

```
jaayma-images/
  └── tenants/
        ├── tnt_01HQX78AB.../
        │     ├── avatar/
        │     │     └── logo_01HQX.webp
        │     ├── cover/
        │     │     └── cover_01HQX.webp
        │     └── products/
        │           ├── prod_01HQX_1.webp
        │           ├── prod_01HQX_2.webp
        │           └── prod_01HQX_thumb.webp
        └── tnt_01HQX99CD.../
              └── ...
```

### 5.2. Processus d'Upload Direct (Direct-to-R2 via Presigned URLs)
Afin d'économiser le temps CPU des Workers (limité à 10ms en Free, 30s en Paid) et d'éliminer la consommation de bande passante Worker :
1. **Client :** Le commerçant sélectionne une photo. Le navigateur effectue une compression locale WebP via Canvas API (`src/lib/compress-image.ts`).
2. **Autorisation :** Le client appelle `POST /api/upload/sign` avec la taille et le type MIME.
3. **Worker :** Vérifie la session commerçant, vérifie son quota de photos selon son plan (Free: 30, Pro: 500, Pro+: illimité), et génère une URL pré-signée S3-compatible R2 (valide 5 minutes).
4. **Envoi direct :** Le navigateur envoie le blob directement à R2 en `PUT`.
5. **Enregistrement :** Le navigateur confirme l'upload avec la clé retournée, enregistrée en D1 shardé.

### 5.3. Distribution & Caching des Images
- **URL publique :** `https://media.jaayma.sn/tenants/{tenant_id}/...` (ou routage via Worker de distribution `api/images/[...key]`).
- **En-têtes HTTP de performance :**
  - `Cache-Control: public, max-age=31536000, immutable`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`
- **Coûts R2 :** R2 n'applique **aucun frais de bande passante sortante (0 $ egress)**, ce qui représente une économie colossale face à AWS S3 pour plusieurs millions d'affichages d'images de robes, chaussures et cosmétiques.

---

## 6. Utilisation de Cloudflare KV et Cloudflare Queues

### 6.1. Stratégie Cloudflare KV
Cloudflare KV est un stockage clé-valeur distribué globalement avec lecture ultra-rapide (<15ms) à l'Edge.

| Clé KV | Valeur | TTL | Règle d'Invalidation |
|---|---|---|---|
| `dom:{hostname}` | `{"tenantId":"tnt_xxx","shard":2,"status":"ACTIVE"}` | 24h | Modif domaine ou suspension |
| `tnt:{tenantId}:cfg` | `{"name":"Awa","theme":"#C8265A","logoKey":"..."}` | 1h | Sauvegarde réglages boutique |
| `tnt:{tenantId}:plan`| `{"plan":"pro","features":{"customDomain":true}}` | 6h | Validation paiement abonnement |
| `sec:ratelimit:{ip}` | Compteur de requêtes fenêtré | 1 min | Automatique par TTL |

> **RÈGLE CRITIQUE D'ARCHITECTURE :**  
> Ne JAMAIS stocker dans KV les stocks de produits, les commandes, les montants financiers ou les sessions utilisateurs. KV a une cohérence éventuelle (eventual consistency) pouvant prendre jusqu'à 60 secondes pour se propager mondialement. Toute donnée financière doit obligatoirement résider dans D1 avec cohérence sérialisée forte.

### 6.2. Stratégie Cloudflare Queues (Traitement Asynchrone)
> ⚠️ **Précision Quota Cloudflare :**  
> Cloudflare Queues nécessite l'abonnement **Workers Paid (5 $ / mois)**.  
> **En mode gratuit de développement :** Les événements non bloquants utilisent l'API native `ctx.waitUntil(promise)`.  
> **En mode production à l'échelle :** 4 files Queues spécialisées sont activées :

1. `jaayma-order-events` :
   - Déclenchée après insertion de la commande dans le D1 shardé.
   - Consommateurs : Mise à jour des compteurs d'articles vendus, envoi du message WhatsApp/SMS de confirmation, notification commerçant.
2. `jaayma-payment-events` :
   - Traitement des notifications Wave/Orange Money et réconciliation des références.
3. `jaayma-notifications` :
   - Envoi des notifications push WebPush VAPID aux commerçants.
4. `jaayma-dlq` (Dead Letter Queue) :
   - Réceptionne tous les messages ayant échoué après 5 tentatives avec backoff exponentiel pour inspection manuelle.

---

## 7. Gestion des Paiements & Rapprochement Financier

### 7.1. Contexte Monétaire Sénégalais
Au Sénégal, plus de 75% du e-commerce de proximité fonctionne avec :
- **Wave Sénégal** (virement instantané de numéro à numéro ou lien de paiement).
- **Orange Money Sénégal** (transfert direct).
- **Paiement à la livraison (Cash on Delivery)**.

### 7.2. Circuit Sécurisé des Paiements Manuels
Pour les paiements Wave et Orange Money sans agrégateur automatisé (ou en attendant la validation des comptes marchands officiels) :
1. Le client passe commande et choisit "Wave" ou "Orange Money".
2. L'interface affiche le numéro de la boutique et la référence unique générée : `JYM-XXXXXX`.
3. Le client effectue son transfert et saisit le numéro de transaction / référence Wave ou téléverse sa capture d'écran.
4. La commande est enregistrée dans le shard D1 avec le statut `payment_status = 'pending'` et `status = 'NEW'`.
5. Le commerçant reçoit la notification et vérifie sur son téléphone son solde Wave/OM.
6. Le commerçant clique sur "Confirmer le paiement" dans son tableau de bord :
   - Une transaction D1 met à jour `payment_status = 'paid'` et `status = 'CONFIRMED'`.
   - L'historique d'audit horodate l'action avec l'identifiant du commerçant.
   - Un verrou optimiste empêche la double validation simultanée.

---

## 8. Plan de Sécurité & Conformité

| Vecteur de Risque | Mesure Technique Mise en Place |
|---|---|
| **Fuite de données inter-tenants** | Injection automatique et systématique du `tenant_id` dans toutes les requêtes Drizzle ORM. Le shard physique assure un premier niveau d'isolation, le filtre SQL garantit le second. |
| **Vol de session commerçant** | Cookies `HttpOnly`, `SameSite=Lax`, `Secure`, préfixe `__Host-` en production. Hachage SHA-256 en base (le token brut n'est jamais stocké). |
| **Attaque par force brute mot de passe** | PBKDF2-SHA512 avec 100 000 itérations (maximum supporté par workerd) + sel cryptographique de 16 octets + comparaison en temps constant `crypto.timingSafeEqual`. |
| **Attaque DDoS / Scraping catalogue** | Cloudflare WAF à l'Edge : Rate limiting de 60 requêtes/minute sur les pages de consultation, 5 tentatives/minute sur `/connexion` et `/inscription`. |
| **Falsification des prix au panier** | Recalcul **100% côté serveur** dans `order.service.ts`. Le panier envoyé par le client ne contient que `{ productId, quantity }`. Les prix unitaires et frais de livraison sont réinterrogés en base D1. |
| **Uploads malveillants** | Contrôle strict du type MIME, analyse des en-têtes magiques (magic bytes), réencodage complet en WebP détruisant les scripts imbriqués dans les métadonnées EXIF. |

---

## 9. Plan de Sauvegarde & Reprise d'Activité (PRA / PCA)

### 9.1. Stratégie de Sauvegarde Multi-Paliers
1. **D1 Time Travel (Natif Cloudflare) :**
   - Restauration point-in-time jusqu'à **7 jours en plan gratuit**, et jusqu'à **30 jours en plan Workers Paid**.
   - Permet de revenir à la seconde près en cas de corruption ou de fausse manipulation SQL :
     ```bash
     npx wrangler d1 time-travel restore jaayma-db --timestamp="2026-11-01T18:00:00Z"
     ```
2. **Export Quotidien Automatique vers R2 (Disaster Recovery) :**
   - Un Worker planifié (Scheduled Cron Worker à 03h00 GMT) exporte un dump SQL de chaque shard D1 vers un bucket R2 sécurisé `jaayma-backups/daily/{date}/shard_{id}.sql`.
   - Règle de cycle de vie R2 : Conservation 30 jours pour les backups quotidiens, 1 an pour les backups mensuels.

### 9.2. RPO & RTO Cibles
- **RPO (Perte de données maximale admissible) :** < 5 minutes (via Time Travel Cloudflare).
- **RTO (Temps de restauration maximal admissible) :** < 15 minutes pour restaurer un shard complet.

---

## 10. Plan de Monitoring & Métriques

### 10.1. Indicateurs Clés de Performance (SLO / SLA)
- **Disponibilité globale :** 99,9% à l'Edge.
- **Latence P50 (Lectures vitrines) :** < 60 ms au Sénégal.
- **Latence P95 (Passation de commande) :** < 450 ms.
- **Taux d'erreur 5xx :** < 0,05%.

### 10.2. Supervision des Quotas D1 (Surveillance Proactive)
Un monitoring quotidien surveille la consommation des quotas gratuits D1 pour anticiper le passage à Workers Paid avant toute coupure :
- **Seuil d'alerte Jaune (70%) :** 3 500 000 lectures / jour ou 70 000 écritures / jour.
- **Seuil d'alerte Rouge (85%) :** 4 250 000 lectures / jour ou 85 000 écritures / jour -> Déclenchement automatique de l'activation du plan Workers Paid ($5/mois).

---

## 11. Plan de Tests de Charge (Scénarios k6)

### 11.1. Profils de Charge Définis
1. **Palier 1 (100 VU) :** Trafic standard de journée (stabilisation).
2. **Palier 2 (500 VU) :** Affluence de soirée (19h - 22h GMT).
3. **Palier 3 (1 000 VU) :** Campagne promotionnelle d'un grand vendeur ou weekend.
4. **Palier 4 (5 000 VU) :** Pic exceptionnel (Rush veille de fête : Tabaski, Korité, Saint-Valentin).

### 11.2. Script k6 de Test de Charge de Référence
Fichier : `scripts/load-test-k6.js`
```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 500 },   // Montée à 500 utilisateurs
    { duration: '5m', target: 1000 },  // Palier à 1000 utilisateurs
    { duration: '3m', target: 5000 },  // Pic exceptionnel à 5000 utilisateurs
    { duration: '2m', target: 0 },     // Redescente
  ],
  thresholds: {
    'http_req_duration{type:storefront}': ['p(95)<300'], // 95% des vitrines sous 300ms
    'http_req_duration{type:checkout}': ['p(95)<800'],   // 95% des commandes sous 800ms
    'http_req_failed': ['rate<0.01'],                    // Moins de 1% d'erreurs
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://jaayma-sn.jaayma.workers.dev';

export default function () {
  group('1. Consultation Boutique Vitrine', () => {
    const res = http.get(`${BASE_URL}/awa-couture`, {
      tags: { type: 'storefront' },
    });
    check(res, {
      'Vitrine statut 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1);

  group('2. Consultation Détail Produit', () => {
    const res = http.get(`${BASE_URL}/explorer`, {
      tags: { type: 'storefront' },
    });
    check(res, {
      'Explorer statut 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1);

  group('3. Simulation Commande Checkout', () => {
    const payload = JSON.stringify({
      shopSlug: 'awa-couture',
      customerName: 'Fatou Diop',
      customerPhone: '+221771234567',
      deliveryAddress: 'Dakar, Médina Rue 11',
      paymentMethod: 'cash',
      items: [{ productId: 'demo-prod-1', quantity: 1 }],
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'checkout' },
    };

    const res = http.post(`${BASE_URL}/api/checkout`, payload, params);
    check(res, {
      'Checkout statut 200 ou 201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(Math.random() * 3 + 2);
}
```

---

## 12. Estimation des Coûts : Plan Gratuit vs Workers Paid

### 12.1. Phase de Lancement (0 à 500 Boutiques) — 100% GRATUIT
| Service Cloudflare | Quota Gratuit Disponible | Consommation Estimée (500 boutiques) | Coût Mensuel |
|---|---|---|---|
| **Cloudflare Workers** | 100 000 requêtes / jour | ~60 000 requêtes / jour | **0 F CFA (0 $)** |
| **Cloudflare D1 (10 bases)** | 5M lectures/j, 100k écritures/j, 5 Go | 800k lectures/j, 15k écritures/j, 380 Mo | **0 F CFA (0 $)** |
| **Cloudflare R2** | 10 Go stockage, 1M écritures, 10M lectures | 4 Go stockage, 50k écritures, 600k lectures | **0 F CFA (0 $)** |
| **Cloudflare KV** | 100 000 lectures / jour | 45 000 lectures / jour | **0 F CFA (0 $)** |
| **SSL / CDN / DDoS** | Inclus en illimité | Tout le trafic | **0 F CFA (0 $)** |
| **TOTAL MENSUEL** | — | — | **0 F CFA (0 $)** |

### 12.2. Phase de Croissance (10 000 Boutiques & 1M Produits) — WORKERS PAID
Dès que l'activité franchit les limites gratuites, l'activation du plan **Cloudflare Workers Paid (5 $ / mois)** débloque :

| Service | Métrique / Volume à 10k Boutiques | Tarification Cloudflare Paid | Coût Mensuel Estimé |
|---|---|---|---|
| **Workers Paid Base** | 10 millions requêtes incluses | 5,00 $ / mois | 5,00 $ |
| **Requêtes Workers supp.** | ~25 millions req/mois (+15M supp.) | 0,30 $ / 1M requêtes | 4,50 $ |
| **D1 Lectures** | ~40 millions lectures/mois (bien sous les 25 milliards inclus !) | Inclus dans le forfait | 0,00 $ |
| **D1 Écritures** | ~2,5 millions écritures/mois (50M incluses !) | Inclus dans le forfait | 0,00 $ |
| **D1 Stockage** | ~3,5 Go (5 Go inclus !) | Inclus dans le forfait | 0,00 $ |
| **R2 Stockage** | ~45 Go (+35 Go au-delà des 10 Go gratuits) | 0,015 $ / Go-mois | 0,52 $ |
| **R2 Opérations Class A** | ~800 000 écritures/mois (1M gratuit) | Inclus dans le gratuit | 0,00 $ |
| **R2 Egress (Bande passante)**| ~450 Go de photos servies aux clients | **0,00 $ (Gratuit sur R2)** | **0,00 $** |
| **Cloudflare Queues** | ~1,2 million messages/mois (1M inclus) | 0,40 $ / 1M messages | 0,08 $ |
| **Cloudflare for SaaS** | 100 domaines personnalisés gratuits | Inclus | 0,00 $ |
| **TOTAL MENSUEL ESTIMÉ** | **10 000 BOUTIQUES OPÉRATIONNELLES** | — | **~10,10 $ / mois (~6 100 F CFA)** |

> **Comparatif Économique Majeur :**  
> Une infrastructure équivalente sur AWS (ALB + ECS Fargate + RDS PostgreSQL Multi-AZ + S3 + NAT Gateway) ou GCP pour supporter 10 000 boutiques et 5 000 VU simultanés coûterait **entre 450 $ et 850 $ par mois (275 000 à 520 000 F CFA)**.  
> L'architecture Cloudflare Edge-First permet d'économiser **plus de 98% des coûts d'infrastructure**.

---

## 13. Feuille de Route & Plan de Migration Transparent

```
[ Étape 1 : Consolidation & Validation du Worker Live ]
  ├── Correction PBKDF2 100k + ImageUploader TDZ (Complété ✅)
  └── Validation des flux Inscription, Boutique, Panier et Admin

[ Étape 2 : Préparation du Sharding D1 (Sans coupure) ]
  ├── Création des 9 bases D1 additionnelles (jaayma-shard-1 à jaayma-shard-9)
  ├── Déploiement des migrations de tables Data Plane sur chaque shard
  └── Initialisation de la table `shard_directory` dans D1-01

[ Étape 3 : Abstraction du Data Layer (Drizzle Multi-D1) ]
  ├── Création du résolveur de contexte : `getDbForTenant(tenantId)`
  └── Injection du shard dynamique selon le contexte de requête

[ Étape 4 : Activation du Cache KV de Routage ]
  ├── Provisioning du namespace KV `JAAYMA_ROUTING`
  └── Enregistrement automatique lors de la création d'une boutique

[ Étape 5 : Intégration Cloudflare for SaaS (Domaines Personnalisés) ]
  ├── Configuration du CNAME fallback `shops.jaayma.sn`
  └── Émission automatique des certificats SSL Let's Encrypt / DigiCert à l'Edge
```

---

Ce document constitue la référence d'ingénierie officielle pour la scalabilité de Jaaymaa. Toute modification de schéma ou de routing doit être validée conformément à cette spécification.

