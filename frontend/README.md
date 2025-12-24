# Frontend - Sistema de Historias Clínicas

Frontend desarrollado con React, Vite, Tailwind CSS y React Query.

## 🚀 Inicio Rápido

### Instalación

```bash
cd frontend
npm install
```

### Configuración

Crea un archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:3000
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:3001`

### Build para Producción

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Layout.jsx       # Layout principal con navbar
│   │   ├── PacienteForm.jsx # Formulario de pacientes
│   │   └── HistoriaClinicaForm.jsx # Formulario de historias
│   ├── contexts/            # Contextos de React
│   │   └── AuthContext.jsx  # Contexto de autenticación
│   ├── pages/               # Páginas principales
│   │   ├── Login.jsx        # Página de login
│   │   ├── Dashboard.jsx    # Dashboard principal
│   │   ├── SecretariaPanel.jsx # Panel de secretaria
│   │   ├── MedicoPanel.jsx  # Panel del médico
│   │   └── HistoriasClinicas.jsx # Consulta de historias
│   ├── services/            # Servicios API
│   │   └── api.js          # Funciones de API
│   ├── config/              # Configuración
│   │   └── api.js          # Configuración de Axios
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Punto de entrada
│   └── index.css            # Estilos globales
├── package.json
└── vite.config.js
```

## 🎨 Características

- ✅ Autenticación JWT
- ✅ Rutas protegidas por roles
- ✅ Panel de Secretaria (búsqueda y envío a sala de espera)
- ✅ Panel de Médico (lista en tiempo real, llamar paciente, crear historia)
- ✅ Actualización automática cada 5 segundos en sala de espera
- ✅ Diseño responsive con Tailwind CSS
- ✅ Notificaciones con react-hot-toast
- ✅ React Query para gestión de estado del servidor

## 🔐 Usuarios de Prueba

- **Secretaria**: `secretaria@consultorio.com` / `secretaria123`
- **Médico**: `medico@consultorio.com` / `medico123`
- **Admin**: `admin@consultorio.com` / `admin123`

## 📡 Endpoints Utilizados

- `POST /auth/login` - Login
- `GET /pacientes/search` - Buscar pacientes
- `POST /pacientes/espera` - Enviar a sala de espera
- `GET /atenciones/activas` - Lista de espera
- `PATCH /atenciones/:id/atender` - Llamar paciente
- `POST /historias-clinicas` - Crear historia clínica
- `GET /historias-clinicas/search` - Buscar historias

## 🛠️ Tecnologías

- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **React Router** - Routing
- **React Query** - Estado del servidor
- **Axios** - Cliente HTTP
- **react-hot-toast** - Notificaciones
- **lucide-react** - Iconos

## 🚀 Despliegue

### Vercel / Netlify

1. Conecta tu repositorio
2. Configura el build command: `npm run build`
3. Configura el output directory: `dist`
4. Agrega la variable de entorno: `VITE_API_URL=https://tu-backend.com`

### Render

1. Crea un servicio Static Site
2. Conecta tu repositorio
3. Build command: `npm run build`
4. Publish directory: `dist`

¡Listo! 🎉




