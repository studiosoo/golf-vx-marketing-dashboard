#!/bin/bash
# Patch Vite's bundled chokidar AND tsx's bundled chokidar to suppress errno -117 errors
# from corrupted sandbox filesystem entries (.manus, .meta-ads-cache).
# These errors crash the dev server when chokidar tries to lstat corrupted inodes.
# This script is run automatically via the postinstall hook in package.json.

VITE_BUNDLE="node_modules/.pnpm/vite@7.1.9_@types+node@24.7.0_jiti@2.6.1_lightningcss@1.30.1_tsx@4.20.6/node_modules/vite/dist/node/chunks/dep-Chhhsdoe.js"
TSX_BUNDLE="node_modules/.pnpm/tsx@4.20.6/node_modules/tsx/dist/cli.mjs"

# Patch Vite bundle (uses variable name error$1)
if [ -f "$VITE_BUNDLE" ]; then
  if ! grep -q "errno !== -117" "$VITE_BUNDLE"; then
    sed -i 's/code !== "ENOENT" && code !== "ENOTDIR"/code !== "ENOENT" \&\& code !== "ENOTDIR" \&\& error\$1.errno !== -117/' "$VITE_BUNDLE"
    echo "[patch-vite] Applied errno -117 suppression patch to Vite chokidar _handleError"
  else
    echo "[patch-vite] Vite patch already applied, skipping"
  fi
else
  echo "[patch-vite] Vite bundle not found at expected path, skipping"
fi

# Patch tsx bundle (uses variable name e)
if [ -f "$TSX_BUNDLE" ]; then
  if ! grep -q "e\.errno!==-117" "$TSX_BUNDLE" && ! grep -q 'e\.errno !== -117' "$TSX_BUNDLE"; then
    python3 -c "
import sys
with open('$TSX_BUNDLE') as f:
    content = f.read()

old = '_handleError(e){const u=e&&e.code;return e&&u!==\"ENOENT\"&&u!==\"ENOTDIR\"&&(!this.options.ignorePermissionErrors||u!==\"EPERM\"&&u!==\"EACCES\")&&this.emit(fu,e),e||this.closed}'
new_val = '_handleError(e){const u=e&&e.code;return e&&u!==\"ENOENT\"&&u!==\"ENOTDIR\"&&e.errno!==-117&&(!this.options.ignorePermissionErrors||u!==\"EPERM\"&&u!==\"EACCES\")&&this.emit(fu,e),e||this.closed}'

if old in content:
    with open('$TSX_BUNDLE', 'w') as f:
        f.write(content.replace(old, new_val, 1))
    print('[patch-tsx] Applied errno -117 suppression patch to tsx chokidar _handleError')
else:
    print('[patch-tsx] Pattern not found in tsx bundle - may already be patched or version changed')
"
  else
    echo "[patch-tsx] tsx patch already applied, skipping"
  fi
else
  echo "[patch-tsx] tsx bundle not found at expected path, skipping"
fi
