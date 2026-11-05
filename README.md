# Jaay — Ta boutique, en un lien. 🇸🇳

> **Jaay** est une plateforme e-commerce mobile-first pensée pour les commerçants, créateurs et vendeurs indépendants sénégalais (Instagram, TikTok, WhatsApp).
> Elle permet de créer sa boutique en ligne en 2 minutes depuis son smartphone, de partager un lien unique sur WhatsApp, et de gérer facilement ses commandes et son suivi de livraison.

---

## 🌟 Principes Clés

- **Mobile d'abord (360px / 390px / 1280px)** : Conçu pour les smartphones Android d'entrée de gamme et connexions 3G/4G locales.
- **Acheteur sans compte** : Aucun téléchargement d'application ni mot de passe pour passer commande.
- **Intégration WhatsApp** : Boutons de partage de boutique et de contact pré-remplis pour chaque commande.
- **Paiements locaux** : Espèces à la livraison, Wave et Orange Money (montants entiers en **FCFA**).
- **Fuseau horaire** : `Africa/Dakar` (GMT).
- **100% Autonome & Serverless** : Aucune dépendance externe au runtime (Workers + D1 SQLite + R2 Storage).

---

## 🛠️ Stack Technique

- **Framework :** Next.js 16 (React 19, App Router, TypeScript strict, Server Components & Server Actions)
- **Hébergement :** Cloudflare Workers via `@opennextjs/cloudflare` et Wrangler
- **Base de données :** Cloudflare D1 (SQLite serverless) avec Drizzle ORM
- **Stockage images :** Cloudflare R2 (`jaayma-images` via `MEDIA_BUCKET`, compression WebP sous 200 Ko)
- **Cache incrémental :** Cloudflare R2 dédié (`jaayma-next-cache` via `NEXT_INC_CACHE_R2_BUCKET`)
- **Style :** Tailwind CSS, variables CSS (thèmes clair/sombre, palette marché sénégalais / motif Wax)
- **Sécurité :** Sessions HttpOnly hachées en SHA-256 dans D1, Web Crypto PBKDF2-SHA512, honeypot anti-spam, isolation multi-tenant
- **Tests :** Vitest (85+ tests unitaires)

---

## 📋 Prérequis

- **Node.js** (v20+ LTS recommandé)
- **npm** (inclus avec Node.js)
- Un compte **Cloudflare** gratuit (pour Workers, D1 et R2)
- **Wrangler CLI** (géré via `npx wrangler`)

---

## 🚀 Installation & Développement Local

### 1. Cloner le projet et installer les dépendances
```bash
git clone <url-du-repo>
cd "jaayma.sn - sn"
npm install
```

### 2. Configurer les variables d'environnement
Créez un fichier `.env` à la racine (basé sur `.env.example`) :
```ini
APP_URL=http://localhost:3000
SUPPORT_WHATSAPP=+221771234567
BILLING_WAVE_NUMBER=+221771234567
BILLING_ORANGE_MONEY_NUMBER=+221771234567
ADMIN_PHONES=+221771234567,+221781234567
```

> [!NOTE]
> L'application s'exécute de manière entièrement autonome sans aucun backend externe. `API_BASE_URL` et `NEXT_PUBLIC_API_URL` sont dépréciées.

### 3. Initialiser la base de données locale (Cloudflare D1)
Appliquez les migrations Drizzle sur l'émulateur D1 local :
```bash
# Appliquer les migrations sur D1 local
npx wrangler d1 migrations apply jaayma-db --local

# Insérer les données de démo (Boutique Awa Couture)
npx tsx drizzle/seeds/demo.ts
```

