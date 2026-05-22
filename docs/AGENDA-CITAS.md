# Agenda de citas

## Variables de entorno (email y calendario en el mail)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
CONSULTORIO_DIRECCION=Av. José Altube 2085, José C. Paz
```

Opcional (invitación Google Calendar API además de botones en el mail):

```
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
```

## Migración en producción

```bash
npx prisma migrate deploy
```

## Acceso

- Ruta: `/agenda` — solo rol **ADMINISTRADOR** (modo prueba).
- Check-in a sala de espera: botón en turno del día → vincula `citaId` con `POST /pacientes/espera`.

## API citas

`GET/POST/PATCH/DELETE /citas` — ver módulo `src/citas/`.

Turnos públicos (sitio web futuro): `src/public/` — `GET /public/medicos`, `POST /public/turnos/reservar`, etc.
