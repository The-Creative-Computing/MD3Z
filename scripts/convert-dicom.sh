#!/bin/bash

# Script para convertir archivos DICOM a formato DICOMweb estático
# 
# USO:
#   ./scripts/convert-dicom.sh
#
# PASOS:
#   1. Coloca tus archivos DICOM en la carpeta: dicom-source/
#   2. Ejecuta este script
#   3. Los archivos convertidos estarán en: platform/app/public/dicomweb/

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DICOM_SOURCE="$PROJECT_ROOT/dicom-source"
DICOM_OUTPUT="$PROJECT_ROOT/platform/app/public/dicomweb"
STATIC_WADO="$PROJECT_ROOT/tools/Static-DICOMWeb"

echo -e "${GREEN}=== Convertidor de DICOM a DICOMweb Estático ===${NC}"
echo ""

# Verificar que existe la carpeta source
if [ ! -d "$DICOM_SOURCE" ]; then
    echo -e "${YELLOW}Creando carpeta dicom-source/...${NC}"
    mkdir -p "$DICOM_SOURCE"
fi

# Verificar que hay archivos DICOM
DICOM_COUNT=$(find "$DICOM_SOURCE" -type f \( -name "*.dcm" -o -name "*.DCM" -o ! -name "*.*" \) 2>/dev/null | head -100 | wc -l | tr -d ' ')

if [ "$DICOM_COUNT" -eq 0 ]; then
    echo -e "${RED}ERROR: No se encontraron archivos DICOM en dicom-source/${NC}"
    echo ""
    echo "Por favor, coloca tus archivos DICOM en:"
    echo "  $DICOM_SOURCE"
    echo ""
    echo "Los archivos pueden ser:"
    echo "  - Archivos .dcm o .DCM"
    echo "  - Archivos sin extensión (formato DICOM estándar)"
    echo "  - Carpetas con estudios DICOM"
    exit 1
fi

echo -e "Encontrados ${GREEN}$DICOM_COUNT${NC} archivos DICOM"
echo ""

# Crear directorio de salida
echo -e "${YELLOW}Limpiando directorio de salida...${NC}"
rm -rf "$DICOM_OUTPUT"
mkdir -p "$DICOM_OUTPUT"

# Configurar Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"
nvm use 20 > /dev/null 2>&1 || true

# Convertir archivos
echo -e "${YELLOW}Convirtiendo archivos DICOM a formato DICOMweb...${NC}"
echo ""

cd "$STATIC_WADO"
node packages/static-wado-creator/bin/mkdicomweb.js "$DICOM_SOURCE" -o "$DICOM_OUTPUT"

echo ""
echo -e "${GREEN}=== Conversión completada ===${NC}"
echo ""
echo "Archivos generados en:"
echo "  $DICOM_OUTPUT"
echo ""
echo "Para ver los estudios disponibles, revisa:"
echo "  $DICOM_OUTPUT/studies/index.json"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Reinicia el servidor de desarrollo: yarn dev"
echo "  2. Los estudios estarán disponibles en la lista de estudios"
echo ""
