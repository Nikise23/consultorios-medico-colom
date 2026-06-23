import api from '../config/api'

// Auth
export const login = (email, password) => 
  api.post('/auth/login', { email, password })

// Pacientes
export const searchPacientes = (params) => 
  api.get('/pacientes/search', { params })

export const getAllPacientes = () => 
  api.get('/pacientes/search')

export const getPaciente = (id) => 
  api.get(`/pacientes/${id}`)

export const createPaciente = (data) => 
  api.post('/pacientes', data)

export const updatePaciente = (id, data) => 
  api.patch(`/pacientes/${id}`, data)

export const deletePaciente = (id) => 
  api.delete(`/pacientes/${id}`)

export const enviarPacienteAEspera = (data) => 
  api.post('/pacientes/espera', data)

// Atenciones
export const getAtencionesActivas = (medicoId = null) => {
  const params = medicoId ? { medicoId } : {}
  return api.get('/atenciones/activas', { params })
}

export const getAtencionesAtendiendo = () => 
  api.get('/atenciones/atendiendo')

export const getAtencion = (id) => 
  api.get(`/atenciones/${id}`)

export const atenderPaciente = (id) => 
  api.patch(`/atenciones/${id}/atender`)

export const cancelarAtencion = (id) => 
  api.delete(`/atenciones/${id}`)

export const crearNuevaConsulta = (data) => 
  api.post('/atenciones/nueva-consulta', data)

export const getAtencionesActivasSecretaria = () => 
  api.get('/atenciones/activas-secretaria')

// Historias Clínicas
export const createHistoriaClinica = (data) => 
  api.post('/historias-clinicas', data)

export const updateHistoriaClinica = (id, data) => 
  api.patch(`/historias-clinicas/${id}`, data)

export const getHistoriaClinica = (id) => 
  api.get(`/historias-clinicas/${id}`)

export const searchHistoriasClinicas = (params) => 
  api.get('/historias-clinicas/search', { params })

export const getHistoriasByPaciente = (pacienteId) => 
  api.get(`/historias-clinicas/paciente/${pacienteId}`)

export const getHistoriasMedicoHoy = () => 
  api.get('/historias-clinicas/medico/hoy')

// Usuarios
export const getProfile = () => 
  api.get('/usuarios/profile')

// Médicos
export const getMedicos = (options) => {
  const params = {}
  if (typeof options === 'string') {
    params.especialidad = options
  } else if (options?.usaAgenda) {
    params.usaAgenda = 'true'
  } else if (options?.especialidad) {
    params.especialidad = options.especialidad
  }
  return api.get('/medicos', { params })
}

export const getMedico = (id) => 
  api.get(`/medicos/${id}`)

// Pagos
export const createPago = (data) => 
  api.post('/pagos', data)

export const getPagosByPaciente = (pacienteId) => 
  api.get(`/pagos/paciente/${pacienteId}`)

export const searchPagos = (params) => 
  api.get('/pagos/search', { params })

export const getPago = (id) => 
  api.get(`/pagos/${id}`)

export const updatePago = (id, data) => 
  api.patch(`/pagos/${id}`, data)

export const deletePago = (id) => 
  api.delete(`/pagos/${id}`)

// Reportes de Pagos
export const getReportePagosDia = () => 
  api.get('/pagos/reporte/dia')

export const getReportePagosMes = (anio, mes) => {
  const params = {}
  if (anio) params.anio = anio
  if (mes) params.mes = mes
  return api.get('/pagos/reporte/mes', { params })
}

export const getReportePagosAnio = (anio) => {
  const params = {}
  if (anio) params.anio = anio
  return api.get('/pagos/reporte/anio', { params })
}

export const getEstadisticasPagos = () => 
  api.get('/pagos/estadisticas')

// Usuarios
export const getUsuarios = () => 
  api.get('/usuarios')

export const createUsuario = (data) => 
  api.post('/usuarios', data)

export const updateUsuario = (id, data) => 
  api.put(`/usuarios/${id}`, data)

export const updateProfile = (data) => 
  api.patch('/usuarios/profile', data)

export const changePassword = (data) => 
  api.patch('/usuarios/change-password', data)

export const updateTheme = (themeData) => 
  api.patch('/usuarios/theme', themeData)

export const adminChangePassword = (userId, data) => 
  api.patch(`/usuarios/${userId}/change-password`, data)

export const deleteUsuario = (id) => 
  api.delete(`/usuarios/${id}`)

// Citas / Agenda
export const getCitas = (params) => 
  api.get('/citas', { params })

export const getCita = (id) => 
  api.get(`/citas/${id}`)

export const createCita = (data) => 
  api.post('/citas', data)

export const updateCita = (id, data) => 
  api.patch(`/citas/${id}`, data)

export const confirmarCita = (id) => 
  api.patch(`/citas/${id}/confirmar`)

export const cancelarCita = (id) => 
  api.delete(`/citas/${id}`)

export const eliminarCita = (id) =>
  api.delete(`/citas/${id}/permanente`)

export const marcarCitaNoAsistio = (id) => 
  api.patch(`/citas/${id}/no-asistio`)

export const getCitasHoy = (medicoId) => {
  const params = medicoId ? { medicoId } : {}
  return api.get('/citas/hoy', { params })
}

// Agenda — horarios y bloqueos por médico
export const getAgendaMedico = (medicoId) =>
  api.get(`/agenda/medicos/${medicoId}`)

export const getDisponibilidadAgenda = (medicoId, fecha, excluirCitaId) => {
  const params = { fecha }
  if (excluirCitaId) params.excluirCitaId = excluirCitaId
  return api.get(`/agenda/medicos/${medicoId}/disponibilidad`, { params })
}

export const setHorariosMedico = (medicoId, data) =>
  api.put(`/agenda/medicos/${medicoId}/horarios`, data)

export const agregarBloqueoAgenda = (medicoId, data) =>
  api.post(`/agenda/medicos/${medicoId}/bloqueos`, data)

export const eliminarBloqueoAgenda = (medicoId, bloqueoId) =>
  api.delete(`/agenda/medicos/${medicoId}/bloqueos/${bloqueoId}`)

