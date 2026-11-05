# Inventaire des Outils et Skills — Jaayma.sn

> Ce document liste les outils, scripts et compétences disponibles dans l'environnement de développement.

---

## 1. Outils système & Runtimes

| Outil | Version détectée | Rôle |
|---|---|---|
| **Node.js** | v22 LTS | Runtime d'exécution local et de build |
| **npm** | 10.x | Gestionnaire de dépendances principal (`package-lock.json`) |
| **Git** | 2.x | Contrôle de version |
| **Wrangler** | 4.147.0 | CLI Cloudflare Workers, émulation D1 et R2 |
| **Vitest** | 5.0.3 | Framework de tests unitaires et d'intégration |
| **Next.js** | 16.4.2 | Framework React avec App Router et Server Actions |
| **OpenNext** | 1.20.8 | Adaptateur Cloudflare pour Next.js |

---

## 2. Dépendances de données & utilitaires

| Paquet | Rôle |
|---|---|
| **drizzle-orm** | ORM pour Cloudflare D1 (SQLite) |
| **drizzle-kit** | Générateur de migrations et CLI de gestion du schéma |
| **ulid** | Générateur d'identifiants uniques lexicographiquement ordonnés |
| **zustand** | Gestion d'état client (panier d'achats) |
| **lucide-react** | Bibliothèque d'icônes SVG |
| **qrcode** | Génération de QR codes boutiques pour affichage et téléchargement |
| **clsx / tailwind-merge** | Utilitaire de composition de classes Tailwind CSS |

---

## 3. Emulateurs et Services Cloudflare

- **D1 Database (jaayma-db) :** Émulée localement via `wrangler d1 execute --local` et testée au runtime via `getCloudflareContext`.
- **R2 Storage :**
  - `MEDIA_BUCKET` : Stockage des images produits, logos et couvertures.
  - `NEXT_INC_CACHE_R2_BUCKET` : Cache incrémental OpenNext.
- **Durable Objects :** Émulés par Wrangler pour les besoins de queue et tag-cache OpenNext.

