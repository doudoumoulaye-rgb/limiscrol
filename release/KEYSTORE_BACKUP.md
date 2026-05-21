# Sauvegarde keystore ModérScroll (obligatoire)

Sans le **fichier `.keystore`** et les **mots de passe**, tu ne pourras **plus jamais** publier une mise à jour de la même app sur Google Play (Google exige la même clé de signature).

## Fichiers à conserver (3 éléments)

| Élément | Emplacement projet | Rôle |
|--------|---------------------|------|
| Fichier keystore | `android/keystore/moder-scroll-upload.keystore` | Clé de signature (binaire) |
| Mot de passe du store | `android/keystore.properties` → `storePassword` | Ouvre le fichier keystore |
| Alias + mot de passe clé | `keyAlias` + `keyPassword` | Signe l’AAB release |

**Ne jamais** committer sur GitHub : le `.keystore`, `keystore.properties`, ni un fichier avec les mots de passe en clair.

## Sauvegarde automatique (recommandé)

À la racine du projet :

```bash
chmod +x scripts/backup-keystore.sh
./scripts/backup-keystore.sh
```

Par défaut, copie vers `~/Documents/ModerScroll-keystore-backup/YYYY-MM-DD/`.

Autre dossier :

```bash
./scripts/backup-keystore.sh "/chemin/vers/clé USB/ModerScroll-backup"
```

Option archive chiffrée (mot de passe demandé) :

```bash
./scripts/backup-keystore.sh --encrypt
```

## Où stocker les copies (au moins 2 endroits)

1. **Disque externe** ou clé USB (hors du Mac principal)
2. **Coffre-fort numérique** : 1Password, Bitwarden, iCloud Keychain (note sécurisée)
3. **Cloud chiffré** (optionnel) : fichier `.zip` chiffré avec `--encrypt`, pas le keystore brut dans Dropbox/Google Drive

## Fiche credentials (hors repo)

1. Copier `release/keystore-credentials.template.txt` vers un endroit sûr (ex. coffre-fort).
2. Remplir les champs avec tes vrais mots de passe.
3. Ne pas laisser ce fichier dans le dossier du projet versionné.

## Vérifier que la signature release fonctionne

```bash
cd android
./gradlew bundleRelease
```

AAB généré : `android/app/build/outputs/bundle/release/app-release.aab`

Si erreur « keystore » / « password » → vérifier `android/keystore.properties` (copier depuis `keystore.properties.example`).

## Perte du keystore

- Google Play **ne peut pas** récupérer ta clé.
- Il faudrait contacter le support Google (processus long, pas garanti) ou publier une **nouvelle** app avec un nouvel `applicationId`.
- **Fais la sauvegarde avant le premier upload Play.**

## Checklist avant premier upload Play

- [ ] `./scripts/backup-keystore.sh` exécuté
- [ ] Copie sur USB ou cloud chiffré
- [ ] Mots de passe enregistrés dans un gestionnaire de mots de passe
- [ ] `bundleRelease` réussit localement
- [ ] Fichier `moder-scroll-upload.keystore` **absent** de GitHub (`git status` propre)
