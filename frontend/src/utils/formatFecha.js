export const TZ_ARGENTINA = 'America/Argentina/Buenos_Aires'

export function formatHora24(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ_ARGENTINA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const hour = parts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') ?? '00'
  const minute = parts.find((p) => p.type === 'minute')?.value?.padStart(2, '0') ?? '00'
  return `${hour}:${minute}`
}

export function formatFechaHora24(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const fecha = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ_ARGENTINA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hourCycle: 'h23',
  }).format(d)
  return `${fecha}, ${formatHora24(d)}`
}

export function fechaKeyArgentina(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('sv-SE', { timeZone: TZ_ARGENTINA })
}
