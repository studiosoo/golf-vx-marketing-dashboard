#!/bin/bash
# Patch Vite's bundled chokidar to suppress errno -117 errors from corrupted sandbox filesystem entries.
# These errors come from .manus/.meta-ads-cache directories that have corrupted inodes and cannot be removed.
# Without this patch, chokidar emits an 'error' event that crashes the Vite dev server.
# This script is run automatically via the postinstall hook in package.json.

VITE_BUNDLE="node_modules/.pnpm/vite@7.1.9_@types+node@24.7.0_jiti@2.6.1_lightningcss@1.30.1_tsx@4.20.6/node_modules/vite/dist/node/chunks/dep-Chhhsdoe.js"

if [ -f "$VITE_BUNDLE" ]; then
  if ! grep -q "errno !== -117" "$VITE_BUNDLE"; then
    sed -i 's/code !== "ENOENT" && code !== "ENOTDIR"/code !== "ENOENT" \&\& code !== "ENOTDIR" \&\& error\$1.errno !== -117/' "$VITE_BUNDLE"
    echo "[patch-vite] Applied errno -117 suppression patch to chokidar _handleError"
  else
    echo "[patch-vite] Patch already applied, skipping"
  fi
else
  echo "[patch-vite] Vite bundle not found at expected path, skipping patch"
fi
