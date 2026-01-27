# POC DICOM Viewer - OHIF Based

Este es un Proof of Concept (PoC) de un visor DICOM basado en OHIF Viewer con soporte para:

- **Archivos DICOM embebidos** - Incluidos en el build para despliegue estático
- Carga de archivos DICOM locales (drag & drop)
- Carga de archivos DICOM remotos via URL
- Vista MPR (Multiplanar Reconstruction) - Axial, Sagittal, Coronal
- Herramientas de medición y anotación

## Requisitos

- Node.js v18+ (v20 para conversión de archivos DICOM)
- Yarn

## Instalación

```bash
# Instalar dependencias
yarn install
```

## Agregar tus archivos DICOM

### Paso 1: Coloca tus archivos DICOM

Copia tus archivos DICOM en la carpeta `dicom-source/`:

```
poc-ohif/
└── dicom-source/           <- Coloca tus archivos .dcm aquí
    ├── estudio1/
    │   ├── serie1/
    │   │   ├── imagen001.dcm
    │   │   ├── imagen002.dcm
    │   │   └── ...
    │   └── serie2/
    └── estudio2/
```

### Paso 2: Convierte a formato DICOMweb

```bash
./scripts/convert-dicom.sh
```

Este script:
1. Lee los archivos de `dicom-source/`
2. Los convierte a formato DICOMweb estático
3. Los guarda en `platform/app/public/dicomweb/`

### Paso 3: Verifica la conversión

```bash
cat platform/app/public/dicomweb/studies/index.json
```

Deberías ver un JSON con los StudyInstanceUIDs de tus estudios.

## Iniciar el servidor de desarrollo

```bash
# Usando la configuración del PoC
APP_CONFIG=config/poc-dicom.js yarn dev
```

El servidor estará disponible en: http://localhost:3000

## Despliegue Estático (Cloudflare Pages / GitHub Pages)

### Build para producción

```bash
# Generar build estático
APP_CONFIG=config/poc-dicom.js yarn build
```

Los archivos estáticos se generan en `platform/app/dist/`.

### Desplegar en Cloudflare Pages

1. Conecta tu repositorio a Cloudflare Pages
2. Configura el build:
   - Build command: `APP_CONFIG=config/poc-dicom.js yarn build`
   - Build output directory: `platform/app/dist`
   - Node version: `18`

### Desplegar en GitHub Pages

```bash
# Generar build
APP_CONFIG=config/poc-dicom.js yarn build

# El contenido de platform/app/dist/ va a la rama gh-pages
```

## Uso

### 1. Lista de Estudios

Al iniciar, verás la lista de estudios DICOM embebidos en la aplicación.
Puedes filtrar por nombre del paciente, modalidad, fecha, etc.

### 2. Visor básico

Haz clic en cualquier estudio para abrirlo en el visor. Podrás:

- Navegar entre slices con la rueda del mouse o el slider
- Hacer zoom con clic derecho + arrastrar
- Mover la imagen con clic central
- Ajustar Window/Level con clic izquierdo

### 3. Modo MPR (Reconstrucción Multiplanar)

Para series volumétricas (CT, MR), puedes activar el modo MPR de dos formas:

**Opción A: Via URL**
```
http://localhost:3000/viewer?StudyInstanceUIDs=YOUR_STUDY_UID&hangingProtocolId=mpr
```

**Opción B: Via la interfaz**
1. Abre un estudio con series volumétricas
2. Haz clic en el botón "Change layout" en la toolbar
3. Selecciona "MPR" en la sección "Advanced"

El modo MPR mostrará 3 viewports:
- **Axial** (vista superior/inferior)
- **Sagittal** (vista lateral)
- **Coronal** (vista frontal)

Activa los **Crosshairs** para navegar sincronizadamente entre las vistas.

### 4. Carga de archivos locales (drag & drop)

Para cargar archivos DICOM adicionales desde tu computadora:

```
http://localhost:3000/?datasources=dicomlocal
```

Luego arrastra y suelta archivos DICOM en la interfaz.

### 5. Usar servidor demo de OHIF (para pruebas)

```
http://localhost:3000/?datasources=ohif-demo
```

## Data Sources Configurados

| Nombre | Descripción | Uso |
|--------|-------------|-----|
| `embedded` | Archivos estáticos en /dicomweb/ | **Default** - Para despliegue estático |
| `ohif-demo` | Servidor demo de OHIF (AWS) | Para pruebas con estudios de ejemplo |
| `dicomlocal` | Carga archivos locales | Para drag & drop |
| `dicomjson` | Archivos JSON con metadata | Para URLs de archivos estáticos |
| `dicomwebproxy` | Proxy a servidores DICOMweb | Para conectar a cualquier servidor |

## Estructura del Proyecto

```
poc-ohif/
├── dicom-source/               # <- COLOCA TUS ARCHIVOS DICOM AQUÍ
├── scripts/
│   └── convert-dicom.sh        # Script de conversión
├── tools/
│   └── Static-DICOMWeb/        # Herramienta de conversión
├── platform/
│   ├── app/
│   │   ├── dist/               # Build de producción (generado)
│   │   └── public/
│   │       ├── config/
│   │       │   └── poc-dicom.js    # Configuración del PoC
│   │       └── dicomweb/           # Archivos DICOMweb (generados)
│   ├── core/
│   └── ui/
├── extensions/
└── modes/
```

## Flujo de trabajo

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  dicom-source/  │────>│ convert-dicom.sh │────>│ public/dicomweb │
│  (archivos .dcm)│     │                  │     │ (DICOMweb)      │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          v
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   yarn build    │────>│  platform/app/   │────>│ Deploy estático │
│                 │     │      dist/       │     │ (CF/GH Pages)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Notas importantes

1. **Archivos DICOM grandes**: Si tienes estudios muy grandes (>100MB), considera usar compresión gzip o limitar el número de slices.

2. **Múltiples estudios**: Puedes agregar tantos estudios como necesites en `dicom-source/`. El script procesará todos.

3. **Actualizar archivos**: Si agregas nuevos archivos DICOM, ejecuta `./scripts/convert-dicom.sh` nuevamente.

4. **Gitignore**: Los archivos `.dcm` originales en `dicom-source/` están en `.gitignore` por defecto. Los archivos convertidos en `public/dicomweb/` se incluyen en el repositorio.

## Próximos pasos (fases futuras)

1. **Integración con Supabase** - Para gestión de estudios y usuarios
2. **Autenticación** - Login/registro de usuarios
3. **Personalización de UI** - Branding y temas
4. **Exportación de mediciones** - PDF y DICOM SR

## Documentación adicional

- [OHIF Docs](https://docs.ohif.org/)
- [Static-DICOMWeb](https://github.com/RadicalImaging/Static-DICOMWeb)
- [Cornerstone3D](https://www.cornerstonejs.org/)
- [DICOMweb Standard](https://www.dicomstandard.org/using/dicomweb)
