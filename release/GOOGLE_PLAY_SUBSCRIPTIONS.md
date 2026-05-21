# Abonnements Google Play — ModérScroll

L’app utilise **RevenueCat** + **Google Play Billing** (plugin `@revenuecat/purchases-capacitor`).

**Guide pas à pas complet :** [SUBSCRIPTIONS_SETUP_COMPLET.md](./SUBSCRIPTIONS_SETUP_COMPLET.md)

## 1. Google Play Console

1. Ouvre [Google Play Console](https://play.google.com/console) → ton app **ModérScroll** (`com.limitscroll.app`).
2. **Monétisation** → **Produits** → **Abonnements** → **Créer un abonnement**.
3. Identifiant produit (obligatoire, à garder identique partout) :

   ```
   moder_scroll_premium
   ```

4. Ajoute **un forfait de base** :
   - `monthly` — mensuel (ex. CHF 3 / mois), **sans essai gratuit Play**
   - Les **500 crédits gratuits** sont gérés dans l’app (pas sur Google Play)

5. **Licence de test** : ajoute les adresses Gmail des testeurs (Réglages → Licence de test).

6. Publie l’abonnement (au minimum en **test interne** / **test fermé**).

## 2. RevenueCat

1. Crée un projet sur [app.revenuecat.com](https://app.revenuecat.com).
2. **Apps** → ajoute l’app Android :
   - Package : `com.limitscroll.app`
   - Colle la clé **Service credentials** JSON depuis Play Console (API Google Play).
3. **Entitlements** → crée `pro` (accès premium illimité).
4. **Products** → lie le produit Play `moder_scroll_premium` à l’entitlement `pro`.
5. **Offerings** → offering `default` avec un package (ex. `$rc_monthly` ou `monthly`) pointant vers ce produit.
6. **API keys** → copie la clé publique Android (`goog_...`).

## 3. Clés dans le projet

Dans `capacitor.config.json` :

```json
"revenueCat": {
  "entitlementId": "pro",
  "offeringId": "default",
  "androidApiKey": "goog_XXXXXXXXXXXX",
  "iosApiKey": "",
  "products": {
    "monthly5": "moder_scroll_premium"
  }
}
```

Ou pour un test rapide sans rebuild, dans la console WebView de l’app :

```js
localStorage.setItem("limitscrollRcKeyAndroid", "goog_XXXXXXXXXXXX");
location.reload();
```

Puis :

```bash
npm run build
npx cap sync android
```

## 4. Tester sur Android

1. Installe un build signé (debug ou internal testing) depuis Play — **les achats factices ne marchent pas en APK sideload simple**.
2. Connecte-toi avec un **compte testeur** Play.
3. Dans l’app : épuise les crédits ou ouvre **Profil → Abonnement**.
4. **S'abonner — 3 CHF / mois** → la feuille Google Play s’ouvre (un seul produit).
5. **Restore purchases** doit réactiver l’accès après réinstall.

## 5. Checklist avant production

- [ ] Produit `moder_scroll_premium` actif sur Play
- [ ] RevenueCat : produit + entitlement `pro` + offering `default`
- [ ] Clé `goog_...` dans `capacitor.config.json`
- [ ] Permission `com.android.vending.BILLING` dans le manifest (déjà ajoutée)
- [ ] Achat test OK + restauration OK
- [ ] Annulation testée via lien Google Play (Profil → gérer l’abonnement)

## 6. Dépannage

| Problème | Cause probable |
|----------|----------------|
| « Clés RevenueCat manquantes » | `androidApiKey` vide |
| « Produit introuvable » | Produit non publié / pas lié dans RevenueCat / mauvais offering |
| « Accès non activé » | Entitlement `pro` non attaché au produit |
| Achat ne s’affiche pas | App pas installée via Play, ou compte non testeur |

Documentation RevenueCat : https://www.revenuecat.com/docs/getting-started/installation/capacitor
