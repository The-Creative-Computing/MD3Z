# M3DZ STL Mode

Modo de visualización 3D para archivos STL en OHIF.

## Descripción

Este modo permite visualizar modelos 3D en formato STL (Stereolithography) dentro del visor OHIF, mostrándolos como series en un estudio.

## Características

- ✅ Visualización 3D interactiva con vtk.js
- ✅ Panel lateral con lista de series (modelos STL)
- ✅ Controles de viewport (Zoom, Pan, Window Level)
- ✅ Captura de imágenes
- ✅ Layouts múltiples

## Uso

### Cargar archivos STL

1. Navega a `http://localhost:3000/stl.html`
2. Selecciona o arrastra archivos `.stl`
3. Click en "Cargar Modelos 3D"
4. El visor se abrirá automáticamente en modo STL

### Controles

- **Rotar modelo**: Click izquierdo + arrastrar
- **Zoom**: Scroll del mouse
- **Pan**: Click derecho + arrastrar
- **Captura**: Botón en toolbar

## Extensiones requeridas

- `@ohif/extension-default` - UI básica
- `@ohif/extension-cornerstone` - Herramientas
- `@ohif/extension-stl-viewer` - Viewport y data source STL

## Estructura

```
modes/stl/
├── src/
│   ├── index.tsx           # Entry point
│   ├── id.ts               # ID del modo
│   ├── toolbarButtons.ts   # Botones de toolbar
│   └── initToolGroups.ts   # Inicialización de herramientas
├── package.json
└── README.md
```

## Licencia

MIT
