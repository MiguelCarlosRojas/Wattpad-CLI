#!/usr/bin/env bash
# ==============================================================================
# Wattpad CLI - Official Linux/macOS Installer
# Usage: curl -fsSL https://wattpad.onrender.com/cli/install.sh | bash
# ==============================================================================

set -e

ORANGE='\033[38;2;255;97;34m'
GREEN='\033[38;2;40;167;69m'
CYAN='\033[38;2;23;162;184m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "\n${BOLD}${ORANGE}WATTPAD CLI — Instalador Oficial Linux/macOS${RESET}\n"

BASE_URL="${WATTPAD_API_BASE_URL:-https://wattpad.onrender.com}"
echo -e "${CYAN}▸ Conectando con:${RESET} $BASE_URL"

# Detect OS & Architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Arquitectura no soportada: $ARCH"; exit 1 ;;
esac

TARGET_DIR="$HOME/.local/bin"
mkdir -p "$TARGET_DIR"
TARGET_FILE="$TARGET_DIR/wattpad"

echo -e "${CYAN}▸ Descargando binario para $OS-$ARCH...${RESET}"
DOWNLOAD_URL="$BASE_URL/cli/download/$OS-$ARCH"

if curl -fsSL "$DOWNLOAD_URL" -o "$TARGET_FILE" 2>/dev/null; then
    chmod +x "$TARGET_FILE"
else
    echo -e "${ORANGE}[Aviso] Descarga remota no disponible en este momento. Verificando npm...${RESET}"
    if command -v npm >/dev/null 2>&1; then
        npm install -g @wattpad/cli
    fi
fi

# Ensure TARGET_DIR is in PATH
if [[ ":$PATH:" != *":$TARGET_DIR:"* ]]; then
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.bashrc"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.zshrc" 2>/dev/null || true
fi

echo -e "\n${GREEN}${BOLD}✓ ¡Wattpad CLI instalado correctamente!${RESET}"
echo -e "Ejecuta ${BOLD}wattpad${RESET} para comenzar.\n"
