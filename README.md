# M3DZ - DICOM Viewer

[![Deploy to GitHub Pages](https://github.com/The-Creative-Computing/MD3Z/actions/workflows/deploy.yml/badge.svg)](https://github.com/The-Creative-Computing/MD3Z/actions/workflows/deploy.yml)

Un visor DICOM moderno basado en OHIF Viewer con soporte para visualización 3D y MPR (Multiplanar Reconstruction).

🔗 **[Demo en vivo](https://the-creative-computing.github.io/MD3Z/)**

## 🎯 Características

- ✅ **Visualización DICOM** - Soporte completo para imágenes médicas DICOM
- ✅ **MPR (Multiplanar Reconstruction)** - Vistas Axial, Sagittal y Coronal sincronizadas
- ✅ **Herramientas de medición** - Distancia, área, ángulos, y más
- ✅ **Carga de archivos** - Drag & drop de archivos DICOM locales
- ✅ **Archivos embebidos** - Estudios de demostración incluidos
- ✅ **DICOMweb** - Compatible con servidores DICOMweb estándar

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
yarn install

# Iniciar servidor de desarrollo
yarn dev

# Iniciar servidor DICOMweb estático (en otra terminal)
node scripts/static-dicom-server.mjs 5001
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Agregar tus propios archivos DICOM

1. **Coloca tus archivos DICOM** en `dicom-source/`
2. **Convierte a formato DICOMweb**:
   ```bash
   ./scripts/convert-dicom.sh
   ```
3. **Reinicia el servidor** para ver los cambios

Ver [POC-README.md](./POC-README.md) para instrucciones detalladas.

## 📦 Despliegue

### Cloudflare Pages (Recomendado) 🚀

Este proyecto se despliega automáticamente a Cloudflare Pages cuando haces push a la rama `master`.

**Configuración:**
1. Sigue la [guía detallada de despliegue](./CLOUDFLARE-DEPLOYMENT.md)
2. Configura los secrets en GitHub:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Haz push y el sitio se desplegará automáticamente

**Tu sitio estará disponible en:**
```
https://m3dz-viewer.pages.dev
```

### Build Local

```bash
# Build de producción
yarn build:web

# Los archivos están en: platform/app/dist/
```

Compatible con Vercel, Netlify, y otros proveedores de hosting estático.

## 🛠️ Tecnologías

- [OHIF Viewer](https://ohif.org/) - Framework de visualización DICOM
- [Cornerstone3D](https://www.cornerstonejs.org/) - Renderizado GPU-acelerado
- [React](https://reactjs.org/) - Framework de UI
- [Vite](https://vitejs.dev/) - Build tool
- [DICOMweb](https://www.dicomstandard.org/using/dicomweb) - Protocolo web para DICOM

## 📝 Configuración

La configuración personalizada se encuentra en:
- `platform/app/public/config/poc-dicom.js` - Configuración de la aplicación
- `extensions/default/src/customizations/aboutModalCustomization.tsx` - Personalización del modal "Acerca de"

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue o pull request.

## 📄 Licencia

Este proyecto está basado en [OHIF Viewers](https://github.com/OHIF/Viewers) y mantiene su licencia MIT.

---

**Made with love from 🇻🇪**
