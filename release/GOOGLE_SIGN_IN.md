# Connexion Google — configuration (Supabase + Android)

Message typique : *« Google n'a pas validé cette application »* ou *« Accès bloqué »*.

Ce n'est **pas** un bug de l'app : il faut configurer **Google Cloud** + **Supabase**. En mode test, seuls les comptes **testeurs** peuvent se connecter.

> **Important :** pour **Supabase**, utilise un client OAuth **Application Web** (Client ID + **secret**).  
> Le client **Android** seul ne fournit pas de secret — c’est normal. Tu peux créer 0 ou 1 client Android (SHA-1) en plus, mais **Supabase = toujours le client Web**.

---

## Étape 1 — Google Cloud Console

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Crée un projet (ex. `ModérScroll`) ou sélectionne-le.
3. **APIs & Services** → **OAuth consent screen** :
   - Type : **Externe**
   - Nom de l'app : `ModérScroll`
   - E-mail d'assistance : ton Gmail
   - **État : Testing** (normal au début)
   - **Test users** → **Add users** → ajoute **ton Gmail** (et ceux des testeurs)
   - Enregistre

> Sans ton Gmail dans **Test users**, Google refuse la connexion tant que l'app n'est pas « Published ».

---

## Étape 2 — Identifiants OAuth (le plus important)

**APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**

### A) Client **Web** (obligatoire pour Supabase)

- Type : **Web application**
- Nom : `ModérScroll Supabase`
- **Authorized redirect URIs** — ajoute **exactement** :

```text
https://TON_PROJECT_ID.supabase.co/auth/v1/callback
```

Remplace `TON_PROJECT_ID` par l'ID de ton projet Supabase (ex. `zdpjwzpqpnnkzqyjcqbq`).

→ Copie le **Client ID** et le **Client secret**.

### B) Client **Android** (recommandé pour l'app mobile)

- Type : **Android**
- Package name : `com.limitscroll.app`
- **SHA-1** : empreinte de ton keystore de signature :

```bash
cd android
keytool -list -v -keystore keystore/moder-scroll-upload.keystore -alias moder-scroll
```

(Mot de passe = celui dans `keystore.properties` → `storePassword`.)

Copie la ligne **SHA1:** dans Google Cloud. (Optionnel si tu n’utilises que le client Web pour Supabase.)

---

## E-mail « Bienvenue » après connexion Google

L’app appelle le backend après chaque connexion réussie. Le serveur envoie **une seule fois** un mail via **Resend** (`noreply@moder-scroll.com`).

Variables sur l’API (Render, etc.) :

- `RESEND_API_KEY` — même clé que pour le SMTP Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — pour marquer l’envoi dans le profil utilisateur
- `WELCOME_EMAIL_FROM` — optionnel

Sans `RESEND_API_KEY`, la connexion Google fonctionne quand même ; seul le mail de bienvenue est ignoré.

---

## Étape 3 — Supabase

1. [supabase.com](https://supabase.com) → ton projet → **Authentication** → **Providers** → **Google**.
2. **Enable** = ON
3. Colle le **Client ID** et **Client secret** du client **Web** (étape 2A).
4. Enregistre.

### URLs de redirection (Supabase)

**Authentication** → **URL Configuration** :

| Champ | Valeur |
|-------|--------|
| **Site URL** | `https://limiscrol.onrender.com` |
| **Redirect URLs** | Ajoute chaque ligne : |

```text
https://limiscrol.onrender.com/auth/mobile-callback
com.limitscroll.app://auth/callback
com.limitscroll.app://**
```

---

## Étape 4 — Tester sur le téléphone

1. Rebuild : `npm run build && npx cap sync android` (+ nouvel AAB ou install USB).
2. Utilise un Gmail **ajouté comme Test user** (étape 1).
3. Si Google affiche *« Application non validée »* :
   - Clique **Avancé**
   - Puis **Accéder à ModérScroll (non sécurisé)** — normal en mode Testing.

---

## Erreurs fréquentes

| Message | Solution |
|---------|----------|
| `redirect_uri_mismatch` | URI de callback Supabase mal copiée dans Google (étape 2A) |
| `access_denied` | Ton Gmail n'est pas dans **Test users** |
| `provider not enabled` | Active Google dans Supabase (étape 3) |
| App non validée | Mode Testing → ajoute testeurs ou publie l'écran de consentement (plus long) |

---

## Publication OAuth (plus tard, pour tout le monde)

Quand l'app est sur le Play Store et que tu veux que **n'importe qui** se connecte avec Google sans être testeur :

- **OAuth consent screen** → **Publish app**
- Parfois vérification Google (logo, politique de confidentialité, vidéo) — plusieurs jours.

En **Tests internes Play**, garde le mode **Testing** + liste de testeurs Google, c'est suffisant.

---

## En attendant

**Continuer avec l'e-mail** fonctionne sans Google Cloud.
