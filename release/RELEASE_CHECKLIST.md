# Release Checklist - LimitScroll

## 1) Comptes développeur

- [ ] Google Play Console créé et vérifié
- [ ] Apple Developer Program créé et vérifié
- [ ] Informations légales entreprise/personne complétées
- [ ] Moyen de paiement configuré côté stores

## 2) Identité produit

- [ ] Nom app: `LimitScroll`
- [ ] Sous-titre / slogan validé
- [ ] Icône finale validée (1024x1024)
- [ ] Couleurs et branding cohérents

## 3) Build et versioning

- [ ] `npm run build`
- [ ] `npm run sync`
- [ ] Version app incrémentée
- [ ] Numéro de build incrémenté

## 4) Android (Google Play)

- [ ] Keystore release créé et sauvegardé
- [ ] Signature release configurée
- [ ] `AAB` release généré
- [ ] Upload sur Google Play Console
- [ ] Catégorie + fiche store remplie
- [ ] Captures uploadées
- [ ] Politique de confidentialité URL renseignée
- [ ] Déclaration Data safety remplie
- [ ] Release en review

## 5) iOS (App Store)

- [ ] Bundle ID vérifié
- [ ] Signing & Capabilities OK
- [ ] Archive release générée dans Xcode
- [ ] Build envoyé vers App Store Connect
- [ ] Fiche App Store complétée
- [ ] Captures iPhone uploadées
- [ ] Politique de confidentialité URL renseignée
- [ ] App Privacy (nutrition labels) remplie
- [ ] Build soumis en review

## 6) QA finale avant soumission

- [ ] Premier onboarding complet (quiz + messages)
- [ ] Nouveau compte reçoit 2000 crédits gratuits
- [ ] Compteur crédits diminue bien à chaque vidéo
- [ ] Blocage et paywall quand crédits à 0
- [ ] Après paiement: accès illimité
- [ ] Limite quotidienne: confirmation + verrou 24h
- [ ] Reset du compteur de vues au jour suivant
- [ ] Profil / stats / défis fonctionnent
- [ ] Pas de crash sur Android
- [ ] Pas de crash sur iOS

## 7) Après publication

- [ ] Vérifier app visible dans les stores
- [ ] Vérifier installation propre depuis store
- [ ] Vérifier onboarding en production
- [ ] Surveiller crash reports et avis utilisateurs

