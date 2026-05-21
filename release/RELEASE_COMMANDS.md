# Commandes Release

## Préparation générale

```powershell
npm install
npm run build
npm run sync
```

## Keystore (avant tout upload Play)

**Obligatoire** — voir [KEYSTORE_BACKUP.md](./KEYSTORE_BACKUP.md).

```bash
chmod +x scripts/backup-keystore.sh
./scripts/backup-keystore.sh --encrypt
```

Fichiers signés : `android/keystore/moder-scroll-upload.keystore` + `android/keystore.properties` (gitignored).

## Android (AAB Release)

Depuis le terminal (si `keystore.properties` est configuré) :

```bash
cd android
./gradlew bundleRelease
```

AAB : `android/app/build/outputs/bundle/release/app-release.aab`

Ou via Android Studio :

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

