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

- [ ] `./scripts/backup-keystore.sh` exécuté (voir [KEYSTORE_BACKUP.md](./KEYSTORE_BACKUP.md))
- [ ] Copie keystore sur USB **ou** archive `--encrypt` + coffre-fort mots de passe
- [ ] Fiche `keystore-credentials` remplie (hors repo)
- [ ] Keystore **absent** de GitHub (`git status` ne liste pas `*.keystore`)
- [ ] Signature release configurée (`android/keystore.properties`)
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

Voir aussi **[PUBLICATION_PLAY_STORE.md](./PUBLICATION_PLAY_STORE.md)** (publication sans attendre les paiements).

- [ ] Premier onboarding complet (quiz + messages)
- [ ] Nouveau compte reçoit 500 crédits gratuits
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

---

## 8) Play Console — étape par étape (objectif ~90 %)

Progression indicative : coche chaque bloc. **Test interne d’abord**, production ensuite.

### Phase A — Test interne (priorité maintenant)

#### A1. Téléphone et installation
- [ ] Désinstaller toute ancienne version (Studio / APK manuel)
- [ ] Gmail ajouté en **licence de test** (Play Console → Réglages → Licence de test)
- [ ] Même Gmail dans **Testeurs internes** (liste e-mails)
- [ ] Installer via le **lien d’opt-in** test interne (pas « Mettre à jour » sur une vieille install)
- [ ] L’app s’ouvre sans crash au premier lancement

#### A2. Bundle sur Play
- [ ] `versionCode` incrémenté dans `android/app/build.gradle` (jamais réutiliser un numéro)
- [ ] `npm run build && npx cap sync android && cd android && ./gradlew bundleRelease`
- [ ] Upload `app-release.aab` → **Tests internes** → Créer version → Importer
- [ ] **Vérifier** → **Déployer** → attendre 15–60 min

#### A3. Abonnements (RevenueCat + Play)
- [ ] Play : abonnement `moder_scroll_premium` + forfait `monthly` **actif**
- [ ] RevenueCat : app Android `com.limitscroll.app` + **Service credentials** Google
- [ ] RevenueCat : produit Play lié à l’entitlement `pro`
- [ ] RevenueCat : offering `default` = courant, avec le package mensuel
- [ ] Dans l’app (install Play) : écran Premium affiche un prix Google Play (pas message orange)
- [ ] Achat test réussi + **Restaurer mes achats** OK

Voir [GOOGLE_PLAY_SUBSCRIPTIONS.md](./GOOGLE_PLAY_SUBSCRIPTIONS.md).

#### A4. Tests fonctionnels (build Play uniquement)
- [ ] Inscription email + code OTP
- [ ] Connexion Google
- [ ] Choisir limite TikTok / Instagram / YouTube + verrouiller
- [ ] Notifications (autorisation + palier limite atteinte si activé)
- [ ] Crédits → paywall → abonnement

---

### Phase B — Fiche Play Store (pour sortir du « unreviewed »)

Menu : **Présence sur le Play Store** → **Fiche Play Store principale**

- [ ] **Nom** : ModérScroll (ou LimitScroll — un seul nom partout)
- [ ] **Description courte** (80 car.) : limite de scroll Reels/Shorts
- [ ] **Description complète** : fonctionnalités, crédits gratuits, abonnement 3 CHF/mois
- [ ] **Icône** 512×512 (pas l’icône Android grise par défaut)
- [ ] **Graphique de présentation** 1024×500 (bannière)
- [ ] **Captures** : min. 2, idéal 4–8 (téléphone)
- [ ] **Catégorie** : Santé et bien-être ou Productivité
- [ ] **Coordonnées** : e-mail support
- [ ] **Politique de confidentialité** : URL publique HTTPS (voir ci-dessous)

#### Politique de confidentialité en ligne
- [ ] Publier le texte de `release/PRIVACY_POLICY_FR.md` (GitHub Pages, site perso, Notion public, etc.)
- [ ] Coller l’URL dans la fiche store **et** dans l’app si demandé

---

### Phase C — Conformité obligatoire

#### C1. Classification du contenu
- [ ] Play Console → **Règles et programmes** → **Classification du contenu**
- [ ] Questionnaire rempli (souvent « Tous publics » ou 12+ selon réponses)
- [ ] Certificat généré et appliqué à l’app

#### C2. Data safety (Sécurité des données)
- [ ] **Règles et programmes** → **Sécurité des données**
- [ ] Déclarer : e-mail, identifiants, stats d’usage (selon ce que l’app envoie vraiment)
- [ ] Supabase / backend : si sync cloud, indiquer collecte + chiffrement
- [ ] Paiements : gérés par Google Play (pas de carte stockée dans l’app)
- [ ] Lien politique de confidentialité identique à la fiche store

#### C3. Service d’accessibilité (très important pour ModérScroll)
- [ ] **Règles et programmes** → déclaration liée aux **API sensibles** / accessibilité
- [ ] Expliquer en anglais ou français :
  - *L’app utilise un service d’accessibilité pour détecter l’usage de TikTok, Instagram Reels et YouTube Shorts et appliquer les limites quotidiennes choisies par l’utilisateur. Aucune donnée n’est vendue. L’utilisateur active le service volontairement dans Réglages.*
- [ ] Vidéo courte de démo si Google la demande (activation du service + limite)

#### C4. Public cible et contenu
- [ ] **Public cible** : ex. 13+ ou 16+ (pas « enfants » sauf si app conçue pour eux)
- [ ] Pas de contenu trompeur sur les achats intégrés

---

### Phase D — Production (après test interne OK)

- [ ] Tous les points **Phase A** validés sur au moins 1 appareil
- [ ] Fiche store **Phase B** à 100 %
- [ ] Conformité **Phase C** à 100 %
- [ ] **Production** (ou test fermé) → nouvelle version → même AAB (ou build plus récent)
- [ ] Pays/régions : Suisse + France (+ autres si besoin)
- [ ] **Envoyer pour examen** → délai typique : 1–7 jours (parfois plus)

---

### Barème indicatif « % prêt Play »

| Étape | Poids | Ton statut (à cocher) |
|-------|-------|------------------------|
| Test interne install + app stable | 20 % | |
| Paiements Play + RevenueCat | 20 % | |
| Fiche store complète | 20 % | |
| Data safety + classification | 15 % | |
| Accessibilité déclarée | 15 % | |
| QA complète + soumission production | 10 % | |

**~90 %** = tout coché sauf éventuellement attente de la revue Google.

---

### En cas de refus Google

- Lire le mail **Politique** dans Play Console
- Corriger le point précis (souvent : accessibilité mal expliquée, URL privacy morte, achats in-app)
- Incrémenter `versionCode`, nouvel AAB, resoumettre

