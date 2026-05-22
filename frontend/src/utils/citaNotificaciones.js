export function isGmail(email) {
  if (!email?.trim()) return false
  return /@(gmail\.com|googlemail\.com)$/i.test(email.trim())
}

export function getTipoNotificacion(email) {
  if (!email?.trim()) {
    return {
      tipo: 'ninguna',
      mensaje: 'Sin email: no se enviarán notificaciones automáticas',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
    }
  }
  if (isGmail(email)) {
    return {
      tipo: 'gmail',
      mensaje: 'Email con botones para Google Calendar + archivo .ics adjunto',
      color: 'text-blue-800 bg-blue-50 border-blue-200',
    }
  }
  return {
    tipo: 'email',
    mensaje: 'Email con botones de calendario y archivo .ics adjunto',
    color: 'text-amber-800 bg-amber-50 border-amber-200',
  }
}

export const ESTADO_CITA_LABELS = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
  CHECKIN: 'En sala de espera',
  COMPLETADA: 'Completada',
}

export const ESTADO_CITA_COLORS = {
  PROGRAMADA: 'bg-gray-100 text-gray-800',
  CONFIRMADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  NO_ASISTIO: 'bg-orange-100 text-orange-800',
  CHECKIN: 'bg-blue-100 text-blue-800',
  COMPLETADA: 'bg-purple-100 text-purple-800',
}
