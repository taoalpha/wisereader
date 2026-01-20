#!/usr/bin/env bash
set -euo pipefail

REPO="taoalpha/wisereader"
INSTALL_DIR="${WISEREADER_INSTALL_DIR:-}"

if [[ -z "$INSTALL_DIR" ]]; then
  if [[ -w "/usr/local/bin" ]]; then
    INSTALL_DIR="/usr/local/bin"
  else
    INSTALL_DIR="$HOME/.local/bin"
  fi
fi

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) OS="darwin" ;;
  Linux) OS="linux" ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  arm64|aarch64) ARCH="arm64" ;;
  x86_64|amd64) ARCH="x64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

ASSET="wisereader-${OS}-${ARCH}.zip"
TAG="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | sed -n 's/.*"tag_name": "\([^"]*\)".*/\1/p')"

if [[ -z "$TAG" ]]; then
  echo "Failed to resolve latest release tag"
  exit 1
fi

URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET}"
TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="${TMP_DIR}/${ASSET}"

mkdir -p "$INSTALL_DIR"
curl -fL "$URL" -o "$ARCHIVE_PATH"

if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip is required to install"
  exit 1
fi

unzip -q "$ARCHIVE_PATH" -d "$TMP_DIR"

SOURCE_PATH="${TMP_DIR}/wisereader-${OS}-${ARCH}"
TARGET_PATH="${INSTALL_DIR}/wisereader"

if [[ ! -f "$SOURCE_PATH" ]]; then
  echo "Downloaded archive did not contain ${SOURCE_PATH}"
  exit 1
fi

mv "$SOURCE_PATH" "$TARGET_PATH"
chmod +x "$TARGET_PATH"

echo "Installed wisereader to ${TARGET_PATH}"
