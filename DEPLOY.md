# 🚀 Guía de Despliegue en Render

Esta guía te ayudará a desplegar el sistema completo (Backend + Frontend) en Render.

## 📋 Requisitos Previos

- Cuenta en [Render.com](https://render.com)
- Repositorio Git (GitHub, GitLab o Bitbucket)
- Base de datos PostgreSQL (ya tienes Neon.tech configurada)

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Subir el código a GitHub/GitLab/Bitbucket

```bash
# Si aún no tienes el repositorio en Git
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git push -u origin main
```

### 1.2 Verificar estructura del proyecto

Asegúrate de que tu repositorio tenga esta estructura:
```
consultorios-medico-colom/
├── prisma/
├── src/
├── frontend/
├── package.json
├── .env.example
└── README.md
```

---

## 🗄️ Paso 2: Configurar Base de Datos (Neon.tech)

Ya tienes la base de datos en Neon.tech, solo necesitas:

1. Ir a tu dashboard de Neon.tech
2. Copiar la **Connection String** completa
3. Formato esperado: `postgresql://usuario:password@host/database?sslmode=require`

**⚠️ Importante:** Asegúrate de que la URL no tenga comillas ni el prefijo `psql`.

---

## 🔙 Paso 3: Desplegar el Backend (NestJS)

### 3.1 Crear nuevo servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio Git

### 3.2 Configurar el servicio

**Configuración básica:**
- **Name:** `consultorios-backend` (o el nombre que prefieras)
- **Environment:** `Node`
- **Region:** Elige la más cercana (ej: `Oregon (US West)`)
- **Branch:** `main` (o la rama que uses)

**Build & Deploy:**
- **Root Directory:** Dejar vacío (o `.` si Render lo requiere)
- **Build Command:** 
  ```bash
  npm install && npm run prisma:generate && npm run build
  ```
- **Start Command:**
  ```bash
  npm run start:prod
  ```

### 3.3 Variables de Entorno

Agrega las siguientes variables de entorno en Render:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Tu connection string de Neon.tech (sin comillas) |
| `JWT_SECRET` | `tu-clave-super-secreta-2024` | Genera una clave segura (usa `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | `24h` | Tiempo de expiración del token |
| `PORT` | `10000` | Render asigna el puerto automáticamente, pero puedes usar 10000 |
| `NODE_ENV` | `production` | Entorno de producción |
| `FRONTEND_URL` | `https://tu-frontend.onrender.com` | URL de tu frontend (la configurarás después) |

**⚠️ Importante sobre PORT:**
Render asigna el puerto automáticamente a través de la variable `PORT`. Asegúrate de que tu `main.ts` use `process.env.PORT`:

```typescript
const port = process.env.PORT || 3000;
```

### 3.4 Verificar main.ts

Abre `src/main.ts` y verifica que use la variable PORT:

```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

### 3.5 Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu backend
3. Espera a que termine (puede tardar 5-10 minutos)
4. Una vez desplegado, copia la URL: `https://tu-backend.onrender.com`

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

## 🎨 Paso 4: Desplegar el Frontend (React/Vite)

### 4.1 Crear nuevo servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Static Site"** (o "Web Service" si prefieres)
3. Conecta el mismo repositorio Git

### 4.2 Configurar el servicio

**Si usas "Static Site":**
- **Name:** `consultorios-frontend`
- **Root Directory:** `frontend`
- **Build Command:** 
  ```bash
  npm install && npm run build
  ```
- **Publish Directory:** `frontend/dist`

**Si usas "Web Service" (recomendado para mejor control):**
- **Name:** `consultorios-frontend`
- **Environment:** `Node`
- **Root Directory:** `frontend`
- **Build Command:**
  ```bash
  npm install && npm run build && npm install -g serve
  ```
- **Start Command:**
  ```bash
  serve -s dist -l 10000
  ```

### 4.3 Variables de Entorno del Frontend

Antes de configurar las variables, necesitas crear un archivo `.env.production` o configurar las variables en Render.

**Crear archivo `frontend/.env.production`:**
```env
VITE_API_URL=https://tu-backend.onrender.com
```

**O configurar en Render:**
- Variable: `VITE_API_URL`
- Valor: `https://tu-backend.onrender.com`

### 4.4 Actualizar configuración de API

Verifica que `frontend/src/config/api.js` use la variable de entorno:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // ...
});
```

### 4.5 Desplegar

1. Click en **"Create Static Site"** o **"Create Web Service"**
2. Espera a que termine el build
3. Copia la URL: `https://tu-frontend.onrender.com`

### 4.6 Actualizar CORS en Backend

Una vez que tengas la URL del frontend, actualiza la variable `FRONTEND_URL` en el backend:

1. Ve a tu servicio de backend en Render
2. **Environment** → Edita `FRONTEND_URL`
3. Cambia a: `https://tu-frontend.onrender.com`
4. Guarda y Render reiniciará el servicio

---

## ✅ Paso 5: Verificación Final

### 5.1 Verificar Backend

1. Abre: `https://tu-backend.onrender.com`
2. Deberías ver un mensaje o error 404 (normal si no hay ruta raíz)
3. Prueba: `https://tu-backend.onrender.com/auth/login` (debería responder)

### 5.2 Verificar Frontend

1. Abre: `https://tu-frontend.onrender.com`
2. Deberías ver la página de login
3. Intenta hacer login con un usuario de prueba

### 5.3 Verificar Conexión

1. Abre las **Developer Tools** (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Verifica que las peticiones vayan a `https://tu-backend.onrender.com`

---

## 🔒 Paso 6: Configuración de Seguridad

### 6.1 Generar JWT_SECRET seguro

```bash
# En tu terminal local
openssl rand -base64 32
```

Copia el resultado y úsalo como `JWT_SECRET` en Render.

### 6.2 Verificar HTTPS

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

### Error: "CORS policy"

**Solución:** Verifica que `FRONTEND_URL` en el backend sea correcta y use `https://`.

### Error: "Database connection failed"

**Solución:** 
1. Verifica que `DATABASE_URL` esté correcta (sin comillas)
2. Asegúrate de que Neon.tech permita conexiones desde cualquier IP
3. Verifica que la URL incluya `?sslmode=require`

### Frontend no carga

**Solución:**
1. Verifica que `VITE_API_URL` esté configurada
2. Revisa los logs de build en Render
3. Asegúrate de que el build se complete sin errores

---

## 📝 Checklist Final

- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado y funcionando
- [ ] Variables de entorno configuradas
- [ ] Migraciones de Prisma ejecutadas
- [ ] CORS configurado correctamente
- [ ] HTTPS funcionando
- [ ] Login funciona correctamente
- [ ] Base de datos conectada

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a tu repositorio:

1. Render detectará los cambios automáticamente
2. Ejecutará el build command
3. Desplegará la nueva versión
4. El proceso toma aproximadamente 5-10 minutos

**Para forzar un redeploy:**
1. Ve a tu servicio en Render
2. Click en **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los **Logs** en Render (muy útiles para debugging)
2. Verifica las variables de entorno
3. Revisa la documentación de Render: https://render.com/docs

---

## 🎉 ¡Listo!

Tu sistema debería estar funcionando en producción. Recuerda:
- Mantén tus secrets seguros
- Haz backups regulares de la base de datos
- Monitorea los logs regularmente

