# Sistema de Gestión de Historias Clínicas

Sistema de gestión de historias clínicas con flujo de Sala de Espera en tiempo real, desarrollado con NestJS, PostgreSQL y Prisma ORM.

## 🚀 Stack Tecnológico

- **Backend**: NestJS (Node.js)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens) con roles
- **Validación**: class-validator y class-transformer

## 📁 Estructura del Proyecto

```
sistema-historias-clinicas/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── auth/                  # Módulo de autenticación
│   │   ├── guards/            # Guards de autenticación y autorización
│   │   ├── strategies/        # Estrategia JWT
│   │   ├── decorators/        # Decoradores personalizados
│   │   └── dto/               # DTOs de autenticación
│   ├── usuarios/              # Módulo de usuarios
│   ├── pacientes/             # Módulo de pacientes
│   │   └── dto/               # DTOs de pacientes
│   ├── atenciones/            # Módulo de atenciones (Sala de Espera)
│   │   └── dto/               # DTOs de atenciones
│   ├── historias-clinicas/    # Módulo de historias clínicas
│   │   └── dto/               # DTOs de historias clínicas
│   ├── prisma/                # Servicio de Prisma
│   ├── app.module.ts          # Módulo principal
│   └── main.ts                # Punto de entrada
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Esquema de Base de Datos

### Modelos Principales

1. **Usuario**: Usuarios del sistema (Administrador, Secretaria, Médico)
2. **Medico**: Información de médicos vinculada a usuarios
3. **Paciente**: Datos de pacientes
4. **Atencion**: Registro de atención (vincula Paciente + Médico + Estado)
5. **HistoriaClinica**: Historia clínica de cada atención

### Estados de Atención

- `EN_ESPERA`: Paciente en sala de espera
- `ATENDIENDO`: Paciente siendo atendido por el médico
- `FINALIZADO`: Atención completada (historia clínica guardada)

## 🔐 Roles del Sistema

- **ADMINISTRADOR**: Acceso completo al sistema
- **SECRETARIA**: Gestión de pacientes y envío a sala de espera
- **MEDICO**: Visualización de pacientes en espera, atención y creación de historias clínicas

## 📡 Endpoints Principales

### Autenticación

```
POST /auth/login
Body: { email, password }
```

### Pacientes

```
GET  /pacientes/search?dni=12345678
GET  /pacientes/search?apellido=García
GET  /pacientes/:id
POST /pacientes
PATCH /pacientes/:id
POST /pacientes/espera          # ⭐ Enviar paciente a sala de espera
```

### Atenciones (Sala de Espera)

```
GET   /atenciones/activas       # ⭐ Lista de pacientes en espera
GET   /atenciones/atendiendo    # Pacientes siendo atendidos
GET   /atenciones/:id
PATCH /atenciones/:id/atender   # ⭐ Cambiar estado a ATENDIENDO
```

### Historias Clínicas

```
POST   /historias-clinicas
PATCH  /historias-clinicas/:id
GET    /historias-clinicas/search?pacienteId=1&medicoId=1&fechaDesde=2024-01-01
GET    /historias-clinicas/paciente/:pacienteId
GET    /historias-clinicas/:id
```

## 🎯 Flujo de Trabajo

### 1. Secretaria: Enviar Paciente a Sala de Espera

```http
POST /pacientes/espera
Authorization: Bearer {token}
Content-Type: application/json

{
  "dni": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez",
  "obraSocial": "OSDE",
  "medicoId": 1,
  "actualizarDatos": false
}
```

**Comportamiento:**
- Si el paciente no existe → Se crea y se envía a espera
- Si el paciente existe → Se puede actualizar (si `actualizarDatos: true`) y se envía a espera
- Se crea una `Atencion` con estado `EN_ESPERA`

### 2. Médico: Ver Pacientes en Espera

```http
GET /atenciones/activas
Authorization: Bearer {token}
```

**Respuesta:** Lista de pacientes ordenados por hora de ingreso (más antiguos primero)

### 3. Médico: Llamar Paciente

```http
PATCH /atenciones/:id/atender
Authorization: Bearer {token}
```

**Comportamiento:**
- Cambia el estado de `EN_ESPERA` a `ATENDIENDO`
- Registra `horaAtencion` automáticamente

### 4. Médico: Crear Historia Clínica

```http
POST /historias-clinicas
Authorization: Bearer {token}
Content-Type: application/json

{
  "atencionId": 1,
  "motivoConsulta": "Dolor de cabeza",
  "sintomas": "Cefalea intensa desde hace 2 días",
  "diagnostico": "Migraña",
  "tratamiento": "Ibuprofeno 600mg cada 8 horas",
  "presionArterial": "120/80",
  "temperatura": "36.5",
  "peso": 75.5,
  "altura": 1.75
}
```

**Comportamiento:**
- Solo funciona si la atención está en estado `ATENDIENDO`
- Al guardar, cambia el estado a `FINALIZADO`
- El paciente desaparece de la lista activa

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/historias_clinicas?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### 3. Generar cliente de Prisma

```bash
npm run prisma:generate
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate
```

### 5. Iniciar servidor

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📝 Ejemplo de Uso Completo

### Paso 1: Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "secretaria@consultorio.com",
    "password": "password123"
  }'
```

### Paso 2: Enviar Paciente a Espera (Secretaria)

```bash
curl -X POST http://localhost:3000/pacientes/espera \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "12345678",
    "nombre": "María",
    "apellido": "González",
    "obraSocial": "OSDE",
    "medicoId": 1
  }'
```

### Paso 3: Ver Pacientes en Espera (Médico)

```bash
curl -X GET http://localhost:3000/atenciones/activas \
  -H "Authorization: Bearer {token}"
```

### Paso 4: Llamar Paciente (Médico)

```bash
curl -X PATCH http://localhost:3000/atenciones/1/atender \
  -H "Authorization: Bearer {token}"
```

### Paso 5: Crear Historia Clínica (Médico)

```bash
curl -X POST http://localhost:3000/historias-clinicas \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "atencionId": 1,
    "motivoConsulta": "Control de rutina",
    "diagnostico": "Paciente sano",
    "tratamiento": "Continuar con hábitos saludables"
  }'
```

## 🔒 Protección de Rutas

Todas las rutas están protegidas con JWT excepto `/auth/login`. Los roles se validan mediante el decorador `@Roles()`:

```typescript
@Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
@Get('activas')
async findActivas() { ... }
```

## 📊 Características Principales

✅ Búsqueda dinámica de pacientes por DNI o Apellido  
✅ Registro rápido de pacientes con validación de DNI y Obra Social  
✅ Sistema de estados dinámico para Sala de Espera  
✅ Registro automático de horas de ingreso y atención  
✅ Control de acceso basado en roles  
✅ Validación completa de datos con class-validator  
✅ Historial completo de atenciones por paciente  

## 🚢 Despliegue

### Render (Backend)
1. Conectar repositorio Git
2. Configurar variables de entorno
3. Build command: `npm install && npm run build`
4. Start command: `npm run start:prod`

### Neon.tech (PostgreSQL)
1. Crear base de datos en Neon
2. Copiar `DATABASE_URL` a variables de entorno
3. Ejecutar migraciones: `npm run prisma:migrate`

## 📄 Licencia

MIT




