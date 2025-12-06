#!/bin/bash
echo "🔧 Solución completa de permisos..."
cd "$(dirname "$0")"

echo ""
echo "1. Arreglando permisos de caché de npm..."
sudo chown -R $(whoami):$(id -gn) ~/.npm

echo ""
echo "2. Eliminando node_modules con sudo (necesario por permisos de root)..."
sudo rm -rf node_modules package-lock.json

echo ""
echo "3. Instalando dependencias SIN sudo (importante!)..."
npm install

echo ""
echo "✅ Listo! Ahora ejecuta: npm run dev"

