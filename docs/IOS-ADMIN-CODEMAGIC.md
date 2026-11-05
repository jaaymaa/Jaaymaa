# Installer Jaaymaa Admin sur iPhone avec Sideloadly

L’application d’administration native est développée en SwiftUI dans `ios/JaaymaaAdmin`. Le projet Xcode est généré à partir de `ios/project.yml` avec XcodeGen. Tu peux modifier le code sous Windows; Codemagic le compile sur un Mac distant.

## Générer le fichier IPA

1. Dans Codemagic, ouvre l’application reliée à `jaaymaa/Jaaymaa` et sélectionne la branche `main`.
2. Lance le workflow manuel **ios-admin-sideload**.
3. Une fois le build terminé, télécharge l’artefact **JaaymaaAdmin-sideload.ipa**.

Le workflow compile une application iPhone sans signature Apple et l’emballe en IPA. Il ne demande ni certificat Apple Developer ni mot de passe Apple dans Codemagic. Sideloadly signe l’IPA au moment de l’installation.

Le workflow **ios-admin-simulator** produit séparément une application destinée au simulateur Xcode; ce fichier `.app` ne s’installe pas sur un iPhone.

## Installer avec Sideloadly sous Windows

1. Installe Sideloadly depuis son [site officiel](https://sideloadly.io/). Sur Windows, Sideloadly demande les versions bureau d’iTunes et d’iCloud téléchargées depuis Apple, pas les versions Microsoft Store.
2. Sur l’iPhone, active le mode développeur dans **Réglages → Confidentialité et sécurité → Mode développeur**.
3. Connecte l’iPhone au PC avec un câble USB et accepte **Faire confiance à cet ordinateur** sur le téléphone.
4. Ouvre Sideloadly, ajoute `JaaymaaAdmin-sideload.ipa`, puis choisis l’iPhone.
5. Saisis ton identifiant Apple directement dans Sideloadly et lance l’installation. Ne partage pas ton mot de passe Apple avec Jaaymaa ou Codemagic.
6. Si iOS demande d’approuver le profil, ouvre **Réglages → Général → VPN et gestion de l’appareil** et fais confiance au profil associé.

Un compte Apple gratuit permet d’utiliser l’application pendant 7 jours avant de la resigner. Sideloadly peut la renouveler automatiquement si l’iPhone peut rejoindre le PC par USB ou Wi-Fi; sinon, relance l’installation chaque semaine. Un compte Apple Developer payant peut prolonger la signature jusqu’à un an. [FAQ Sideloadly](https://sideloadly.io/faq)

## Compatibilité

- Identifiant de l’app : `sn.jaayma.admin`
- Version minimale : iOS 26
- Appareil : iPhone ou iPad
- L’IPA Sideloadly est une installation personnelle; ce n’est pas une version TestFlight ou App Store.

## Connexion à l’administration

La compilation de l’IPA ne déploie pas l’API mobile sur le site et ne modifie pas D1. Pour que la connexion admin fonctionne, les routes `/api/admin/ios/*` doivent être déployées sur le Worker et la migration `drizzle/migrations/0001_admin_mobile_login_rate_limit.sql` doit être appliquée à D1 après une sauvegarde. N’applique pas cette migration distante avant la sauvegarde prévue par le runbook.

## Protection des identifiants

Le dépôt ne contient pas d’identifiant Apple, de certificat de signature ni de clé privée de distribution. Saisis tes informations Apple uniquement dans Sideloadly sur ton PC.