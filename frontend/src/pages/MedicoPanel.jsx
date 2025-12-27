import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Phone, FileText, User, Calendar, Edit, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAtencionesActivas, atenderPaciente, getAtencionesAtendiendo, getHistoriasMedicoHoy, cancelarAtencion } from '../services/api'

// Componente para mostrar el tiempo de espera
function TiempoEspera({ horaIngreso }) {
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState('')

  useEffect(() => {
    if (!horaIngreso) {
      setTiempoTranscurrido('')
      return
    }

    const calcularTiempo = () => {
      const ahora = new Date()
      const ingreso = new Date(horaIngreso)
      const diferencia = ahora - ingreso

      if (diferencia < 0) {
        setTiempoTranscurrido('0:00:00')
        return
      }

      const horas = Math.floor(diferencia / (1000 * 60 * 60))
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60))
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000)

      setTiempoTranscurrido(`${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`)
    }

    // Calcular inmediatamente
    calcularTiempo()

    // Actualizar cada segundo
    const interval = setInterval(calcularTiempo, 1000)

    return () => clearInterval(interval)
  }, [horaIngreso])

  if (!tiempoTranscurrido) return null

  return (
    <p className="text-xs font-semibold text-primary-600 flex items-center mt-1">
      <Clock className="w-3 h-3 mr-1" />
      Tiempo de espera: {tiempoTranscurrido}
    </p>
  )
}
import HistoriaClinicaForm from '../components/HistoriaClinicaForm'
import EditarHistoriaClinicaForm from '../components/EditarHistoriaClinicaForm'
import VerHistoriaClinica from '../components/VerHistoriaClinica'

