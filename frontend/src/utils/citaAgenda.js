const ESTADOS_PREVISTOS = ['PROGRAMADA', 'CONFIRMADA', 'CHECKIN']

export function calcularResumenDia(citasDia) {
  const previstas = (citasDia || []).filter((c) =>
    ESTADOS_PREVISTOS.includes(c.estado),
  )

  const porObraSocial = {}
  previstas.forEach((c) => {
    const os = c.paciente?.obraSocial?.trim() || 'Sin obra social'
    porObraSocial[os] = (porObraSocial[os] || 0) + 1
  })

  const obrasOrdenadas = Object.entries(porObraSocial).sort((a, b) => b[1] - a[1])

  return {
    total: previstas.length,
    porObraSocial: obrasOrdenadas,
  }
}

/** Minutos antes del turno en que se habilita enviar a sala de espera */
export const MINUTOS_ANTES_CHECKIN = 15

export function puedeEnviarEsperaAhora(fechaHora) {
  const ahora = new Date()
  const turno = new Date(fechaHora)
  const ventanaInicio = new Date(
    turno.getTime() - MINUTOS_ANTES_CHECKIN * 60 * 1000,
  )
  return ahora >= ventanaInicio
}

export function horaDisponibleCheckin(fechaHora) {
  const turno = new Date(fechaHora)
  const ventanaInicio = new Date(
    turno.getTime() - MINUTOS_ANTES_CHECKIN * 60 * 1000,
  )
  return ventanaInicio.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
