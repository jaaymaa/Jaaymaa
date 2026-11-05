# PROMPT MAÎTRE : Jaayma.sn — Next.js + Cloudflare Workers, D1 et R2

> **Mode d’emploi**
>
> 1. Ouvre le dépôt Jaayma existant dans Claude Code.
> 2. Lis ce prompt en entier avant de modifier le code.
> 3. Commence par l’audit de phase 0 et note l’état réel du dépôt.
> 4. Fais évoluer l’application existante, phase par phase, vers une plateforme autonome sur Cloudflare.

Prérequis recommandés : Node.js 22 LTS, npm, Git, Claude Code et accès Cloudflare pour les seules opérations distantes. Le développement local doit pouvoir avancer sans secrets.

=== DÉBUT DU PROMPT ===

# 0. Rôle et conduite

Tu es lead full-stack senior (Next.js, Cloudflare Workers, commerce mobile en Afrique de l’Ouest) et designer produit. Tu fais évoluer Jaayma vers une plateforme multi-boutiques complète et prête à exploiter.

Tu préserves les fonctionnalités et l’identité existantes, mais remplaces le backend externe par **Cloudflare D1 + Drizzle** et **Neon Storage par Cloudflare R2**. À la fin, le site ne dépend d’aucun serveur API externe pour fonctionner.

## Règles de travail

1. Sois autonome pour les choix réversibles. Note les décisions structurantes dans **docs/DECISIONS.md**.
2. Suis les phases (§12). À chaque fin de phase, vérifie le travail, corrige les échecs, mets à jour **docs/PROGRESS.md** et crée un commit Conventional Commits si Git le permet.
3. Les recommandations Cloudflare, Next.js, OpenNext, Wrangler et Drizzle changent : lis les skills utiles et vérifie la documentation officielle avant les changements d’architecture. La doc officielle actuelle prévaut sur ce prompt ; consigne l’écart.
4. Crée/actualise **CLAUDE.md** et le README pour qu’ils reflètent le code réellement livré.
5. UI et contenus en français du Sénégal ; code et identifiants techniques en anglais.
6. N’invente pas de données métier, prix, commandes ou avis. Sépare les seeds de démonstration des données réelles.
7. Ne lis, n’affiche ni ne commits le contenu de **.env** ou d’un secret. Documente les noms de variables dans **.env.example**.
8. Les changements locaux sont autonomes. Prépare toute migration distante, bascule de données, suppression de ressources ou publication avant de demander l’accord si l’utilisateur ne l’a pas déjà autorisé.
9. Ne conserve aucune dépendance d’exécution à l’API externe. Retire aussi le cron qui la ping.

## Règles métier

- D1 est la source de vérité des utilisateurs, sessions, boutiques, produits, options, commandes, paiements/abonnements, réglages et statistiques persistées.
- Le serveur recalcule les prix, frais et totaux depuis D1. Le client ne transmet que les identifiants, options et quantités ; ne fais jamais confiance aux montants clients.
- Montants monétaires en entiers XOF/FCFA, jamais en flottants.
- R2 stocke les images des produits, logos et couvertures. D1 stocke les clés R2 et métadonnées, pas les octets.
- Le bucket de médias Jaayma doit être distinct du bucket R2 OpenNext utilisé pour le cache incrémental.
- Chaque opération vendeur vérifie côté serveur l’appartenance de la ressource à sa boutique. Chaque route et mutation admin vérifie le rôle côté serveur ; le middleware seul ne suffit pas.
- Aucun cache public pour les sessions, commandes, données vendeur ou admin.
- Les acheteurs peuvent commander sans créer de compte.
- Un choix Wave/Orange Money n’est pas une confirmation de paiement. N’invente pas d’intégration de paiement automatique.

# 1. Produit et état du dépôt

Jaayma permet aux commerçants sénégalais de créer une boutique partageable, gérer produits et commandes ; les acheteurs découvrent les boutiques, commandent sans compte et suivent leur commande. Expérience mobile-first, partage WhatsApp, prix FCFA, fuseau **Africa/Dakar**.

Constats initiaux à confirmer par l’audit :

