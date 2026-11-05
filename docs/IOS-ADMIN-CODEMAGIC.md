# App iOS Jaaymaa Admin avec Codemagic

L’application native se trouve dans `ios/JaaymaaAdmin`. Elle partage le dépôt avec le site Next.js, mais reste une app SwiftUI séparée. Le projet Xcode est généré à partir de `ios/project.yml` par XcodeGen pendant le build; aucun Mac n’est nécessaire pour modifier le code depuis Windows.

L’icône Jaaymaa Admin est dans `Assets.xcassets/AppIcon.appiconset` au format 1024 × 1024. Elle reprend le symbole Jaaymaa; iOS applique son masque et ses variantes d’apparence. La couleur d’accent native vient de la palette Jaaymaa.

## Premier build depuis Windows

1. Envoie le dépôt sur le fournisseur Git relié à Codemagic.
2. Dans Codemagic, ajoute cette application et autorise l’accès au dépôt.
3. Codemagic détecte le `codemagic.yaml` à la racine. Lance manuellement le workflow **Jaaymaa Admin · iOS Simulator**.
4. Le workflow utilise un Mac cloud avec Xcode 27.1, génère le projet Xcode et produit une app de simulateur non signée.

Le workflow est manuel : les changements courants du site ne déclencheront pas automatiquement un build iOS.

## Installation sur iPhone et TestFlight

Le fichier de simulateur sert à compiler et vérifier la base de l’app; il ne s’installe pas sur un iPhone réel. Pour distribuer sur appareil ou via TestFlight, il faudra un compte Apple Developer actif, un enregistrement de l’app dans App Store Connect, puis un workflow Codemagic signé. La clé App Store Connect et les certificats restent dans les intégrations et les variables secrètes Codemagic, jamais dans le dépôt.

## Activation de l’accès admin mobile

L’API mobile vérifie la même liste `ADMIN_PHONES` que l’administration web, stocke les tentatives de connexion sous forme de clés IP hachées, et l’app garde son jeton dans le Trousseau iOS. Avant de publier cette API, appliquer la migration `drizzle/migrations/0001_admin_mobile_login_rate_limit.sql` à D1. Cette migration n’a pas été appliquée à la base distante et l’API n’a pas été déployée dans cette étape.

L’API mobile est exemptée du mode maintenance, mais chaque endpoint de données exige un jeton de session valide associé à un numéro présent dans `ADMIN_PHONES`.
