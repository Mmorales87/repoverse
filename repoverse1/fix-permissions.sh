#!/bin/bash
# Fix permissions for node_modules
echo "Arreglando permisos de node_modules..."
cd "$(dirname "$0")"
chmod -R u+w node_modules 2>/dev/null || true
echo "Permisos arreglados. Ahora ejecuta: npm run dev"

