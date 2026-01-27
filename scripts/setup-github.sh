#!/bin/bash

# Script para configurar GitHub y desplegar M3DZ

set -e

echo "🚀 M3DZ - GitHub Setup Script"
echo "================================"
echo ""

# Verificar autenticación de GitHub
echo "📝 Verificando autenticación de GitHub..."
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ No estás autenticado en GitHub."
    echo "Por favor ejecuta: gh auth login"
    exit 1
fi

echo "✅ Autenticado en GitHub"
echo ""

# Preguntar el nombre del repositorio
read -p "Nombre del repositorio (default: M3DZ): " REPO_NAME
REPO_NAME=${REPO_NAME:-M3DZ}

read -p "¿Repositorio público o privado? (public/private, default: public): " REPO_VISIBILITY
REPO_VISIBILITY=${REPO_VISIBILITY:-public}

echo ""
echo "📦 Creando repositorio: $REPO_NAME ($REPO_VISIBILITY)"

# Crear el repositorio en GitHub
gh repo create "$REPO_NAME" \
    --$REPO_VISIBILITY \
    --description "Visor DICOM moderno con soporte MPR - Basado en OHIF Viewer" \
    --source=. \
    --remote=m3dz

echo "✅ Repositorio creado"
echo ""

# Cambiar el nombre de la rama a main si es master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "master" ]; then
    echo "🔄 Renombrando rama master a main..."
    git branch -M main
fi

# Agregar cambios
echo "📝 Agregando archivos..."
git add .

# Hacer commit
echo "💾 Creando commit..."
git commit -m "$(cat <<'EOF'
Initial commit: M3DZ DICOM Viewer

- Configuración personalizada de OHIF
- Branding M3DZ
- Soporte para archivos DICOM embebidos
- Modal About personalizado
- Archivos DICOM de demostración incluidos
- GitHub Actions para despliegue automático

Made with love from 🇻🇪
EOF
)"

echo "✅ Commit creado"
echo ""

# Push al repositorio
echo "⬆️  Subiendo a GitHub..."
git push -u m3dz main

echo "✅ Código subido a GitHub"
echo ""

# Obtener la URL del repositorio
REPO_URL=$(gh repo view --json url -q .url)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡Listo! Repositorio configurado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Repositorio: $REPO_URL"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Ve a: $REPO_URL/settings/pages"
echo "   2. Configura GitHub Pages:"
echo "      - Source: GitHub Actions"
echo "   3. El sitio se desplegará automáticamente"
echo ""
echo "🌐 Tu sitio estará disponible en:"
echo "   https://$(gh api user -q .login).github.io/$REPO_NAME/"
echo ""
echo "Made with love from 🇻🇪"
