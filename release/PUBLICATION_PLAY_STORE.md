# Publication Google Play — ModérScroll (sans attendre les paiements)

Guide pour soumettre l’app **en production** (ou test fermé). Tu règles **RevenueCat / paiements** plus tard.

---

## Ordre recommandé

| # | Tâche | Fichier d’aide |
|---|--------|----------------|
| 1 | Politique de confidentialité **en ligne** (URL HTTPS) | `PRIVACY_POLICY_FR.md` + `docs/privacy.html` |
| 2 | Fiche Play Store (textes + visuels) | `STORE_LISTING_FR.md` |
| 3 | Classification du contenu | Play Console |
| 4 | Sécurité des données (Data safety) | `DATA_SAFETY_GUIDE.md` |
| 5 | Déclaration **service d’accessibilité** | `ACCESSIBILITY_DECLARATION.md` |
| 6 | Bundle release (AAB) version **5+** | `RELEASE_COMMANDS.md` |
| 7 | Soumission **Production** ou **Test fermé** | Play Console |

**Paiements :** section optionnelle — voir [GOOGLE_PLAY_SUBSCRIPTIONS.md](./GOOGLE_PLAY_SUBSCRIPTIONS.md) quand tu seras prête.

---

## 1. Politique de confidentialité (obligatoire)

Play exige une **URL publique** (pas seulement le texte dans l’app).

### Option rapide — GitHub Pages

1. Pousse le repo sur GitHub (sans keystore ni `.json` de compte de service).
2. **Settings** → **Pages** → source : branche `main`, dossier `/docs`.
3. Le fichier `docs/privacy.html` sera accessible à :  
   `https://TON_UTILISATEUR.github.io/NOM_DU_REPO/privacy.html`
4. Colle cette URL dans :
   - Play Console → **Fiche Play Store** → Politique de confidentialité
   - Play Console → **Sécurité des données** → lien politique

### Autres options

- Site perso, Notion (page publique), Render static site.

**Email support** dans la politique : mets un email que tu lis vraiment (ex. `support@limitscroll.app` ou ton Gmail pro).

---

## 2. Fiche Play Store

Copier-coller depuis **`STORE_LISTING_FR.md`** :

- Nom : **ModérScroll**
- Description courte / longue
- Catégorie suggérée : **Santé et bien-être** ou **Productivité**
- **Icône 512×512** : `assets/icon-moder-scroll-1024.png` (redimensionner si besoin)
- **Graphique 1024×500** : bannière (créer ou utiliser `assets/splash-brand.png` adapté)
- **Captures** : 4–8 écrans (accueil, limites, profil, stats) depuis un vrai téléphone

---

## 3. Classification du contenu

Play Console → **Règles et programmes** → **Classification du contenu**

Réponses typiques pour ModérScroll :

- Pas une app pour enfants ciblée
- Pas de violence / contenu adulte dans l’app
- L’app aide à limiter le temps sur des réseaux sociaux
- Public : souvent **13+** ou **16+** selon le questionnaire

Génère le certificat et applique-le à l’app.

---

## 4. Sécurité des données (Data safety)

Remplir avec **`DATA_SAFETY_GUIDE.md`** (aligné sur Supabase + stockage local).

Points clés :

- Email / compte si connexion Supabase
- Données d’usage (limites, stats) — local + sync cloud si backend actif
- Pas de vente de données
- Paiements : Google Play quand actif (pas de carte dans l’app)

---

## 5. Accessibilité (critique pour ModérScroll)

Google examine les apps qui utilisent un **service d’accessibilité**.

- Déclaration : texte dans **`ACCESSIBILITY_DECLARATION.md`**
- Vidéo courte (30–60 s) si demandée : activer le service ModérScroll dans Réglages Android → montrer une limite sur TikTok/Instagram/YouTube

Sans explication claire → **refus fréquent**.

---

## 6. Build à envoyer

```bash
cd "/Users/papadoudou/Desktop/APPL limitscrol"
# Incrémenter versionCode dans android/app/build.gradle avant chaque upload
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

Fichier : `android/app/build/outputs/bundle/release/app-release.aab`

**Keystore :** obligatoire — voir [KEYSTORE_BACKUP.md](./KEYSTORE_BACKUP.md).

Pour une nouvelle soumission après les textes 3 CHF : **versionCode 5** minimum (4 déjà utilisé).

---

## 7. Soumission production

1. Play Console → **Production** (ou **Test fermé** pour valider la fiche sans tout le public)
2. **Créer une version** → importer le **AAB**
3. **Vérifier** que tous les voyants sont verts (fiche, classification, data safety, pays)
4. **Envoyer pour examen**

Délai habituel : **quelques jours à 2 semaines**.

---

## Paiements plus tard

Quand RevenueCat est vert :

1. Abonnement Play actif + credentials OK
2. Test achat sur piste **test interne**
3. Mettre à jour la fiche si le prix affiché change (3 CHF/mois)
4. Nouveau AAB si tu modifies l’app

Tu peux publier **sans** achat fonctionnel si la fiche mentionne l’abonnement et que Google teste — risque de refus si le bouton « S’abonner » mène à une erreur. **Recommandation :** test fermé d’abord, ou désactiver temporairement le paywall jusqu’à paiement OK (à discuter si besoin).

---

## Checklist rapide « prêt à poster »

- [ ] URL politique de confidentialité en ligne
- [ ] Fiche store complète (icône, captures, descriptions)
- [ ] Classification du contenu
- [ ] Data safety
- [ ] Déclaration accessibilité (+ vidéo si demandée)
- [ ] AAB signé, versionCode jamais réutilisé
- [ ] Compte développeur validé
- [ ] App testée : inscription, Google, limites, notifications (hors achat si reporté)

---

## Fichiers du dossier `release/`

| Fichier | Usage |
|---------|--------|
| `PUBLICATION_PLAY_STORE.md` | Ce guide |
| `STORE_LISTING_FR.md` | Textes fiche store |
| `DATA_SAFETY_GUIDE.md` | Formulaire Data safety |
| `ACCESSIBILITY_DECLARATION.md` | Texte pour Google |
| `PRIVACY_POLICY_FR.md` | Source politique |
| `RELEASE_COMMANDS.md` | Commandes build |
| `RELEASE_CHECKLIST.md` | Checklist complète |
