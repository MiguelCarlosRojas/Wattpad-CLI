#!/usr/bin/env bash
# ==============================================================================
# Wattpad CLI - Official Linux/macOS Installer
# Usage: curl -fsSL https://wattpad-cli.onrender.com/cli/install.sh | bash
# ==============================================================================

set -e

ORANGE='\033[38;2;255;97;34m'
GREEN='\033[38;2;50;213;131m'
CYAN='\033[38;2;96;165;250m'
YELLOW='\033[38;2;254;200;75m'
RED='\033[38;2;249;112;102m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "\n${BOLD}${ORANGE}WATTPAD CLI — AI WRITING STUDIO${RESET}"
echo -e "${CYAN}Instalador Oficial para Linux y macOS${RESET}\n"

BASE_URL="${WATTPAD_API_BASE_URL:-https://wattpad-cli.onrender.com}"
echo -e "${CYAN}▸ Conectando con servidor oficial:${RESET} $BASE_URL"

# 1. Detect OS & Architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  linux)
    PLATFORM_OS="linux"
    ;;
  darwin)
    PLATFORM_OS="darwin"
    ;;
  *)
    echo -e "${RED}✕ Sistema operativo no soportado directamente:${RESET} $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64)
    PLATFORM_ARCH="x64"
    ;;
  aarch64|arm64)
    PLATFORM_ARCH="arm64"
    ;;
  *)
    echo -e "${RED}✕ Arquitectura no soportada:${RESET} $ARCH"
    exit 1
    ;;
esac

TARGET_PLATFORM="${PLATFORM_OS}-${PLATFORM_ARCH}"
echo -e "${GREEN}✓ Plataforma detectada:${RESET} $TARGET_PLATFORM"

TARGET_DIR="$HOME/.local/bin"
mkdir -p "$TARGET_DIR"
TARGET_FILE="$TARGET_DIR/wattpad"

# 2. Query cloud discovery manifest for official SHA-256
EXPECTED_HASH=""
CONFIG_JSON=$(curl -fsSL --connect-timeout 10 "$BASE_URL/cli/config" 2>/dev/null || true)
if [ -n "$CONFIG_JSON" ] && command -v grep >/dev/null 2>&1; then
    EXPECTED_HASH=$(echo "$CONFIG_JSON" | grep -o "\"${TARGET_PLATFORM}\":{[^}]*\"sha256\":\"[^\"]*\"" | grep -o "\"sha256\":\"[^\"]*\"" | cut -d'"' -f4 || true)
fi

echo -e "${CYAN}▸ Descargando binario oficial para ${TARGET_PLATFORM}...${RESET}"
DOWNLOAD_URL="$BASE_URL/cli/download/$TARGET_PLATFORM"
TEMP_FILE="/tmp/wattpad-download-$$.tmp"

DOWNLOAD_SUCCESS=0
if curl -fSL --progress-bar "$DOWNLOAD_URL" -o "$TEMP_FILE" 2>/dev/null; then
    DOWNLOAD_SUCCESS=1
else
    # Fallback to GitHub Releases latest
    GITHUB_URL="https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/latest/download/wattpad-$TARGET_PLATFORM"
    echo -e "${YELLOW}▸ Reintentando desde GitHub Releases...${RESET}"
    if curl -fSL --progress-bar "$GITHUB_URL" -o "$TEMP_FILE" 2>/dev/null; then
        DOWNLOAD_SUCCESS=1
    fi
fi

if [ "$DOWNLOAD_SUCCESS" -eq 1 ] && [ -s "$TEMP_FILE" ]; then
    # Verify SHA-256 if expected hash is available
    if [ -n "$EXPECTED_HASH" ]; then
        if command -v sha256sum >/dev/null 2>&1; then
            CALCULATED_HASH=$(sha256sum "$TEMP_FILE" | awk '{print $1}')
        elif command -v shasum >/dev/null 2>&1; then
            CALCULATED_HASH=$(shasum -a 256 "$TEMP_FILE" | awk '{print $1}')
        fi

        if [ -n "$CALCULATED_HASH" ]; then
            if [ "$CALCULATED_HASH" != "$EXPECTED_HASH" ]; then
                echo -e "${YELLOW}[Aviso] La suma de comprobación difiere del manifiesto cloud.${RESET}"
            else
                echo -e "${GREEN}✓ Integridad SHA-256 verificada con éxito.${RESET}"
            fi
        fi
    fi

    mv "$TEMP_FILE" "$TARGET_FILE"
    chmod +x "$TARGET_FILE"
else
    rm -f "$TEMP_FILE"
    echo -e "${YELLOW}[Aviso] El binario precompilado para ${TARGET_PLATFORM} no está disponible directamente.${RESET}"
    echo -e "Puedes instalar Wattpad CLI mediante npm:"
    echo -e "  ${BOLD}npm install -g @wattpad/cli${RESET}\n"
    exit 1
fi

# 3. Ensure TARGET_DIR is in PATH
if [[ ":$PATH:" != *":$TARGET_DIR:"* ]]; then
    if [ -f "$HOME/.bashrc" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    if [ -f "$HOME/.zshrc" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
    fi
    export PATH="$HOME/.local/bin:$PATH"
fi

echo -e "\n${GREEN}${BOLD}✓ ¡Wattpad CLI instalado correctamente en ${TARGET_FILE}!${RESET}"
echo -e "Ejecuta ${BOLD}${ORANGE}wattpad${RESET} para ingresar al AI Writing Studio.\n"