### 4. Démarrer le serveur de développement
```bash
npm run dev
```
Rendez-vous sur [http://localhost:3000](http://localhost:3000).

- **Vitrine démo :** `http://localhost:3000/awa-couture`
- **Explorer :** `http://localhost:3000/explorer`
- **Espace Vendeur :** `http://localhost:3000/espace`
- **Connexion :** `http://localhost:3000/connexion` (Compte démo : `+221771234567` / `passer123`)
- **Administration :** `http://localhost:3000/admin` (accessible avec l'un des numéros définis dans `ADMIN_PHONES`)

---

## 🧪 Suite de Vérification & Tests

Le projet intègre une suite de tests unitaires et de contrôles qualité stricts :

```bash
# 1. Vérification ESLint
npm run lint

# 2. Vérification TypeScript
npx tsc --noEmit

# 3. Tests unitaires Vitest (85 tests)
npm test

# 4. Compilation de production Next.js
npm run build

# 5. Compilation du bundle Cloudflare Worker
npm run build:cloudflare
```

---

## ☁️ Guide de Déploiement Cloudflare (Production)

### 1. Créer la base de données D1 en production
```bash
npx wrangler d1 create jaayma-db
```
Notez le `database_id` généré et reportez-le dans `wrangler.jsonc`.

### 2. Créer les buckets R2
```bash
# Bucket médias
npx wrangler r2 bucket create jaayma-images

# Bucket cache OpenNext
npx wrangler r2 bucket create jaayma-next-cache
```

### 3. Appliquer les migrations D1 en production
```bash
npx wrangler d1 migrations apply jaayma-db --remote
```

### App iOS native d’administration

Le projet SwiftUI et le workflow Codemagic sont documentés dans [docs/IOS-ADMIN-CODEMAGIC.md](docs/IOS-ADMIN-CODEMAGIC.md). Tu peux modifier le code depuis Windows; Codemagic utilise un Mac cloud pour compiler l’app.

### 4. Configurer les variables secrètes Cloudflare
```bash
npx wrangler secret put SUPPORT_WHATSAPP
npx wrangler secret put BILLING_WAVE_NUMBER
npx wrangler secret put BILLING_ORANGE_MONEY_NUMBER
npx wrangler secret put ADMIN_PHONES
```

### 5. Compiler et Déployer
```bash
npm run deploy
```

---

## 📊 Surveillance des Quotas Gratuits

L'architecture de Jaayma est spécifiquement optimisée pour rester dans les offres gratuites de Cloudflare :

| Service | Quota Gratuit Quotidien | Optimisation Jaayma |
|---|---|---|
| **Workers** | 100 000 requêtes / jour | Composants serveur légers, polling suspendu onglet masqué |
| **D1 (Lectures)** | 5 000 000 lectures / jour | Requêtes agrégées en 1 seul passage, max 2 requêtes / page boutique |
| **D1 (Écritures)** | 100 000 écritures / jour | Déduplication des visites quotidiennes par cookie (1 écriture max / visiteur / jour) |
| **R2 (Stockage)** | 10 Go gratuits | Compression WebP côté client sous 200 Ko par image |

Consultez vos métriques en temps réel sur le [Tableau de bord Cloudflare](https://dash.cloudflare.com).

---

## 📁 Documentation

- [CLAUDE.md](file:///CLAUDE.md) : Guide de commande et contexte pour agents de développement.
- [docs/ARCHITECTURE.md](file:///docs/ARCHITECTURE.md) : Architecture cible détaillée Cloudflare Workers, D1 & R2.
- [docs/DECISIONS.md](file:///docs/DECISIONS.md) : Registre des décisions d'architecture (ADR-001 à ADR-008).
- [docs/PROGRESS.md](file:///docs/PROGRESS.md) : État d'avancement détaillé des phases.
- [docs/RUNBOOK.md](file:///docs/RUNBOOK.md) : Guide des opérations, sauvegardes, et dépannage.
- [docs/SECURITY.md](file:///docs/SECURITY.md) : Modèle de sécurité, cryptographie, et isolation multi-tenant.
- [docs/ADMIN-GUIDE-FR.md](file:///docs/ADMIN-GUIDE-FR.md) : Guide d'utilisation du panneau d'administration.
- [docs/MIGRATION-PLAN.md](file:///docs/MIGRATION-PLAN.md) : Cartographie des services locaux remplaçant l'API externe.
- [docs/SKILLS-INSTALLED.md](file:///docs/SKILLS-INSTALLED.md) : Inventaire des skills et outils installés.
# Jaaymaa
