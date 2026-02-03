# 📁 Cómo Cargar Archivos DICOM en M3DZ

## 🎯 2 Formas de Cargar Estudios

---

### **Opción 1: Drag & Drop Local (INMEDIATO)** ⚡

**No requiere conversión previa**. Arrastra archivos DICOM directamente al visor.

#### Pasos:

1. **Abre la página de carga local:**
   ```
   http://localhost:3000/local.html
   ```

2. **Arrastra archivos DICOM** o haz clic para seleccionar

3. **El visor se abre automáticamente** con tus estudios cargados

#### Ventajas:
- ✅ **Instantáneo** - No requiere procesamiento previo
- ✅ **Privado** - Los archivos se procesan localmente en tu navegador
- ✅ **Flexible** - Carga cualquier archivo DICOM sin preparación

#### Ideal para:
- Testing rápido
- Revisar estudios individuales
- Desarrollo y debugging

---

### **Opción 2: Servidor DICOMweb (PRODUCCIÓN)** 🚀

**Archivos pre-convertidos** servidos desde el servidor estático.

#### Pasos:

1. **Los archivos ya están siendo procesados** (build corriendo en background)

2. **Una vez complete el build** (~5-10 minutos):
   - Los estudios en `dicom-source/` se convertirán automáticamente
   - Aparecerán en la lista principal de `http://localhost:3000`

3. **Reinicia el servidor DICOMweb** para que detecte los nuevos archivos:
   ```bash
   # Matar servidor actual
   lsof -ti:5001 | xargs kill -9

   # Reiniciar
   node scripts/static-dicom-server.mjs 5001 platform/app/dist/dicomweb
   ```

#### Ventajas:
- ✅ **Rápido** - Archivos optimizados para carga instantánea
- ✅ **Escalable** - Múltiples usuarios pueden acceder
- ✅ **Persistente** - Los estudios quedan disponibles permanentemente

#### Ideal para:
- Producción
- Múltiples estudios permanentes
- Acceso desde múltiples dispositivos

---

## 📊 Estado Actual

### ✅ Completado:
- [x] Página de carga local creada (`/local.html`)
- [x] Build del proyecto iniciado

### ⏳ En Progreso:
- [ ] Build compilando archivos (5-10 minutos)
- [ ] Generando archivos DICOMweb optimizados

---

## 🎮 Usa Ahora Mismo

**Mientras el build termina**, ya puedes usar la opción 1:

1. Abre: **http://localhost:3000/local.html**
2. Arrastra archivos de: `dicom-source/SALAS DUARTE.../`
3. ¡Listo! El visor los cargará inmediatamente

---

## 🔍 Verificar Progreso del Build

```bash
# Ver últimas líneas del build
tail -f /Users/cesar/.cursor/projects/Users-cesar-Library-CloudStorage-Dropbox-Projects-M3DZ-DICOM-VIEWER-MD3Z/terminals/799921.txt
```

Cuando veas:
```
✨ Done in XXs.
```

El build habrá terminado y podrás usar la Opción 2.

---

## 📁 Estructura de Archivos

```
MD3Z/
├── dicom-source/                          # Archivos DICOM originales
│   └── SALAS DUARTE.../                   # 1015 archivos .dcm
│
├── platform/app/
│   ├── dist/dicomweb/                     # Archivos convertidos (Opción 2)
│   │   └── studies/
│   │       └── [StudyUID]/
│   │           ├── series/
│   │           └── metadata.json
│   │
│   └── public/
│       └── local.html                     # Página drag & drop (Opción 1)
│
└── scripts/
    └── static-dicom-server.mjs           # Servidor DICOMweb
```

---

## 🆘 Troubleshooting

### "Data Source Connection Error"
- **Causa**: Servidor DICOMweb no está corriendo o apunta al directorio incorrecto
- **Solución**: Reinicia el servidor apuntando a `dist/dicomweb`:
  ```bash
  node scripts/static-dicom-server.mjs 5001 platform/app/dist/dicomweb
  ```

### "No aparecen estudios en la lista"
- **Causa**: Build no ha terminado o archivos no se generaron
- **Solución**: Usa la Opción 1 (drag & drop) mientras tanto

### "Archivos DICOM no se cargan"
- **Causa**: Formato de archivo no compatible
- **Solución**: Verifica que sean archivos `.dcm` o `.DCM` válidos

---

## 💡 Tips Pro

### Acceso desde Móvil
```
http://TU_IP_LOCAL:3000/local.html
```

### Múltiples Estudios
Para la Opción 2, agrega más carpetas a `dicom-source/` y vuelve a hacer build.

### Performance
- Opción 1: Buena para < 500 imágenes
- Opción 2: Mejor para > 500 imágenes o múltiples estudios

---

**¿Preguntas?** El build debería terminar en ~5-10 minutos. Mientras tanto, ¡prueba la carga local! 🚀
