<p align="center">
  <img src="docs/assets/jaaymaa-cover.svg" alt="Jaaymaa — ta boutique, en un lien" width="100%" />
</p>

<p align="center">
  <a href="https://jaayma-sn.jaayma.workers.dev"><strong>Découvrir Jaaymaa</strong></a>
  &nbsp;·&nbsp;
  <a href="https://jaayma-sn.jaayma.workers.dev/explorer">Explorer les boutiques</a>
  &nbsp;·&nbsp;
  <a href="docs/assets/jaaymaa-logo.svg">Logo officiel en SVG</a>
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-0F1E3D?style=flat-square&logo=nextdotjs&logoColor=FFC83D" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-0F1E3D?style=flat-square&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-0F1E3D?style=flat-square&logo=typescript&logoColor=3178C6" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-0F1E3D?style=flat-square&logo=cloudflare&logoColor=F38020" />
  <img alt="SwiftUI" src="https://img.shields.io/badge/SwiftUI-iOS-0F1E3D?style=flat-square&logo=swift&logoColor=F05138" />
</p>

---

## Le commerce local, à portée de lien

**Jaaymaa aide les commerçants sénégalais à présenter leurs produits, recevoir des commandes et gérer leur boutique en ligne depuis un seul espace.** La plateforme est pensée pour les usages mobiles et le partage simple d’une boutique avec ses clients.

## Une plateforme, plusieurs espaces

| Espace | À quoi il sert |
| --- | --- |
| **Boutiques en ligne** | Présenter une marque, ses produits et les informations utiles aux clients. |
| **Espace vendeur** | Gérer la boutique, le catalogue, les commandes, les abonnements et les notifications. |
| **Explorer** | Découvrir des boutiques et parcourir leurs produits; les boutiques Pro+ bénéficient d’une mise en avant. |
| **Administration web** | Suivre les comptes, boutiques, commandes, abonnements et réglages de la plateforme. |
| **Jaaymaa Admin pour iOS** | Application native SwiftUI d’administration, compilée en IPA pour installation personnelle avec Sideloadly. |

## Une expérience adaptée au commerce sénégalais

- **Commande directe** : les clients peuvent parcourir une boutique et commander sans créer de compte.
- **Partage facile** : chaque vendeur dispose d’une vitrine à partager, notamment sur WhatsApp.
- **Paiements familiers** : paiement à la livraison, Wave et Orange Money selon les moyens activés par la boutique.
- **Gestion sur mobile** : les outils vendeurs sont conçus pour rester pratiques sur téléphone.
- **Découverte des boutiques** : l’Explorer aide les clients à trouver de nouveaux vendeurs.

## Technologies

| Partie | Technologies |
| --- | --- |
| Application web | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Déploiement web | Cloudflare Workers et OpenNext |
| Données et médias | Cloudflare D1, R2 et Drizzle ORM |
| Application admin iOS | SwiftUI, XcodeGen et Codemagic; IPA iPhone pour Sideloadly |

## Démarrer le projet web

### Prérequis

- Node.js 20 ou plus récent
- npm
- PowerShell sur Windows (ou un terminal équivalent sur macOS/Linux)

### Installation sous Windows

~~~powershell
git clone https://github.com/jaaymaa/Jaaymaa.git
cd Jaaymaa
npm install
Copy-Item .env.example .env.local
npx wrangler d1 migrations apply jaayma-db --local
npm run preview
~~~

Le fichier `.env.local` contient la configuration locale. Il est ignoré par Git; garde les clés et valeurs privées hors des commits.

Pour l’interface seule avec Next.js, lance `npm run dev`. Pour vérifier l’application avec les liaisons Cloudflare simulées localement (D1, R2), utilise `npm run preview` après avoir appliqué les migrations locales.

### Vérifications disponibles

~~~powershell
npm run lint
npx tsc --noEmit
npm test
npm run build:cloudflare
~~~

## Application iOS avec Codemagic

Le code SwiftUI se trouve dans `ios/JaaymaaAdmin`. Depuis Windows, lance le workflow manuel **ios-admin-sideload** dans Codemagic pour récupérer `JaaymaaAdmin-sideload.ipa`. Le workflow **ios-admin-simulator** reste disponible pour produire une app de simulateur.

L’IPA est compilé sans signature; Sideloadly le signe lors de l’installation sur ton iPhone avec ton identifiant Apple. Il n’est pas nécessaire d’ajouter tes identifiants Apple ou des certificats au dépôt ou à Codemagic. Le téléphone doit utiliser iOS 26 ou une version ultérieure.

Consulte le [guide d’installation iOS avec Sideloadly](docs/IOS-ADMIN-CODEMAGIC.md) pour télécharger l’IPA, activer le mode développeur et installer l’application.

## Structure du dépôt

| Chemin | Contenu |
| --- | --- |
| `src/app` | Pages du site, espace vendeur, administration et API |
| `src/components` | Composants d’interface réutilisables |
| `src/db` et `src/services` | Accès aux données et logique métier côté serveur |
| `drizzle` | Schéma, migrations et données de démonstration locales |
| `ios/JaaymaaAdmin` | Application SwiftUI d’administration |
| `public` | Logo, icônes, badges et ressources visuelles |
| `docs` et `design` | Guides du projet et identité graphique |

## Identité Jaaymaa

La palette reprend le bleu encre, le jaune soleil et le rose hibiscus. Les motifs géométriques s’inspirent des textiles et des couleurs qui ont nourri l’identité visuelle du produit.

- [Logo officiel Jaaymaa (SVG)](docs/assets/jaaymaa-logo.svg)
- [Charte graphique](design/jaayma-charte-graphique.svg)
- [Guide d’utilisation de l’administration](docs/ADMIN-GUIDE-FR.md)
- [Runbook et procédures de développement](docs/RUNBOOK.md)

<p align="center">
  <strong>Jaaymaa</strong><br />
  Des outils numériques pensés pour faire grandir le commerce local. 🇸🇳
</p>
