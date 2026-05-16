# Commandes Release

## Préparation générale

```powershell
npm install
npm run build
npm run sync
```

## Android (AAB Release)

1) Ouvrir Android Studio:

```powershell
npm run android
```

2) Dans Android Studio:
- Build > Generate Signed Bundle / APK
- Choisir Android App Bundle (AAB)
- Sélectionner/Créer le keystore
- Build type: `release`

3) Résultat:
- Fichier `.aab` prêt pour Google Play Console

## iOS (Archive Release)

1) Ouvrir Xcode:

```powershell
npm run ios
```

2) Dans Xcode:
- Sélectionner target `App`
- Signing & Capabilities: équipe/profil valides
- Product > Archive
- Distribute App > App Store Connect

3) Résultat:
- Build disponible dans App Store Connect

## Vérification rapide avant upload

```powershell
npm run build
npm run sync
```