export default function MedicoPanel() {
  const [selectedAtencion, setSelectedAtencion] = useState(null)
  const [showHistoriaForm, setShowHistoriaForm] = useState(false)
  const [selectedHistoria, setSelectedHistoria] = useState(null)
  const [showEditarHistoria, setShowEditarHistoria] = useState(false)
  const [showVerHistoria, setShowVerHistoria] = useState(false)
  const queryClient = useQueryClient()

  // Refrescar cada 5 segundos para tiempo real
  const { data: atencionesEspera, isLoading: loadingEspera } = useQuery({
    queryKey: ['atenciones', 'activas'],
    queryFn: () => getAtencionesActivas(),
    refetchInterval: 5000, // Actualizar cada 5 segundos
  })

  const { data: atencionesAtendiendo } = useQuery({
    queryKey: ['atenciones', 'atendiendo'],
    queryFn: () => getAtencionesAtendiendo(),
    refetchInterval: 5000,
  })

  // Obtener historias clínicas del día
  const { data: historiasHoy, isLoading: loadingHistorias } = useQuery({
    queryKey: ['historias', 'medico', 'hoy'],
    queryFn: () => getHistoriasMedicoHoy(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
  })

  const atenderMutation = useMutation({
    mutationFn: atenderPaciente,
    onSuccess: (data) => {
      toast.success('Paciente llamado')
      queryClient.invalidateQueries(['atenciones'])
      setSelectedAtencion(data.data)
      // Abrir directamente el formulario de historia clínica
      setShowHistoriaForm(true)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al llamar paciente')
    },
  })

  const cancelarMutation = useMutation({
    mutationFn: cancelarAtencion,
    onSuccess: () => {
      toast.success('Paciente removido de la sala de espera')
      queryClient.invalidateQueries(['atenciones'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cancelar atención')
    },
  })

  const handleLlamarPaciente = (atencionId) => {
    atenderMutation.mutate(atencionId)
  }

  const handleCancelarAtencion = (atencionId, pacienteNombre) => {
    if (window.confirm(`¿Estás seguro de que deseas sacar a ${pacienteNombre} de la sala de espera?`)) {
      cancelarMutation.mutate(atencionId)
    }
  }

  const handleHistoriaSuccess = () => {
    setShowHistoriaForm(false)
    setSelectedAtencion(null)
    queryClient.invalidateQueries(['atenciones'])
    queryClient.invalidateQueries(['historias'])
    toast.success('Historia clínica guardada. Paciente finalizado.')
  }

  const handleEditarHistoriaSuccess = () => {
    setShowEditarHistoria(false)
    setSelectedHistoria(null)
    queryClient.invalidateQueries(['historias'])
    toast.success('Historia clínica actualizada exitosamente')
  }

  const puedeEditarHistoria = (historia) => {
    if (!historia) return false
    const ahora = new Date()
    const fechaCreacion = new Date(historia.createdAt)
    const horasTranscurridas = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60)
    return horasTranscurridas <= 24
  }

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel del Médico</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Gestiona pacientes en sala de espera y crea historias clínicas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna 1: Pacientes en Espera */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Sala de Espera
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Actualización automática
            </div>
          </div>

          {loadingEspera ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          ) : atencionesEspera?.data?.length > 0 ? (
            <div className="space-y-3">
              {atencionesEspera.data.map((atencion) => {
                const tienePrioridad = atencion.prioridad === true
                return (
                  <div
                    key={atencion.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      tienePrioridad
                        ? 'border-red-400 bg-red-50 shadow-md ring-2 ring-red-200 hover:border-red-500'
                        : 'hover:border-primary-300'
                    }`}
                    style={!tienePrioridad ? {
                      backgroundColor: 'var(--theme-waiting-bg, #ffffff)',
                      borderColor: 'var(--theme-waiting-border, #e5e7eb)'
                    } : {}}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <User className={`w-5 h-5 mr-2 ${tienePrioridad ? 'text-red-600' : 'text-gray-400'}`} />
                          <p className={`font-medium ${tienePrioridad ? 'text-red-900' : 'text-gray-900'}`}>
                            {atencion.paciente?.nombre} {atencion.paciente?.apellido}
                          </p>
                          {tienePrioridad && (
                            <div className="ml-2 flex items-center">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="ml-1 text-xs font-bold text-red-700">PRIORIDAD/OPERADO</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-sm space-y-1 ${tienePrioridad ? 'text-red-700' : 'text-gray-600'}`}>
                          <p>DNI: {atencion.paciente?.dni}</p>
                          <p>Obra Social: {atencion.paciente?.obraSocial}</p>
                          <p className="text-xs text-gray-500">
                            Ingreso: {new Date(atencion.horaIngreso).toLocaleTimeString()}
                          </p>
                          <TiempoEspera horaIngreso={atencion.horaIngreso} />
                          {atencion.pagoAsociado?.observaciones && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <p className="font-semibold text-blue-900 mb-1">Observación de Pago:</p>
                              <p className="text-blue-800">{atencion.pagoAsociado.observaciones}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleLlamarPaciente(atencion.id)}
                        disabled={atenderMutation.isPending}
                        className="btn btn-primary text-sm whitespace-nowrap"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {atenderMutation.isPending ? 'Llamando...' : 'Llamar'}
                      </button>
                      <button
                        onClick={() => handleCancelarAtencion(atencion.id, `${atencion.paciente?.nombre} ${atencion.paciente?.apellido}`)}
                        disabled={cancelarMutation.isPending}
                        className="btn btn-secondary text-sm whitespace-nowrap"
                        title="Sacar de sala de espera"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {cancelarMutation.isPending ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay pacientes en espera</p>
            </div>
          )}
        </div>

        {/* Columna 2: Pacientes Siendo Atendidos */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            En Atención
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Pacientes en atención que aún no tienen historia clínica guardada
          </p>

          {atencionesAtendiendo?.data?.length > 0 ? (
            <div className="space-y-3">
              {atencionesAtendiendo.data
                .filter((atencion) => !atencion.tieneHistoriaClinica)
                .map((atencion) => (
                <div
                  key={atencion.id}
                  className="p-4 border border-green-200 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-green-600 mr-2" />
                    <p className="font-medium text-gray-900">
                      {atencion.paciente?.nombre} {atencion.paciente?.apellido}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>DNI: {atencion.paciente?.dni}</p>
                    <p className="text-xs text-gray-500">
                      Inicio: {new Date(atencion.horaAtencion).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      ⏳ Pendiente de guardar historia clínica
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAtencion(atencion)
                      setShowHistoriaForm(true)
                    }}
                    className="mt-3 btn btn-primary text-sm w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {atencion.historiaId ? 'Editar Historia Clínica' : 'Crear Historia Clínica'}
                  </button>
                </div>
              ))}
              {atencionesAtendiendo.data.filter((atencion) => !atencion.tieneHistoriaClinica).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay pacientes pendientes de guardar</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay pacientes siendo atendidos</p>
            </div>
          )}
        </div>

        {/* Columna 3: Pacientes Atendidos del Día */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Atendidos Hoy
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString('es-AR')}
            </div>
          </div>

          {loadingHistorias ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          ) : historiasHoy?.data?.length > 0 ? (
            <div className="space-y-3">
              {historiasHoy.data.map((historia) => {
                const puedeEditar = puedeEditarHistoria(historia)
                const ahora = new Date()
                const fechaCreacion = new Date(historia.createdAt)
                const horasTranscurridas = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60)
                const horasRestantes = Math.max(0, 24 - horasTranscurridas)

                return (
                  <div
                    key={historia.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <p className="font-medium text-gray-900">
                        {historia.paciente?.nombre} {historia.paciente?.apellido}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p>DNI: {historia.paciente?.dni}</p>
                      <p className="text-xs text-gray-500">
                        Atendido: {new Date(historia.fechaConsulta).toLocaleTimeString()}
                      </p>
                      {puedeEditar && (
                        <p className="text-xs text-blue-600">
                          Editable por {Math.floor(horasRestantes)}h {Math.floor((horasRestantes % 1) * 60)}m más
                        </p>
                      )}
                      {!puedeEditar && (
                        <p className="text-xs text-gray-500">
                          Tiempo de edición expirado
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedHistoria(historia)
                          setShowVerHistoria(true)
                        }}
                        className="btn btn-secondary text-sm flex-1"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Ver
                      </button>
                      {puedeEditar && (
                        <button
                          onClick={() => {
                            setSelectedHistoria(historia)
                            setShowEditarHistoria(true)
                          }}
                          className="btn btn-primary text-sm flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay pacientes atendidos hoy</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulario de Historia Clínica */}
      {showHistoriaForm && selectedAtencion && (
        <HistoriaClinicaForm
          atencion={selectedAtencion}
          onClose={() => {
            setShowHistoriaForm(false)
            setSelectedAtencion(null)
          }}
          onSuccess={handleHistoriaSuccess}
        />
      )}

      {/* Formulario de Edición de Historia Clínica */}
      {showEditarHistoria && selectedHistoria && (
        <EditarHistoriaClinicaForm
          historia={selectedHistoria}
          onClose={() => {
            setShowEditarHistoria(false)
            setSelectedHistoria(null)
          }}
          onSuccess={handleEditarHistoriaSuccess}
          onCreateNew={(nuevaAtencion) => {
            // Cuando se crea una nueva atención, abrir el formulario de creación de historia
            setShowEditarHistoria(false)
            setSelectedHistoria(null)
            if (nuevaAtencion) {
              setSelectedAtencion(nuevaAtencion)
              setShowHistoriaForm(true)
            }
          }}
        />
      )}

      {/* Modal de Visualización de Historia Clínica */}
      {showVerHistoria && selectedHistoria && (
        <VerHistoriaClinica
          historia={selectedHistoria}
          onClose={() => {
            setShowVerHistoria(false)
            setSelectedHistoria(null)
          }}
        />
      )}
    </div>
  )
}