| Domaine | État repéré |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| Déploiement | OpenNext Cloudflare, Wrangler, Worker personnalisé |
| Versions | Next.js 16 / React 19 / TypeScript 5 selon le package ; vérifie package.json |
| Styles | Tailwind 3 et variables CSS |
| API métier | appels au service externe via **src/lib/api.ts** |
| Auth | cookie **jaay_session**, logique actuelle liée au backend |
| Images | upload via backend/Neon dans **src/app/api/upload/route.ts** |
| Cloudflare | D1 déclarée, R2 pour cache OpenNext, Durable Objects OpenNext |
| Worker | cron de ping de l’ancien backend dans **worker.js** |
| Design | **design/jaayma-charte-graphique.svg** et **design/jaayma-toutes-les-pages.svg** |
| Tests | Vitest avec tests de commandes, montants, téléphone, plans, auth et slugs |
| Docs | README à réconcilier avec la stack réelle ; pas de schéma métier D1 à supposer |

Le dépôt ne contient pas le code du backend. N’invente ni son schéma ni ses validations cachées. Déduis le modèle initial des types et parcours frontend. Pour les données réelles, demande un export exploitable. Ne migre ni ne supprime une base distante sans procédure, sauvegarde et autorisation.

## Parcours à préserver

**Public :** accueil **/**, explorer **/explorer**, vitrine **/[shopSlug]**, checkout **/[shopSlug]/checkout**, confirmation/suivi **/[shopSlug]/commande/[publicToken]**, sitemap, robots, metadata sociales et catalogue XML.

**Vendeur :** **/inscription**, **/connexion**, espace **/espace**, configuration boutique, produits/options/images, commandes et statuts, abonnements Free/Pro/Pro+, QR code et partage, notifications/analytics si déjà utilisés.

**Admin :** tableau de bord, boutiques, comptes, commandes, abonnements, analytics, notifications et réglages (maintenance, explorateur, prix des plans).

Cartographie les Server Actions, pages, routes API et fonctions de **src/lib/api.ts**. Ne laisse pas d’écrans métier avec des données codées en dur après migration.

# 2. Design Jaayma

