export const TZ_ARGENTINA = 'America/Argentina/Buenos_Aires'

export function formatHora24(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleTimeString('es-AR', {
    timeZone: TZ_ARGENTINA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatFechaHora24(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleString('es-AR', {
    timeZone: TZ_ARGENTINA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function fechaKeyArgentina(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('sv-SE', { timeZone: TZ_ARGENTINA })
}
