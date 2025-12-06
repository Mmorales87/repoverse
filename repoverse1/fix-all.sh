#!/bin/bash
echo "🔧 Arreglando permisos de node_modules..."
cd "$(dirname "$0")"

# Arreglar permisos recursivamente
chmod -R u+w node_modules 2>/dev/null || true

# Eliminar caché de Vite
rm -rf node_modules/.vite

# Intentar crear directorio de prueba
mkdir -p node_modules/.vite/test 2>/dev/null && rm -rf node_modules/.vite/test && echo "✅ Permisos OK" || echo "❌ Aún hay problemas de permisos"

echo ""
echo "Si aún hay problemas, ejecuta:"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install"
echo ""
echo "Luego: npm run dev"