Les SVG sous **design/** sont les références visuelles. Examine-les visuellement ; évite d’imprimer leur source complète si les métadonnées l’alourdissent.

Tokens présents dans **src/app/globals.css** :

- Encre **#0F1E3D**, Soleil **#FFC83D**, Hibiscus **#C8265A**, Baobab **#0E7C66**
- Nuit **#0A1530**, Papier **#FFFBF2**, texte secondaire **#3F4B69**
- Bordure **#E1E6F0**, texte discret **#C3CCE6**
- Titres Bricolage Grotesque, corps Instrument Sans

Préserve motifs Wax, contours encre épais, ombres décalées, formes ticket et accents de marque. N’introduis pas une palette concurrente. Mobile-first à partir de 360 px, utilisable sur téléphone d’entrée de gamme. Préserve lisibilité, contrastes, focus clavier, cibles tactiles et **prefers-reduced-motion**. L’espace vendeur/admin doit rester utilisable sur mobile ; convertis les tableaux en cartes/listes quand nécessaire. Chaque image a dimensions ou ratio déclaré.

Compare les écrans importants aux SVG, avec captures à **360 px**, **390 px** et **1280 px**. Documente les écarts voulus.

# 3. Stack cible et architecture

| Domaine | Choix |
|---|---|
| UI | Next.js App Router, React, TypeScript strict |
| Hébergement | Cloudflare Workers |
| Adaptateur | OpenNext Cloudflare, déjà en place |
| Base | Cloudflare D1/SQLite |
| ORM | Drizzle ORM + drizzle-kit |
| Médias | Cloudflare R2 |
| Cache OpenNext | bucket R2 distinct des médias |
| Cache/tâches | Durable Objects selon les besoins OpenNext actuels |
| Style | Tailwind existant, CSS variables |
| Panier | Zustand existant si pertinent |
| Icônes | lucide-react existant |
| Tests | Vitest ; Playwright pour les parcours navigateur |
| Gestionnaire | npm et package-lock.json |

Garde OpenNext sauf preuve documentée qu’il bloque une fonction requise. Ne migre pas vers vinext par réflexe.

Les Server Components lisent D1 avec Drizzle. Les mutations passent par des Server Actions ou Route Handlers locaux. Crée des modules lisibles pour DB, requêtes métier, auth et stockage. Les secrets/bindings ne sont jamais envoyés au navigateur. Récupère D1/R2 selon la méthode recommandée pour la version OpenNext installée ; ne suppose pas que **process.env** expose les bindings.

## Suppression de l’API externe

- Remplace les appels de **src/lib/api.ts** par des requêtes/services locaux typés ; ne recrée pas un client HTTP sortant.
- Migre pages, Server Actions, middleware, upload, auth, commandes, abonnements, analytics et notifications.
- Supprime **API_BASE_URL**, **NEXT_PUBLIC_API_URL**, la dépendance Neon/flux S3 et le ping de **worker.js** du runtime.
- Conserve seulement les intégrations tierces explicitement souhaitées, telles que analytics ou pixels vendeurs, en mode optionnel.
- L’app doit démarrer et fonctionner en local avec D1 locale et R2 local/émulé, sans backend externe.

Ne crée pas un second projet Next dans le dépôt.


# 4. D1, auth, R2 et règles métier

## Modèle de données

Crée un schéma Drizzle fondé sur les pages/type du projet, avec au minimum les entités nécessaires pour :

- **users** : nom, téléphone normalisé unique, hash de mot de passe, rôle et dates.
- **sessions** : hash du token opaque, utilisateur, expiration, activité et révocation.
- **shops** : propriétaire, slug unique, identité, description, zone, catégorie, thème, WhatsApp, livraison, moyens de paiement, clés R2 logo/couverture, statut et plan/expiration.
- **products** : boutique, nom, description, prix entier XOF, stock si suivi, position, statut et dates.
- **product_options** : options/variantes et leur éventuel supplément, avec modèle défini après audit.
- **product_media** : clé R2, texte alternatif, ordre, type et dimensions.
- **orders** et **order_items** : références, token public imprévisible, coordonnées/adresse client, note, moyens/statuts de paiement, état, frais, totaux et snapshots immuables des lignes.
- **subscription_payments**, **platform_settings**, et tables push/notifications si ces parcours sont conservés.
- Tables analytics seulement si nécessaire aux métriques existantes.

Ajoute clés étrangères, contraintes et index sur slugs, propriétaires, statuts et dates. Dates stockées UTC, affichées selon **Africa/Dakar**. Versionne les migrations. Seeds idempotents, uniquement démonstration, sans écraser de vraies données. Documente rollback et sauvegardes pour migrations risquées.

## Authentification et autorisation

- Sessions avec token cryptographique aléatoire ; seul le hash du token est conservé en D1. Cookie **HttpOnly**, **Secure** en production, **SameSite=Lax**, **Path=/**.
- Mot de passe haché avec Web Crypto PBKDF2-SHA256 et sel unique, ou méthode officielle mieux adaptée au runtime. Aucun mot de passe lisible.
- Normalise les numéros sénégalais et conserve un format canonique.
- Vérifie chaque session, rôle et relation vendeur/boutique sur le serveur.
- Admin amorcé par une procédure sûre, pas uniquement par une condition navigateur.
- Validation stricte, taille maximale, honeypot checkout et limites de débit appropriées.
- Messages de connexion qui ne révèlent pas si un compte existe.
- Documente expiration, rotation, révocation et déconnexion.

## Upload et service R2

- Bucket Jaayma dédié, distinct du cache OpenNext.
- Upload autorisé seulement pour un vendeur authentifié et sa boutique.
- Valide côté serveur le type réel, taille, extension, quotas et format.
- Garde la compression WebP côté client si la qualité est suffisante, avec validation serveur.
- D1 garde les clés R2, alt text, dimensions et ordre, pas les octets.
- Domaine public média si configuré, sinon route Worker contrôlée. La route n’est jamais un proxy ouvert.
- Aucun secret/URL privée/jeton d’upload dans le navigateur.
- Supprime sûrement les objets orphelins sans enlever un objet encore référencé.
- N’interprète pas un média utilisateur comme HTML/SVG actif sans décision de sécurité documentée.

## Plans et quotas

Les limites locales dans **src/lib/plans.ts** sont le point de départ à confirmer :

| Offre | Produits actifs max. | Photos par produit max. |
|---|---:|---:|
| Free | 10 | 1 |
| Pro | 100 | 3 |
| Pro+ | 200 | 4 |

Vérifie quotas et expiration côté serveur à chaque changement. L’interface n’est jamais l’autorité. Prix Pro/Pro+ administrables en D1 ; ne copie pas de montant de maquette non confirmé.

## Panier, commandes et paiement

- Panier invité conservé côté client, sans données personnelles.
- À la commande, vérifie boutique, produits actifs, options, quantités, stock et paiement.
- Relis prix/frais depuis D1, calcule en entier XOF et sauvegarde snapshots du nom/prix/options.
- Ajoute idempotence pour empêcher doubles commandes lors d’un double clic ou d’une reconnexion.
- Valide côté serveur nom, téléphone, adresse, note et limites panier.
- Transitions métier : nouvelle → préparation → en livraison → livrée, ou annulation autorisée. Statut de paiement séparé.
- Suivi avec token public imprévisible ; ne protège pas une commande avec son numéro séquentiel.
- Corrige le checkout qui affiche actuellement un numéro local aléatoire avant envoi : la référence affichée après validation doit être celle enregistrée dans D1.
- Arrête le polling à la livraison/annulation ; suspends-le quand onglet masqué.
- Wave, Orange Money et espèces restent disponibles selon la configuration de la boutique. Le choix d’un moyen n’est jamais une preuve de paiement.
- N’invente aucune API de paiement. Sans fournisseur/documentation/secret confirmé, documente et implémente seulement le parcours manuel prévu.

## Analytics et notifications

Métriques depuis requêtes D1 indexées ou agrégats cohérents. Une panne analytics ne bloque pas le checkout. Pixels vendeurs optionnels. Clés privées VAPID côté serveur uniquement ; abonnements push révocables. Les annonces admin gardent cible et historique, et échouent proprement si push indisponible.

# 5. Skills et outils

Fais l’inventaire en phase 0 et consigne présent/ajouté/indisponible dans **docs/SKILLS-INSTALLED.md**. Vérifie les instructions à jour avant installation.

Skills utiles : Cloudflare Workers/D1/R2, **workers-best-practices**, **wrangler**, **web-perf**, **frontend-design**, **webapp-testing**, bonnes pratiques React/Next et sécurité. Le skill vinext reste facultatif : Jaayma a déjà Next/OpenNext.

MCP si disponibles : Cloudflare docs/builds, Context7 et Playwright. S’ils manquent, poursuis avec docs officielles et outils locaux.

Garde npm et package-lock. Vérifie Node/npm/Wrangler, ESLint, TypeScript et Vitest. N’ajoute Playwright que si cela sert les parcours réels. Ne réinitialise pas Git et ne modifie pas la config Git globale.

# 6. Environnements et migration de données

| Env | D1 | R2 médias | R2 cache | URL |
|---|---|---|---|---|
| local | base locale isolée | binding local/émulé | cache local OpenNext | localhost |
| preview | base test | bucket test | cache preview | URL preview |
| production | base Jaayma | bucket prod | cache prod | domaine Jaayma |

Ne pointe jamais le local vers production. Les bindings D1/R2 sont configurés dans Wrangler. Retire les variables backend/Neon devenues inutiles. **.env.example** ne contient aucun secret.

Prépare un import idempotent depuis un export explicitement fourni (JSON/CSV/SQL), avec validation et aperçu. N’accède pas à une base de production et ne supprime pas l’historique sans export, sauvegarde, comparaison et autorisation. Avant bascule, compare comptes, boutiques, produits, commandes, montants et abonnements.

# 7. Sécurité, accessibilité, performance

## Sécurité

- Vérifie l’isolation vendeur pour chaque lecture et mutation, l’admin pour chaque route et action.
- Drizzle paramétré, validation, échappement et erreurs sans détails sensibles.
- En-têtes HTTP/CSP réalistes, CSRF si mutation exposée, limites de taille.
- Protège contre énumération, fixation de session, upload malveillant et accès par ID.
- Ne logue pas téléphone complet, adresse, mot de passe, session ni détails de paiement inutiles.
- Fais relire auth, uploads et multi-tenant avec le skill sécurité disponible.

## Accessibilité et performance

Focus clavier, labels, erreurs associées, contraste, cibles tactiles, réduction d’animations. Dialogues/menus gèrent focus, Échap et restitution du focus.

Réduis le JavaScript initial ; images responsives avec dimensions ; cache public seulement et invalidé après modification ; jamais de cache commun pour données vendeur/client. Indexe requêtes D1, évite N+1, suspends polling caché. Mesure Lighthouse/Web Vitals sur accueil, boutique, checkout, seller et admin. PWA/service worker ne doit pas cacher de page privée.

# 8. Tests et déploiement

Garde les tests Vitest existants et couvre calculs de commande, téléphone, statuts, quotas/expiration, auth/session, slugs, multi-tenant, admin, migrations D1 vierges, seeds, uploads R2 et idempotence. Refuse tout prix falsifié venant du client.

Parcours navigateur minimum : acheteur commande et suit ; vendeur crée boutique/produit/image et traite commande ; vendeur A ne touche pas boutique B ; admin protégé ; tests responsive 360/390/1280 px et clavier.

Scripts de validation à établir en phase 0 si manquants :

    npm run lint
    npx tsc --noEmit
    npm test
    npm run build
    npm run build:cloudflare

Build Next seul ne valide pas Worker. D1 testée localement ; pas de migration distante dans les tests.

CI GitHub Actions si absente : npm ci, lint, types, tests, build Next/OpenNext. Production : migration contrôlée, déploiement, contrôle santé et rollback documenté. Secrets CI à permissions minimales ; aucun secret dans artefacts ou logs.

# 9. Phases

## Phase 0 — Audit

- [ ] Lire configs et docs sans lire **.env**.
- [ ] Cartographier **src/lib/api.ts**, middleware, actions, pages, routes, auth, checkout, upload, abonnements et Worker.
- [ ] Examiner les SVG visuellement et inventorier les écrans.
- [ ] Noter les divergences README/code : Next, Tailwind, D1, R2, Neon, API.
- [ ] Créer **CLAUDE.md**, **docs/ARCHITECTURE.md**, **docs/DECISIONS.md**, **docs/PROGRESS.md**, **docs/SKILLS-INSTALLED.md**.
- [ ] Cartographier fonctions externes vers futures requêtes/mutations D1. Proposer schéma et ordre de migration ; aucun changement distant.

## Phase 1 — Cloudflare, D1, R2

- [ ] Confirmer OpenNext pour versions installées ; bucket cache et bucket média distincts.
- [ ] Configurer D1 locale et schéma Drizzle minimal.
- [ ] Prouver localement lecture/écriture D1 et R2, route média, Server Action, cookie HttpOnly.
- [ ] Valider build Cloudflare et preview local.
- [ ] Supprimer le ping externe ; aucune tâche cron sans besoin Jaayma réel.

## Phase 2 — Données et auth

- [ ] Schéma relationnel, contraintes, index, migrations versionnées et seeds idempotents.
- [ ] Requêtes typées pour comptes, sessions, boutiques, produits, commandes, plans et réglages.
- [ ] Inscription, login, logout, cookies, expiration et révocation via D1.
- [ ] Isolation vendeur/admin testée sur chaque action sensible.
- [ ] Import données réelles documenté, en attente d’un export approuvé.

## Phase 3 — Boutique, catalogue et médias

- [ ] Remplacer lectures/écritures boutiques et produits par D1.
- [ ] Migrer upload Neon vers R2 avec contrôle ownership et quotas.
- [ ] Préserver thèmes, slugs, partage, QR, metadata et XML.
- [ ] Captures explorer et boutique comparées au design aux largeurs requises.

## Phase 4 — Checkout

- [ ] Panier invité sans montant autoritatif.
- [ ] Commande D1 avec prix recalculé, snapshots, idempotence et token de suivi sûr.
- [ ] Corriger la référence locale aléatoire du checkout.
- [ ] Tester options, stock, produit désactivé, prix falsifié, double clic et parcours suivi.

## Phase 5 — Espace vendeur

- [ ] Migrer dashboard, boutique, produits, commandes, abonnement, quotas et analytics conservés.
- [ ] Statuts commande valides, paiement séparé.
- [ ] QR, partage, push conservés migrés vers services internes.
- [ ] Tester accès croisés entre vendeurs et mobile.

## Phase 6 — Administration

- [ ] Migrer comptes, boutiques, commandes, abonnements, analytics, réglages, maintenance et notifications.
- [ ] Protéger chaque page, action, route admin.
- [ ] Prix plans stockés/configurés dans D1.
- [ ] Tests anonymous/vendeur/admin ; recherche et pagination performantes.

## Phase 7 — Durcissement et livraison

- [ ] Audit auth, sessions, CSRF, erreurs, upload, cache et permissions.
- [ ] SEO, accessibilité, PWA sûre, Lighthouse et Web Vitals.
- [ ] Skill workers-best-practices appliqué.
- [ ] CI, guide admin français, architecture et runbook finis.
- [ ] Recette sur preview D1/R2 ; aucun déploiement prod sans autorisation.

# 10. Livrables et recette finale

Docs à livrer : README cohérent, **CLAUDE.md**, **docs/ARCHITECTURE.md**, **DECISIONS.md**, **PROGRESS.md**, **SKILLS-INSTALLED.md**, **RUNBOOK.md**, **SECURITY.md**, **ADMIN-GUIDE-FR.md**, **.env.example** sans secrets.

Coche avec preuves :

- [ ] Application locale fonctionnelle sans backend externe.
- [ ] Toutes données métier dans D1 ; médias Jaayma dans R2.
- [ ] Aucun runtime dépend de API_BASE_URL, NEXT_PUBLIC_API_URL, Neon ou ancien ping.
- [ ] Buckets R2 médias et cache séparés.
- [ ] Isolation vendeur et admin validée côté serveur.
- [ ] Prix/totaux en entiers FCFA recalculés depuis D1.
- [ ] Suivi public par token imprévisible ; double soumission idempotente.
- [ ] Plans, quotas, expiration et uploads contrôlés côté serveur.
- [ ] Lint, types, tests D1, Vitest, build Next et build Cloudflare verts.
- [ ] Parcours responsive comparés aux références.
- [ ] Documentation, migrations et variables correspondent au code.
- [ ] Aucune donnée réelle inventée/importée sans export.
- [ ] Aucune migration/suppression prod sans sauvegarde et autorisation.

# 11. Hors périmètre et reprises

Hors périmètre sans demande : conserver backend externe à l’exécution, Neon pour médias, paiement automatique sans fournisseur vérifié, refonte complète, migration framework sans preuve, application native, transporteurs, multilingue ou campagnes externes.

Si bloqué : relis skill/docs/logs, fais au plus trois tentatives distinctes consignées, poursuis tâches indépendantes, puis demande précisément l’accès ou décision qui manque.

Reprise : lis **CLAUDE.md**, **docs/PROGRESS.md**, **docs/DECISIONS.md**, **docs/ARCHITECTURE.md** ; vérifie l’état du dépôt sans modifier Git global ; reprends à la première case non cochée.

La dernière demande explicite de l’utilisateur prévaut. Consigne les changements structurants dans **docs/DECISIONS.md**.

À la fin de phase 0, ne demande que les éléments réellement bloquants pour du travail distant : accès Cloudflare (jamais de token dans le chat), domaine, export des données existantes, règle d’amorçage admin, confirmation des règles de prix/abonnement/paiement et clés VAPID/analytics si ces fonctions sont activées. Continue tout le travail local possible en attendant.

=== FIN DU PROMPT ===
