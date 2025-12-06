#!/bin/bash
echo "🔄 Reinstalando dependencias sin sudo..."
cd "$(dirname "$0")"

echo "1. Eliminando node_modules y package-lock.json..."
rm -rf node_modules package-lock.json

echo "2. Instalando dependencias (sin sudo)..."
npm install

echo ""
echo "✅ Listo! Ahora ejecuta: npm run dev"

