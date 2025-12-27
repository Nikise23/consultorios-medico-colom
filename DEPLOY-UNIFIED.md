# 🚀 Guía de Despliegue Unificado en Render

Esta guía te ayudará a desplegar el sistema completo (Backend + Frontend) en **un solo servicio web** en Render.

## 📋 Requisitos Previos

- Cuenta en [Render.com](https://render.com)
- Repositorio Git (GitHub, GitLab o Bitbucket)
- Base de datos PostgreSQL (ya tienes Neon.tech configurada)

---

## 🔧 Paso 1: Preparar y Actualizar el Repositorio

### 1.1 Verificar el estado del repositorio

Primero, verifica qué archivos han cambiado:

```bash
git status
```

### 1.2 Agregar todos los cambios

Agrega todos los archivos modificados y nuevos al staging:

```bash
# Agregar todos los archivos modificados
git add .

# O si prefieres agregar archivos específicos:
git add frontend/src/
git add src/
git add prisma/schema.prisma
git add package.json
git add render.yaml
git add DEPLOY-UNIFIED.md
```

### 1.3 Hacer commit de los cambios

```bash
git commit -m "feat: agregar sistema de temas personalizados, mejoras en pagos y despliegue unificado"
```

O si prefieres un mensaje más descriptivo:

```bash
git commit -m "feat: sistema completo con temas personalizados por usuario

- Agregado sistema de temas (12 predefinidos + personalizados)
- Mejoras en visualización de tipos de pago (Obra Social, Efectivo, Transferencia)
- Configuración para despliegue unificado en Render
- Prioridad en pacientes de sala de espera
- Observaciones de pago en tarjetas de pacientes
- Filtrado por día en reportes de pagos
- Nombre de médico en historias clínicas"
```

### 1.4 Subir cambios al repositorio remoto

```bash
# Si es la primera vez
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git push -u origin main

# Si ya tienes el repositorio configurado
git push origin main
```

### 1.5 Verificar que los cambios estén en el repositorio

Ve a tu repositorio en GitHub/GitLab/Bitbucket y verifica que:
- ✅ Todos los archivos modificados estén presentes
- ✅ El archivo `render.yaml` esté incluido
- ✅ El archivo `DEPLOY-UNIFIED.md` esté incluido
- ✅ El archivo `frontend/src/contexts/ThemeContext.jsx` esté incluido

---

## 🗄️ Paso 2: Configurar Base de Datos (Neon.tech)

Ya tienes la base de datos en Neon.tech, solo necesitas:

1. Ir a tu dashboard de Neon.tech
2. Copiar la **Connection String** completa
3. Formato esperado: `postgresql://usuario:password@host/database?sslmode=require`

**⚠️ Importante:** Asegúrate de que la URL no tenga comillas ni el prefijo `psql`.

---

## 🌐 Paso 3: Desplegar Backend + Frontend en un Solo Servicio

### 3.1 Crear nuevo servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio Git

### 3.2 Configurar el servicio

**Configuración básica:**
- **Name:** `consultorios-medico-colom` (o el nombre que prefieras)
- **Environment:** `Node`
- **Region:** Elige la más cercana (ej: `Oregon (US West)`)
- **Branch:** `main` (o la rama que uses)

**Build & Deploy:**
- **Root Directory:** Dejar vacío (o `.` si Render lo requiere)
- **Build Command:** 
  ```bash
  npm install && npm run build
  ```
  
  Este comando automáticamente:
  1. Instala dependencias del backend (incluyendo devDependencies para `nest`)
  2. Genera el cliente de Prisma
  3. Construye el backend (NestJS)
  4. Instala dependencias del frontend
  5. Construye el frontend (React/Vite)
  
  **⚠️ Importante:** Asegúrate de que `NODE_ENV` NO esté configurado como `production` durante el build, o las devDependencies no se instalarán. Render instala todas las dependencias por defecto, así que debería funcionar.
  
- **Start Command:**
  ```bash
  npm run start:prod
  ```

### 3.3 Variables de Entorno

Agrega las siguientes variables de entorno en Render. **Copia y pega directamente estos valores:**

**📋 Copiar y pegar directamente en Render:**

```
DATABASE_URL
postgresql://neondb_owner:npg_C1uq4oVDlpYM@ep-rough-dawn-ahyh6miw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET
tu-clave-super-secreta-2024

JWT_EXPIRES_IN
24h

PORT
10000

NODE_ENV
production
```

**📝 Instrucciones:**
1. En Render, ve a la sección **"Environment"** de tu servicio
2. Para cada variable, haz click en **"Add Environment Variable"**
3. Copia el **nombre** de la variable (ej: `DATABASE_URL`)
4. Copia el **valor** correspondiente (sin comillas)
5. Guarda

**⚠️ Nota:** Ya NO necesitas `FRONTEND_URL` porque todo está en el mismo dominio.

### 3.4 Verificar configuración

El sistema está configurado para:
- ✅ Servir el frontend desde `/` (raíz)
- ✅ Servir la API desde las rutas normales (`/auth`, `/pacientes`, etc.)
- ✅ Manejar React Router correctamente (SPA)

### 3.5 Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. Espera a que termine (puede tardar 5-10 minutos)
4. Una vez desplegado, tendrás una sola URL: `https://tu-app.onrender.com`

### 3.6 Ejecutar migraciones de Prisma

Después del primer despliegue, necesitas ejecutar las migraciones:

**Opción 1: Desde tu máquina local**
```bash
# Configurar DATABASE_URL en tu .env local
DATABASE_URL="tu-connection-string-de-neon"

# Ejecutar migraciones
npm run prisma:migrate dev
# O si prefieres push (sin historial de migraciones)
npm run prisma:push
```

**Opción 2: Desde Render (Shell)**
1. Ve a tu servicio en Render
2. Click en **"Shell"** (en el menú lateral)
3. Ejecuta:
```bash
npx prisma migrate deploy
# O
npx prisma db push
```

---

## ✅ Paso 4: Verificación Final

### 4.1 Verificar que todo funciona

1. Abre: `https://tu-app.onrender.com`
2. Deberías ver la página de login del frontend
3. Intenta hacer login con un usuario de prueba
4. Verifica que las peticiones funcionen correctamente

### 4.2 Verificar rutas

- **Frontend:** `https://tu-app.onrender.com/` → Página de login
- **API Health:** `https://tu-app.onrender.com/health` → Debería responder `{"status":"ok"}`
- **API Root:** `https://tu-app.onrender.com/` → Información de la API

---

## 🔒 Paso 5: Configuración de Seguridad

### 5.1 Generar JWT_SECRET seguro

```bash
# En tu terminal local
openssl rand -base64 32
```

Copia el resultado y úsalo como `JWT_SECRET` en Render.

### 5.2 Verificar HTTPS

Render proporciona HTTPS automáticamente. Asegúrate de que:
- Todas las URLs usen `https://`
- No haya referencias a `http://` en el código

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module '@prisma/client'"

**Solución:** Asegúrate de que el build command incluya `npm run prisma:generate`:
```bash
npm install && npm run prisma:generate && npm run build
```

### Error: "Port already in use"

**Solución:** Render asigna el puerto automáticamente. Asegúrate de usar `process.env.PORT`:
```typescript
const port = process.env.PORT || 3000;
```

### Error: "Cannot GET /ruta"

**Solución:** Esto es normal para rutas de React Router. El servidor está configurado para servir `index.html` para todas las rutas no-API.

### Error: "Database connection failed"

**Solución:** 
1. Verifica que `DATABASE_URL` esté correcta (sin comillas)
2. Asegúrate de que Neon.tech permita conexiones desde cualquier IP
3. Verifica que la URL incluya `?sslmode=require`

### Frontend no carga o muestra error 404

**Solución:**
1. Verifica que el build del frontend se complete correctamente
2. Revisa los logs de build en Render
3. Asegúrate de que `frontend/dist` se genere correctamente
4. Verifica que el path en `main.ts` sea correcto: `join(__dirname, '..', 'frontend', 'dist')`

---

## 📝 Checklist Final

- [ ] Backend y Frontend desplegados en un solo servicio
- [ ] Variables de entorno configuradas
- [ ] Migraciones de Prisma ejecutadas
- [ ] Frontend carga correctamente en la raíz
- [ ] API funciona correctamente
- [ ] Login funciona correctamente
- [ ] Base de datos conectada
- [ ] HTTPS funcionando

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a tu repositorio:

1. Render detectará los cambios automáticamente
2. Ejecutará el build command (que construye backend + frontend)
3. Desplegará la nueva versión
4. El proceso toma aproximadamente 5-10 minutos

**Para forzar un redeploy:**
1. Ve a tu servicio en Render
2. Click en **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎯 Ventajas de este Enfoque

✅ **Un solo servicio:** Más simple de gestionar  
✅ **Un solo dominio:** No hay problemas de CORS  
✅ **Menor costo:** Solo pagas por un servicio  
✅ **Más rápido:** Menos latencia entre frontend y backend  
✅ **Más seguro:** Todo en el mismo dominio  

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los **Logs** en Render (muy útiles para debugging)
2. Verifica las variables de entorno
3. Revisa la documentación de Render: https://render.com/docs

---

## 🎉 ¡Listo!

Tu sistema debería estar funcionando en producción en un solo dominio. Recuerda:
- Mantén tus secrets seguros
- Haz backups regulares de la base de datos
- Monitorea los logs regularmente

