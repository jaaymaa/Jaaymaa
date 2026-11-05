# Audit & Modèle de Sécurité — Jaayma.sn 🇸🇳

> Ce document détaille l'architecture de sécurité, les contrôles d'accès, la protection cryptographique, l'isolation multi-tenant et la gestion des données pour la plateforme **Jaayma.sn**.

---

## 1. Principes Fondamentaux de Sécurité

1. **Zero-Trust Côté Client :** Le navigateur ou le client mobile n'est jamais considéré comme une autorité de confiance. Tous les prix, montants, quotas, permissions et identifiants sont validés et recalculés côté serveur.
2. **Cloisonnement Strict Multi-Tenant :** Un vendeur A ne peut en aucun cas lire ou modifier les produits, réglages ou commandes d'un vendeur B.
3. **Défense en Profondeur :** Plusieurs couches de contrôle (middleware, Server Actions, services typés Drizzle, contraintes SQL D1).
4. **Protection de la Vie Privée :** Aucune donnée confidentielle ou financière stockée en clair. Conforme aux réalités du commerce d'Afrique de l'Ouest.

---

## 2. Authentification & Gestion des Sessions

### A. Hachage des Mots de Passe
- **Algorithme :** PBKDF2 avec HMAC-SHA512 (conforme au standard Web Crypto et rétrocompatible avec la base historique).
- **Paramètres :**
  - Sel : 16 octets aléatoires générés cryptographiquement (`crypto.randomBytes(16)`).
  - Itérations : 210 000 itérations.
  - Longueur de clé dérivée : 64 octets (512 bits).
  - Format de stockage en D1 : `salt:hash:iterations`.
- **Comparaison sécurisée :** Utilisation de `crypto.timingSafeEqual` pour prévenir toute attaque par canal auxiliaire temporel (timing attacks).
- **Anti-énumération :** Les formulaires de connexion et d'inscription renvoient des messages génériques neutres en cas d'échec pour empêcher l'énumération de numéros existants.

### B. Cycle de Vie des Sessions
- **Génération du Jeton :** Jeton opaque à haute entropie (32 octets aléatoires cryptographiques = 64 caractères hexadécimaux).
- **Stockage en Base (D1) :** Seul le **hash SHA-256** du jeton est conservé dans la table `sessions` (`token_hash`). Même en cas de compromission de la base de données, les sessions actives ne peuvent pas être usurpées.
- **Cookie de Session :**
  - Nom : `jaay_session`.
  - Attributs : `HttpOnly` (inaccessible par JavaScript), `SameSite=Lax` (protection anti-CSRF), `Secure` en environnement de production HTTPS, `Path=/`.
  - Durée de validité : 30 jours, avec mise à jour du champ `last_active_at`.
- **Révocation :** La déconnexion supprime immédiatement la session de la base D1 et efface le cookie côté client.

---

## 3. Autorisation & Isolation Multi-Tenant

### A. Contrôle d'Accès Vendeur
Chaque action sensible dans `src/app/actions/` et chaque service dans `src/services/` vérifie l'identité du propriétaire :

```typescript
// Exemple de validation systématique d'appartenance
const sellerContext = await getCurrentSellerContext();
if (!sellerContext) throw new Error("Non authentifié");

const product = await getProductById(productId);
if (product.shopId !== sellerContext.shop.id) {
  throw new Error("Accès refusé : vous n'êtes pas propriétaire de ce produit");
}
```

- **Boutiques :** Modification restreinte au `userId === shop.ownerId`.
- **Produits :** Ajout, modification, suppression restreints à la boutique du vendeur connecté.
- **Commandes :** Consultation des commandes et changement de statut restreints aux commandes dont `order.shopId === sellerContext.shop.id`.

### B. Contrôle d'Accès Administrateur
L'accès aux fonctionnalités de supervision de la plateforme (`/admin/*`) requiert une double validation :
1. **Rôle en base :** Le compte utilisateur doit posséder `role === "ADMIN"`.
2. **Autorité de configuration :** Le numéro de téléphone normalisé de l'utilisateur doit obligatoirement figurer dans la variable d'environnement Cloudflare `ADMIN_PHONES`.

Cette architecture empêche toute élévation de privilèges même si un attaquant parvenait à modifier un enregistrement en base.

---

## 4. Intégrité des Commandes & Panier d'Achat

### A. Recalcul Intégral Côté Serveur
- Le panier invité côté client n'est qu'un contenant de commodité.
- Lors de la soumission de la commande (`createOrder`), le serveur lit directement les produits actifs et leurs prix officiels en base D1.
- Tous les montants sont calculés en **entiers FCFA / XOF** (aucune décimale flottante manipulable).
- Les snapshots immuables des lignes (`order_items`) figent le nom, le prix unitaire et les options au moment de l'achat.

### B. Jeton Public Imprévisible pour le Suivi
- Les commandes reçoivent un identifiant séquentiel de référence (`JYM-XXXXXX`) destiné à l'affichage humain et WhatsApp.
- **La consultation publique de la commande se fait exclusivement via un `publicToken` aléatoire de 32 octets (64 caractères hexadécimaux).**
- L'URL `/ma-boutique/commande/[publicToken]` ne permet aucune énumération de commandes (`id=1`, `id=2`, etc.).

### C. Idempotence & Protection contre les Doubles Soumissions
- Chaque soumission de commande peut inclure une clé d'idempotence générée côté client.
- Empêche la création de commandes dupliquées lors d'un double clic ou d'une reconnexion réseau mobile 3G/4G instable.

---

## 5. Stockage Sécurisé & Upload R2

### A. Contrôle de l'Upload
- Seul un vendeur connecté et vérifié peut envoyer des fichiers (`/api/upload`).
- **Validation MIME stricte :** Seuls les types `image/jpeg`, `image/png`, `image/webp` et `image/gif` sont autorisés.
- **Taille maximale :** 2 Mo côté serveur (les images sont compressées en WebP côté client sous 200 Ko avant envoi).
- **Nommage Aléatoire :** Clé R2 générée via un identifiant ULID unique et extension dérivée du type MIME validé (ex: `products/01HXYZ...webp`).
- **Prévention Path Traversal :** Aucun nom de fichier fourni par l'utilisateur n'est utilisé dans le chemin R2, éliminant totalement les attaques par traversée de répertoire (`../`).

### B. Distribution Sécurisée des Médias
La route de distribution `/api/images/[...key]` applique les en-têtes de sécurité recommandés :
- `X-Content-Type-Options: nosniff` (empêche le navigateur de réinterpréter une image comme script).
- `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` pour les assets.
- `Cache-Control: public, max-age=31536000, immutable` pour les performances de mise en cache CDN Cloudflare.
- Aucun fichier exécutable, SVG arbitraire ou script n'est exécuté.

---

## 6. Protection Réseau, En-têtes & CSRF

- **Protection CSRF :** Les mutations utilisent les Server Actions de Next.js, qui valident par défaut l'en-tête `Origin` contre l'hôte courant. Les cookies portent la directive `SameSite=Lax`.
- **Injection SQL :** Drizzle ORM utilise exclusivement des requêtes préparées avec substitution de paramètres (`?`), neutralisant tout risque d'injection SQL dans D1.
- **Honeypot Checkout :** Un champ invisible piège les robots spammeurs tentant de soumettre de fausses commandes.
- **Déni de Service (DoS) & Limites :** Quotas stricts imposés par les plans (Free: 10 produits max, 1 photo/produit ; Pro: 100 produits max, 3 photos/produit ; Pro+: 200 produits max, 4 photos/produit).

