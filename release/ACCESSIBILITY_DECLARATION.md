# Déclaration service d’accessibilité — ModérScroll

Texte à utiliser dans **Play Console** (déclaration API sensibles / accessibilité) et en cas de question du réviseur Google.

---

## Français (résumé)

ModérScroll propose un service d’accessibilité optionnel que l’utilisateur active manuellement dans les réglages Android (**Accessibilité → Services installés → ModérScroll - Reels/Shorts**).

**Objectif :** détecter quand l’utilisateur consulte TikTok, Instagram (Reels) ou YouTube (Shorts) afin d’appliquer les **limites quotidiennes** qu’il a définies dans l’application (compteur de vues, alertes, blocage à la limite).

**Données :** le service sert uniquement au fonctionnement des limites dans l’app. ModérScroll ne vend pas les données personnelles. L’utilisateur peut désactiver le service à tout moment dans les réglages système.

**Pourquoi l’accessibilité :** les API standard ne permettent pas à une app tierce de compter précisément le scroll dans d’autres applications vidéo ; le service d’accessibilité est le mécanisme choisi pour offrir cette fonctionnalité de bien-être numérique, avec consentement explicite.

---

## English (for Google review — copy-paste)

ModérScroll offers an optional Accessibility Service that users must manually enable in Android Settings (Accessibility → Installed services → ModérScroll - Reels/Shorts).

**Purpose:** detect when the user is viewing TikTok, Instagram Reels, or YouTube Shorts in order to enforce **daily viewing limits** configured in our app (view counters, notifications, blocking when the limit is reached).

**Data:** the service is used only to provide limit and wellbeing features inside ModérScroll. We do not sell personal data. Users can disable the service at any time in system settings.

**Why Accessibility:** standard Android APIs do not allow a third-party wellbeing app to reliably track short-form video usage inside other apps; the Accessibility Service is used with explicit user consent to deliver digital wellbeing functionality.

---

## Vidéo de démonstration (si Google la demande)

Enregistrement écran ~30–60 secondes :

1. Ouvrir ModérScroll → montrer choix de limite pour une app.  
2. Aller dans **Réglages Android → Accessibilité** → activer **ModérScroll - Reels/Shorts**.  
3. Ouvrir TikTok ou Instagram → montrer que le compteur / la limite réagit.  
4. (Optionnel) notification ou message quand la limite est atteinte.

Pas de musique ; voix off courte en français ou anglais acceptable.

---

## Dans l’app (déjà présent)

Texte système Android : `accessibility_service_description` dans  
`android/app/src/main/res/values/strings.xml`

L’écran d’accueil guide l’utilisateur pour activer notifications + accessibilité.
