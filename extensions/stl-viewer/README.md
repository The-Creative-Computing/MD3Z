# M3DZ STL Viewer Extension

Extensión para visualizar modelos 3D en formato STL dentro del visor OHIF.

## Características

- ✅ Visualización 3D de archivos STL usando vtk.js
- ✅ Los archivos STL aparecen como series en el Study Browser
- ✅ Soporte para drag & drop
- ✅ Procesamiento local (sin subir archivos a servidor)
- ✅ Compatible con implantes, guías quirúrgicas, modelos óseos, etc.

## Uso

### Opción 1: Página de carga dedicada

1. Navega a `http://localhost:3000/stl.html`
2. Arrastra archivos `.stl` o haz clic para seleccionarlos
3. Click en "Cargar Modelos 3D"
4. Los archivos aparecerán como series en el visor

### Opción 2: Programáticamente

```javascript
// Cargar un archivo STL desde URL
commandsManager.runCommand('loadSTLFile', {
  stlUrl: 'http://example.com/model.stl',
  fileName: 'Implante Dental.stl',
  studyInstanceUID: 'study-123',
  seriesInstanceUID: 'series-456'
});

// Cargar desde ArrayBuffer
commandsManager.runCommand('loadSTLFile', {
  stlData: arrayBuffer,
  fileName: 'Modelo.stl',
  studyInstanceUID: 'study-123',
  seriesInstanceUID: 'series-456'
});
```

## Estructura

```
extensions/stl-viewer/
├── src/
│   ├── index.tsx                    # Entry point de la extensión
│   ├── STLViewport.tsx              # Componente de viewport 3D
│   ├── getViewportModule.tsx        # Módulo de viewport
│   ├── getCommandsModule.ts         # Comandos para cargar STL
│   ├── getSopClassHandlerModule.ts  # Handler para modalidad STL
│   ├── getDataSourcesModule.ts      # Data source para archivos STL
│   └── hangingProtocol.ts           # Protocolo de visualización
└── package.json
```

## Casos de uso

### 🦷 Odontología
- Implantes dentales
- Prótesis
- Guías quirúrgicas
- Modelos de arcadas dentales

### 🏥 Medicina
- Planificación quirúrgica
- Modelos anatómicos personalizados
- Prótesis e implantes
- Guías de corte

### 🦴 Ortopedia
- Modelos óseos 3D
- Placas y tornillos
- Prótesis articulares

## Controles 3D

- **Rotar**: Click izquierdo + arrastrar
- **Zoom**: Scroll del mouse
- **Pan**: Click derecho + arrastrar (o Shift + click izquierdo)

## Limitaciones actuales

- No hay sincronización con imágenes DICOM (por diseño)
- Solo visualización, sin herramientas de medición
- Un modelo STL por serie

## Próximas mejoras

- [ ] Herramientas de medición 3D
- [ ] Cambiar color del modelo
- [ ] Ajustar transparencia
- [ ] Exportar capturas
- [ ] Soporte para múltiples modelos en una vista
- [ ] Sincronización opcional con vistas DICOM

## Desarrollo

La extensión usa:
- **vtk.js**: Renderizado 3D (ya incluido en OHIF)
- **React**: Componentes UI
- **OHIF Extension API**: Integración con el visor

## Licencia

MIT
