# Sécurité des données (Data safety) — ModérScroll

Guide pour remplir le formulaire **Play Console → Règles et programmes → Sécurité des données**.

Adapte si ton backend Supabase / API n’est pas encore en production.

---

## Vue d’ensemble

| Question | Réponse suggérée |
|----------|------------------|
| L’app collecte-t-elle des données ? | **Oui** |
| Toutes les données chiffrées en transit ? | **Oui** (HTTPS / TLS pour Supabase et API) |
| Les utilisateurs peuvent-ils demander la suppression ? | **Oui** (déconnexion + suppression compte / données locales) |

---

## Types de données (selon ce que tu utilises)

### Compte / identité

| Donnée | Collectée ? | Partagée ? | Obligatoire ? | Finalité |
|--------|-------------|------------|---------------|----------|
| **Adresse e-mail** | Oui (si inscription email) | Non (sauf hébergeur auth) | Non | Compte, connexion |
| **Identifiants** (ID utilisateur Supabase) | Oui | Non | Non | Compte, sync |

### Activité dans l’app

| Donnée | Collectée ? | Finalité |
|--------|-------------|----------|
| **Interactions avec l’app** (limites, vues, crédits, défis) | Oui (local + sync si cloud) | Fonctionnement de l’app |
| **Diagnostics** (crashes) | Optionnel si tu actives Play Vitals / Firebase plus tard | Stabilité |

### Pas collecté par ModérScroll directement

- Position GPS  
- Contacts  
- Photos (sauf photo de profil si tu l’envoies au backend — sinon local seulement)  
- Numéro de carte bancaire (paiement via **Google Play** uniquement)

---

## Fournisseurs tiers à mentionner

| Service | Rôle |
|---------|------|
| **Supabase** | Authentification (email, Google), base de données sync si activée |
| **Google Play** | Distribution, achats in-app / abonnements |
| **RevenueCat** | Gestion des abonnements (quand activé) |

---

## Stockage et sécurité

- **Données locales** : préférences, limites, stats sur l’appareil (`localStorage` / stockage app).  
- **Données cloud** : si backend configuré (`config/app.public.json`), état de progression synchronisé chez Supabase.  
- **Chiffrement en transit** : oui (HTTPS).  
- **Vente de données** : **Non**.

---

## Lien politique de confidentialité

Même URL que sur la fiche store (page `docs/privacy.html` ou équivalent).

---

## Achats in-app

- **Oui**, l’app propose un abonnement.  
- Traitement des paiements : **Google Play** (pas stockage des coordonnées bancaires dans l’app).

Si les achats ne sont pas encore actifs en production, la déclaration reste valable si le produit est déclaré dans Play Console.

---

## Public cible

- App **non destinée aux enfants** (cible 13+ / adultes).  
- Ne pas cocher « application destinée aux enfants » sauf refonte complète COPPA.

---

## Après envoi

Si Google pose des questions, ils vérifient surtout :

- Cohérence avec la **politique de confidentialité**  
- Usage de l’**accessibilité** (déclaration séparée)  
- Données réellement collectées vs déclarées
