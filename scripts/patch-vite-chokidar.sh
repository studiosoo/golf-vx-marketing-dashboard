#!/bin/bash
# Patch Vite's bundled chokidar AND tsx's bundled chokidar to suppress errno -117 errors
# from corrupted sandbox filesystem entries (.manus, .meta-ads-cache).
# These errors crash the dev server when chokidar tries to lstat corrupted inodes.
# This script is run automatically via the postinstall hook in package.json.
# NOTE: Uses only bash/sed/awk — no python3 dependency (must work in Docker build).

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

# Patch tsx bundle (uses variable name e) — pure sed, no python3 required
if [ -f "$TSX_BUNDLE" ]; then
  if ! grep -q "e\.errno!==-117" "$TSX_BUNDLE" && ! grep -q 'e\.errno !== -117' "$TSX_BUNDLE"; then
    OLD='_handleError(e){const u=e&&e.code;return e&&u!=="ENOENT"&&u!=="ENOTDIR"&&(!this.options.ignorePermissionErrors||u!=="EPERM"&&u!=="EACCES")&&this.emit(fu,e),e||this.closed}'
    NEW='_handleError(e){const u=e&&e.code;return e&&u!=="ENOENT"&&u!=="ENOTDIR"&&e.errno!==-117&&(!this.options.ignorePermissionErrors||u!=="EPERM"&&u!=="EACCES")&&this.emit(fu,e),e||this.closed}'
    # Use perl if available (handles long lines better than sed on some systems), fall back to sed
    if command -v perl >/dev/null 2>&1; then
      perl -i -pe "s/\Q$OLD\E/$NEW/" "$TSX_BUNDLE" 2>/dev/null && \
        echo "[patch-tsx] Applied errno -117 suppression patch to tsx chokidar _handleError (perl)" || \
        echo "[patch-tsx] perl replace failed, skipping"
    else
      # sed with escaped special chars — safe for the known pattern
      sed -i 's/u!=="ENOENT"&&u!=="ENOTDIR"&&(!this/u!=="ENOENT"\&\&u!=="ENOTDIR"\&\&e.errno!==-117\&\&(!this/g' "$TSX_BUNDLE" && \
        echo "[patch-tsx] Applied errno -117 suppression patch to tsx chokidar _handleError (sed)" || \
        echo "[patch-tsx] sed replace failed, skipping"
    fi
  else
    echo "[patch-tsx] tsx patch already applied, skipping"
  fi
else
  echo "[patch-tsx] tsx bundle not found at expected path, skipping"
fi
