/** Horario de consultorio: Argentina (UTC-3, sin horario de verano). */
export const CONSULTORIO_TZ = 'America/Argentina/Buenos_Aires';
const OFFSET = '-03:00';

export function parseFechaConsultorio(fecha: string): Date {
  return new Date(`${fecha}T12:00:00${OFFSET}`);
}

/** Fecha calendario para columnas @db.Date (Prisma las lee como medianoche UTC). */
export function parseFechaDb(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  if (!y || !m || !d) {
    throw new Error(`Fecha inválida: ${fecha}`);
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Convierte un @db.Date de Prisma a YYYY-MM-DD (usa componentes UTC). */
export function formatFechaDb(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateTimeConsultorio(fecha: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':');
  const hora = `${h.padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
  return new Date(`${fecha}T${hora}:00${OFFSET}`);
}

export function formatFechaConsultorio(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: CONSULTORIO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatHoraConsultorio(d: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: CONSULTORIO_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** Fecha completa + hora 24h (emails y notificaciones al paciente). */
export function formatFechaHoraEmailConsultorio(d: Date): string {
  const fecha = new Intl.DateTimeFormat('es-AR', {
    timeZone: CONSULTORIO_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
  return `${fecha}, ${formatHoraConsultorio(d)}`;
}

export function inicioDelDiaConsultorio(fecha: string): Date {
  return new Date(`${fecha}T00:00:00${OFFSET}`);
}

export function finDelDiaConsultorio(fecha: string): Date {
  return new Date(`${fecha}T23:59:59.999${OFFSET}`);
}

export function diaSemanaConsultorio(fecha: string): number {
  return parseFechaConsultorio(fecha).getDay();
}
