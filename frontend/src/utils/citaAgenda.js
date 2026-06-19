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

export function puedeEnviarEsperaAhora(fechaHora) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diaTurno = new Date(fechaHora)
  diaTurno.setHours(0, 0, 0, 0)
  return diaTurno <= hoy
}
