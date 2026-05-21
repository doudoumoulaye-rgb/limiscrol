#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE_DIR="$PROJECT_ROOT/android/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/moder-scroll-upload.keystore"
PROPS_FILE="$PROJECT_ROOT/android/keystore.properties"
TEMPLATE="$PROJECT_ROOT/release/keystore-credentials.template.txt"

ENCRYPT=0
BACKUP_ROOT=""

for arg in "$@"; do
  case "$arg" in
    --encrypt) ENCRYPT=1 ;;
    -h|--help)
      echo "Usage: $0 [DEST_DIR] [--encrypt]"
      echo "  Default DEST: ~/Documents/ModerScroll-keystore-backup/YYYY-MM-DD"
      exit 0
      ;;
    *)
      if [[ -z "$BACKUP_ROOT" ]]; then
        BACKUP_ROOT="$arg"
      fi
      ;;
  esac
done

DATE_TAG="$(date +%Y-%m-%d)"
if [[ -z "$BACKUP_ROOT" ]]; then
  BACKUP_ROOT="$HOME/Documents/ModerScroll-keystore-backup/$DATE_TAG"
else
  BACKUP_ROOT="${BACKUP_ROOT%/}/$DATE_TAG"
fi

if [[ ! -f "$KEYSTORE_FILE" ]]; then
  echo "Erreur: keystore introuvable: $KEYSTORE_FILE"
  exit 1
fi

mkdir -p "$BACKUP_ROOT"

cp -p "$KEYSTORE_FILE" "$BACKUP_ROOT/"
if [[ -f "$PROPS_FILE" ]]; then
  cp -p "$PROPS_FILE" "$BACKUP_ROOT/keystore.properties"
else
  echo "Attention: android/keystore.properties absent — sauvegarde le keystore seul."
fi

if [[ -f "$TEMPLATE" ]]; then
  cp -p "$TEMPLATE" "$BACKUP_ROOT/keystore-credentials-A-REMPLIR.txt"
fi

if [[ -f "$PROPS_FILE" ]] && command -v keytool >/dev/null 2>&1; then
  # shellcheck disable=SC1090
  set -a && source <(grep -E '^(storePassword|keyAlias)=' "$PROPS_FILE" | sed 's/\r$//') && set +a
  if [[ -n "${storePassword:-}" && -n "${keyAlias:-}" ]]; then
    if keytool -export -rfc \
      -keystore "$KEYSTORE_FILE" \
      -alias "$keyAlias" \
      -storepass "$storePassword" \
      -file "$BACKUP_ROOT/upload-certificate.pem" 2>/dev/null; then
      echo "[backup] Certificat exporté: upload-certificate.pem"
    else
      echo "[backup] Export PEM ignoré (mot de passe ou alias incorrect)."
    fi
  fi
fi

cat > "$BACKUP_ROOT/LISEZMOI.txt" <<EOF
Sauvegarde ModérScroll — $DATE_TAG
==================================

Contenu:
- moder-scroll-upload.keystore  (clé d'UPLOAD — indispensable)
- upload-certificate.pem        (certificat public, pour Google Play si besoin)
- keystore.properties           (mots de passe — CONFIDENTIEL)
- keystore-credentials-A-REMPLIR.txt (fiche à compléter)
- DEUX-CLES-GOOGLE-PLAY.txt     (explication)

À faire:
1. Copier ce dossier sur USB / cloud CHIFFRÉ.
2. Remplir la fiche credentials dans un gestionnaire de mots de passe.
3. Ne jamais pousser ces fichiers sur GitHub.

Régénérer un AAB signé:
  cd "$PROJECT_ROOT/android" && ./gradlew bundleRelease
EOF

echo "[backup] OK → $BACKUP_ROOT"
ls -la "$BACKUP_ROOT"

if [[ "$ENCRYPT" -eq 1 ]]; then
  ARCHIVE="$BACKUP_ROOT.zip"
  if command -v zip >/dev/null 2>&1; then
    echo "[backup] Création archive chiffrée (mot de passe demandé)…"
    (cd "$(dirname "$BACKUP_ROOT")" && zip -er "$ARCHIVE" "$(basename "$BACKUP_ROOT")")
    echo "[backup] Archive: $ARCHIVE"
  else
    echo "[backup] 'zip' non trouvé — installe zip ou copie le dossier manuellement."
  fi
fi

echo ""
echo "Prochaine étape: copie ce dossier sur un 2e support (USB) et enregistre les mots de passe dans 1Password / Bitwarden."
