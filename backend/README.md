# Backend LimitScroll (Node.js + Supabase)

## Auth (email, Google, Apple)

L'auth est gérée par Supabase Auth. Le backend vérifie le token `Bearer` envoyé par l'app mobile.

### Supabase — URLs de redirection (obligatoire pour Android)

Dans **Authentication → URL Configuration** :

| Champ | Valeur |
|-------|--------|
| **Site URL** | `https://limiscrol.onrender.com` |
| **Redirect URLs** | Ajoute **chaque** ligne ci-dessous |

```text
https://limiscrol.onrender.com/auth/mobile-callback
com.limitscroll.app://auth/callback
com.limitscroll.app://**
```

L’URL **HTTPS** (`/auth/mobile-callback`) est le pont fiable : Supabase redirige d’abord vers ton API, puis la page renvoie vers l’app. Les schemes `com.limitscroll.app://…` restent en secours.

Déploie le backend sur Render après modification pour que `/auth/mobile-callback` existe.

## Setup local

1. Copier `.env.example` vers `.env` (déjà dans `.gitignore`)
2. Renseigner `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Exécuter le schéma SQL : `backend/supabase-schema.sql` dans Supabase → SQL Editor
4. Lancer :

```bash
npm run backend:dev
```

## App mobile — URL API & Supabase (hors repo)

Les clés **ne sont plus** dans `index.html`. Au build (`npm run build`), elles sont injectées depuis :

1. `config/app.public.json` (copier `config/app.public.example.json`, fichier gitignored), ou
2. variables d'environnement : `MODERSCROLL_API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, ou
3. `backend/.env` (reprise automatique de `SUPABASE_*` en local)

Exemple `config/app.public.json` :

```json
{
  "apiBaseUrl": "https://api.tondomaine.com",
  "supabaseUrl": "https://xxxx.supabase.co",
  "supabaseAnonKey": "eyJ..."
}
```

Puis build store :

```bash
npm run build && npx cap sync android
```

**Ne jamais** committer : `backend/.env`, `.env`, `config/app.public.json`, ni la `service_role` dans l'app.

## Déploiement production

### Variables obligatoires (plateforme)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | Port d'écoute (souvent imposé par la plateforme) |
| `SUPABASE_URL` | URL projet Supabase |
| `SUPABASE_ANON_KEY` | Clé anon (vérif JWT côté auth middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement** — persistance état + e-mail bienvenue |
| `RESEND_API_KEY` | Clé API Resend — e-mail « Bienvenue dans ModérScroll » après connexion |
| `WELCOME_EMAIL_FROM` | Optionnel — défaut `ModérScroll <noreply@moder-scroll.com>` |
| `CORS_ORIGINS` | Optionnel — voir ci-dessous |

### CORS

- **App Capacitor (Android/iOS)** : laisser `CORS_ORIGINS` vide. Les requêtes natives n'envoient souvent pas d'`Origin` ; le backend accepte ce cas.
- **Site web sur un domaine** : définir les origines exactes en HTTPS, ex.  
  `CORS_ORIGINS=https://app.tondomaine.com`

### Exemple Render / Railway

1. Créer un service Node, racine `backend/`, commande `npm start`
2. Ajouter les variables ci-dessus dans le dashboard
3. Activer HTTPS (URL publique du type `https://moder-scroll-api.onrender.com`)
4. Mettre cette URL dans `config/app.public.json` → `apiBaseUrl`, puis rebuild l'app

### Health check

```bash
curl https://api.tondomaine.com/health
```

Réponse attendue : `{"ok":true,"authProviders":[...],"supabaseConfigured":true}`  
(sans `missingEnv` en production)

## Endpoints

- `GET /health` — état backend
- `GET /auth/me` — utilisateur courant (Bearer requis)
- `GET /api/state` — état complet
- `PUT /api/state` — sync état client
- `PUT /api/limits/:app` — limite + lock 24h (`tiktok|instagram|youtube`)
- `POST /api/views/consume` — consomme 1 vue
- `POST /api/auth/send-welcome-email` — envoie une fois l’e-mail de bienvenue (Google ou e-mail)

## Exemples API

```bash
curl http://localhost:8787/health
```

```bash
curl http://localhost:8787/api/state \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>"
```

```bash
curl -X PUT http://localhost:8787/api/limits/tiktok \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"limit":120}'
```
