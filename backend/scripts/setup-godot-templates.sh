#!/bin/bash
# Sets up Godot 4 export templates for all platforms.
# Run this ONCE after Godot is installed.
# Usage: bash scripts/setup-godot-templates.sh

set -e

GODOT_BIN="/Applications/Godot.app/Contents/MacOS/Godot"

# Get Godot version
if [ ! -f "$GODOT_BIN" ]; then
  echo "ERROR: Godot not found at $GODOT_BIN"
  echo "Install it first: brew install --cask godot"
  exit 1
fi

GODOT_VERSION=$("$GODOT_BIN" --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ -z "$GODOT_VERSION" ]; then
  # Fallback: extract from brew info
  GODOT_VERSION=$(brew info godot 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
fi

echo "Detected Godot version: $GODOT_VERSION"

TEMPLATES_DIR="$HOME/Library/Application Support/Godot/export_templates/${GODOT_VERSION}.stable"
mkdir -p "$TEMPLATES_DIR"

# Check if templates already installed
if [ "$(ls -A "$TEMPLATES_DIR" 2>/dev/null)" ]; then
  echo "Export templates already installed at: $TEMPLATES_DIR"
  echo "Run: $GODOT_BIN --version to confirm."
  exit 0
fi

TEMPLATE_URL="https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-stable/Godot_v${GODOT_VERSION}-stable_export_templates.tpz"
DOWNLOAD_PATH="/tmp/godot_templates_${GODOT_VERSION}.tpz"

echo "Downloading export templates from GitHub..."
echo "URL: $TEMPLATE_URL"
curl -L --progress-bar -o "$DOWNLOAD_PATH" "$TEMPLATE_URL"

echo "Extracting templates..."
EXTRACT_TMP="/tmp/godot_templates_extract_$$"
mkdir -p "$EXTRACT_TMP"
unzip -q "$DOWNLOAD_PATH" -d "$EXTRACT_TMP"

echo "Installing to: $TEMPLATES_DIR"
cp -r "$EXTRACT_TMP/templates/"* "$TEMPLATES_DIR/"

# Cleanup
rm -rf "$EXTRACT_TMP" "$DOWNLOAD_PATH"

echo ""
echo "✅ Godot export templates installed successfully!"
echo "   Version: $GODOT_VERSION"
echo "   Location: $TEMPLATES_DIR"
echo ""
echo "You can now run game exports. Set in backend .env:"
echo "  GODOT_PATH=$GODOT_BIN"
