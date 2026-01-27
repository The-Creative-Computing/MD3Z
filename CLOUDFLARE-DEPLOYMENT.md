# 🚀 Guía de Despliegue en Cloudflare Pages

Esta guía te llevará paso a paso para configurar el despliegue automático de M3DZ en Cloudflare Pages usando GitHub Actions.

## 📋 Prerrequisitos

- ✅ Código subido a GitHub
- ✅ Cuenta de Cloudflare (gratuita)

---

## 🔧 Paso 1: Crear Proyecto en Cloudflare Pages

### 1.1 Accede a Cloudflare Dashboard

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Inicia sesión o crea una cuenta gratuita

### 1.2 Crear el Proyecto Pages

1. En el sidebar izquierdo, selecciona **"Workers & Pages"**
2. Click en **"Create application"**
3. Selecciona la pestaña **"Pages"**
4. Click en **"Create a project"**
5. Selecciona **"Direct Upload"** (no conectes GitHub todavía)
6. Nombre del proyecto: `m3dz-viewer` (o el nombre que prefieras)
7. Click en **"Create project"**

> ⚠️ **Importante**: Anota el nombre del proyecto, lo necesitarás más adelante.

---

## 🔑 Paso 2: Obtener Credenciales de Cloudflare

### 2.1 Obtener Account ID

1. En el dashboard de Cloudflare, ve a **"Workers & Pages"**
2. En el sidebar derecho, verás tu **"Account ID"**
3. Cópialo y guárdalo (algo como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 2.2 Crear API Token

1. Ve a [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click en **"Create Token"**
3. Busca **"Edit Cloudflare Workers"** y click en **"Use template"**
4. Configura el token:
   - **Token name**: `GitHub Actions - M3DZ`
   - **Permissions**: 
     - Account → Cloudflare Pages → Edit
   - **Account Resources**: 
     - Include → [Tu cuenta]
   - **Zone Resources**: 
     - Include → All zones
5. Click en **"Continue to summary"**
6. Click en **"Create Token"**
7. **¡IMPORTANTE!** Copia el token inmediatamente (solo se muestra una vez)
   - Se verá algo como: `abc123def456ghi789jkl012mno345pqr678stu901`

---

## 🔐 Paso 3: Configurar Secrets en GitHub

### 3.1 Agregar Secrets al Repositorio

1. Ve a tu repositorio en GitHub: `https://github.com/The-Creative-Computing/MD3Z`
2. Click en **"Settings"** (pestaña superior)
3. En el sidebar izquierdo, selecciona **"Secrets and variables"** → **"Actions"**
4. Click en **"New repository secret"**

### 3.2 Crear el Secret: CLOUDFLARE_API_TOKEN

1. **Name**: `CLOUDFLARE_API_TOKEN`
2. **Secret**: Pega el API token que copiaste en el paso 2.2
3. Click en **"Add secret"**

### 3.3 Crear el Secret: CLOUDFLARE_ACCOUNT_ID

1. Click nuevamente en **"New repository secret"**
2. **Name**: `CLOUDFLARE_ACCOUNT_ID`
3. **Secret**: Pega el Account ID que copiaste en el paso 2.1
4. Click en **"Add secret"**

### 3.4 Verificar Secrets

Deberías ver dos secrets:
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ACCOUNT_ID`

---

## 🎬 Paso 4: Ejecutar el Despliegue

### Opción A: Push para Activar Workflow (Recomendado)

```bash
# Commitea los cambios de configuración
git add .
git commit -m "Configure Cloudflare Pages deployment"
git push m3dz master
```

El workflow se ejecutará automáticamente.

### Opción B: Activar Manualmente

1. Ve a: `https://github.com/The-Creative-Computing/MD3Z/actions`
2. Click en el workflow **"Deploy to Cloudflare Pages"**
3. Click en **"Run workflow"** → **"Run workflow"**

---

## 📊 Paso 5: Monitorear el Despliegue

### 5.1 Ver el Progreso en GitHub

1. Ve a la pestaña **"Actions"** en tu repositorio
2. Click en el workflow que se está ejecutando
3. Verás el progreso en tiempo real:
   - ⏳ Build application (5-10 minutos)
   - ⏳ Deploy to Cloudflare Pages (1-2 minutos)

### 5.2 Ver el Despliegue en Cloudflare

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Selecciona **"Workers & Pages"**
3. Click en tu proyecto **"m3dz-viewer"**
4. Verás el historial de despliegues

---

## 🌐 Paso 6: Acceder a tu Sitio

Una vez completado el despliegue:

### Tu URL será:

```
https://m3dz-viewer.pages.dev
```

O si configuraste un dominio personalizado:
```
https://tu-dominio-personalizado.com
```

### Encontrar tu URL:

1. Ve a Cloudflare Dashboard → **"Workers & Pages"**
2. Click en tu proyecto
3. La URL aparecerá en la parte superior

---

## 🎨 Configuración Adicional (Opcional)

### Dominio Personalizado

1. En Cloudflare Dashboard, ve a tu proyecto Pages
2. Click en la pestaña **"Custom domains"**
3. Click en **"Set up a custom domain"**
4. Sigue las instrucciones para configurar tu dominio

### Variables de Entorno

Si necesitas configurar variables de entorno:

1. En Cloudflare Dashboard, ve a tu proyecto Pages
2. Click en **"Settings"** → **"Environment variables"**
3. Agrega las variables necesarias

---

## 🔄 Actualizaciones Automáticas

Cada vez que hagas push a la rama `master`, el sitio se actualizará automáticamente:

```bash
git add .
git commit -m "Update feature"
git push m3dz master
```

El workflow:
1. ✅ Instala dependencias
2. ✅ Compila el proyecto
3. ✅ Despliega a Cloudflare Pages
4. ✅ Tu sitio se actualiza en 5-10 minutos

---

## 🐛 Solución de Problemas

### Error: "API Token is invalid"

- ✅ Verifica que copiaste el token completo
- ✅ Crea un nuevo token siguiendo el Paso 2.2
- ✅ Actualiza el secret en GitHub

### Error: "Account ID is invalid"

- ✅ Verifica el Account ID en Cloudflare Dashboard
- ✅ Actualiza el secret en GitHub

### Build falla con "Out of memory"

- ✅ Cloudflare Pages tiene límites de memoria
- ✅ Verifica el tamaño de tus archivos DICOM
- ✅ Considera optimizar los archivos si son muy grandes

### El sitio no carga correctamente

- ✅ Verifica que el nombre del proyecto en el workflow coincida: `--project-name=m3dz-viewer`
- ✅ Verifica la configuración en `platform/app/public/config/poc-dicom.js`

---

## 📝 Resumen de Comandos Útiles

```bash
# Ver logs del último despliegue
gh run list --workflow="deploy.yml" --limit 1

# Re-ejecutar el último workflow
gh run rerun <run-id>

# Ver secrets configurados
gh secret list
```

---

## ✅ Checklist Final

- [ ] Proyecto creado en Cloudflare Pages
- [ ] API Token creado en Cloudflare
- [ ] Account ID copiado
- [ ] `CLOUDFLARE_API_TOKEN` agregado en GitHub Secrets
- [ ] `CLOUDFLARE_ACCOUNT_ID` agregado en GitHub Secrets
- [ ] Cambios pusheados a GitHub
- [ ] Workflow ejecutado exitosamente
- [ ] Sitio accesible en Cloudflare Pages

---

**¡Felicitaciones! 🎉 Tu visor DICOM M3DZ está desplegado en Cloudflare Pages.**

Made with love from 🇻🇪
