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
export const getMedicos = (especialidad) => {
  const params = especialidad ? { especialidad } : {}
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

export const adminChangePassword = (userId, data) => 
  api.patch(`/usuarios/${userId}/change-password`, data)

export const deleteUsuario = (id) => 
  api.delete(`/usuarios/${id}`)

