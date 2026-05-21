# Abonnements — configuration complète (Play + RevenueCat + app)

Guide pour activer **vraiment** l’abo **3 CHF/mois** (`moder_scroll_premium`).

---

## Identifiants (à garder identiques partout)

| Élément | Valeur |
|---------|--------|
| Package Android | `com.limitscroll.app` |
| Produit Play | `moder_scroll_premium` |
| Forfait de base | `monthly` |
| Entitlement RevenueCat | `pro` |
| Offering RevenueCat | `default` |
| Clé publique Android | `goog_...` dans `config/subscriptions.json` |
| Mapping app | `monthly5` → `moder_scroll_premium` |

---

## Partie A — Google Play Console

### A1. Abonnement

1. **Monétiser avec Play** → **Produits** → **Abonnements** → `moder_scroll_premium`
2. Forfait **`monthly`** : **3 CHF / mois**, statut **Actif**
3. Pas d’essai gratuit Play (les 500 crédits sont dans l’app)

### A2. Publier l’abo sur une piste de test

L’abo doit être disponible sur la **même piste** que l’APK/AAB :

- **Test interne** ou **Test fermé** → crée une version et envoie l’AAB
- Sans version sur la piste, le store ne renvoie pas le produit → erreur 23 / « Store non prêt »

### A3. Comptes de test

1. **Paramètres** → **Testeurs de licence** → ajoute ton Gmail (+ testeurs)
2. **Test et publier** → test interne/fermé → **testeurs** invités
3. Installe l’app **uniquement via le lien Play** (pas APK copié à la main)

### A4. API Google Play (pour RevenueCat)

1. **Paramètres** → **Accès aux API** → lie le projet Google Cloud
2. Crée un **compte de service** (ou utilise `revenue-cat-service@...`)
3. Droits Play pour ce compte (au minimum) :
   - Voir les données financières
   - Gérer les commandes et les abonnements
   - Voir les informations sur les applications
4. Télécharge le **JSON** (ne jamais le committer)

---

## Partie B — RevenueCat

Dashboard : [app.revenuecat.com](https://app.revenuecat.com)

### B1. App Android

- **Project** → **Apps** → Android
- Package : `com.limitscroll.app`
- **Service credentials** : upload le JSON Play (section A4)

### B2. Entitlement

- **Entitlements** → créer **`pro`** (accès premium illimité)

### B3. Produit Google Play

- **Products** → **+ New** → **Google Play**
- Subscription ID : **`moder_scroll_premium`**
- Attacher à l’entitlement **`pro`**
- Attendre le statut **valid** / synchronisé (parfois 15 min – 24 h)

### B4. Offering

- **Offerings** → offering **`default`**
- Cocher **Current offering**
- Ajouter un package (ex. **Monthly** / `$rc_monthly`) → produit **`moder_scroll_premium`**

### B5. Clé API

- **API keys** → clé publique Android **`goog_...`**
- Doit être la **même** que dans `config/subscriptions.json` et `capacitor.config.json`

### B6. Vérifier (erreur 23)

Dans RevenueCat → produit Android :

- Credentials : **valid**
- Product : lié à Play, pas « missing »
- Si erreur persiste : régénérer le JSON, revérifier les rôles Play, attendre 2–24 h

---

## Partie C — Projet (déjà en place)

Fichiers :

- `config/subscriptions.json`
- `capacitor.config.json` → `revenueCat`
- `android/app/src/main/AndroidManifest.xml` → `BILLING`
- Plugin `@revenuecat/purchases-capacitor`

Rebuild obligatoire après changement de clé :

```bash
cd "/Users/papadoudou/Desktop/APPL limitscrol"
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

Copie l’AAB vers `release/` si besoin.

**versionCode** : incrémente à chaque upload Play (ex. 5, 6…).

---

## Partie D — Test réel sur téléphone

1. Gmail dans **testeurs de licence** + **testeurs** de la piste
2. Installe depuis le **lien test interne** Play
3. Ouvre ModérScroll → **Profil** → **Abonnement** (ou écran Premium)
4. Le bouton **« S'abonner — 3 CHF / mois »** doit être **bleu** (pas gris)
5. Sous le bouton : prix affiché (pas « Store non prêt »)
6. Achat test → feuille Google Play → confirme (carte test / pas facturé pour testeur)
7. **Restaurer mes achats** après réinstall
8. **Gérer l'abonnement** → annulation test Play

### Achat test Google

Les testeurs de licence voient des achats **sans vraie facturation**.

---

## Dépannage rapide

| Symptôme | Action |
|----------|--------|
| Bouton gris, « Store non prêt » | AAB sur piste test + install via Play + abo actif + offering RC |
| Erreur 23 | JSON Play dans RC + permissions + attendre sync |
| Offering vide | `default` = current + package → `moder_scroll_premium` |
| Clé manquante | `npm run build` (injecte `goog_...` dans dist) |
| Achat OK mais pas premium | Entitlement `pro` pas lié au produit |
| APK sideload | **Interdit** pour Billing — passer par Play |

---

## Checklist finale

- [ ] Play : `moder_scroll_premium` + `monthly` actifs sur piste test
- [ ] Play : testeurs licence + testeurs piste
- [ ] Play : JSON compte de service OK
- [ ] RevenueCat : credentials valid
- [ ] RevenueCat : produit → entitlement `pro`
- [ ] RevenueCat : offering `default` + package
- [ ] App : rebuild AAB versionCode nouveau
- [ ] Test achat + restore OK sur téléphone
