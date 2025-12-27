import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Send, UserPlus, Users, Edit, Trash2, Clock, UserCheck, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchPacientes, enviarPacienteAEspera, getAllPacientes, deletePaciente, getAtencionesActivasSecretaria, cancelarAtencion } from '../services/api'
import PacienteForm from '../components/PacienteForm'
import EnviarAEsperaConPago from '../components/EnviarAEsperaConPago'

export default function SecretariaPanel() {
  const [searchType, setSearchType] = useState('dni')
  const [searchValue, setSearchValue] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [showAllPacientes, setShowAllPacientes] = useState(true)
  const [showEnviarConPago, setShowEnviarConPago] = useState(false)
  const queryClient = useQueryClient()

  // Búsqueda específica
  const { data: pacientes, isLoading } = useQuery({
    queryKey: ['pacientes', searchType, searchValue],
    queryFn: () => searchPacientes({ [searchType]: searchValue }),
    enabled: searchValue.length > 0 && !showAllPacientes,
  })

  // Lista de todos los pacientes (cuando no hay búsqueda)
  const { data: allPacientes, isLoading: loadingAll, error: errorAll } = useQuery({
    queryKey: ['pacientes', 'all'],
    queryFn: async () => {
      const result = await getAllPacientes()
      console.log('Resultado de getAllPacientes:', result)
      // La respuesta de axios tiene estructura: {data: {data: [...]}}
      // Necesitamos acceder a result.data.data o result.data
      return result
    },
    enabled: showAllPacientes && searchValue.length === 0,
  })

  // Obtener atenciones activas (sala de espera y en atención)
  const { data: atencionesActivas, isLoading: loadingAtenciones } = useQuery({
    queryKey: ['atenciones', 'activas-secretaria'],
    queryFn: () => getAtencionesActivasSecretaria(),
    refetchInterval: 5000, // Actualizar cada 5 segundos
  })

  // Cuando hay búsqueda, ocultar lista completa
  useEffect(() => {
    if (searchValue.length > 0) {
      setShowAllPacientes(false)
    } else {
      setShowAllPacientes(true)
    }
  }, [searchValue])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.length > 0) {
      // La búsqueda se ejecuta automáticamente con useQuery
    }
  }

  const handleEnviarAEspera = () => {
    if (!selectedPaciente) {
      toast.error('Debes seleccionar un paciente primero')
      return
    }
    setShowEnviarConPago(true)
  }

  const deleteMutation = useMutation({
    mutationFn: deletePaciente,
    onSuccess: () => {
      toast.success('Paciente eliminado exitosamente')
      queryClient.invalidateQueries(['pacientes'])
      setSelectedPaciente(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar paciente')
    },
  })

  const handleDelete = (paciente, e) => {
    e.stopPropagation()
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${paciente.nombre} ${paciente.apellido}?`)) {
      deleteMutation.mutate(paciente.id)
    }
  }

  const handleEdit = (paciente, e) => {
    e.stopPropagation()
    setSelectedPaciente(paciente)
    setShowForm(true)
  }

  // Mutación para cancelar atención (remover de sala de espera)
  const cancelarAtencionMutation = useMutation({
    mutationFn: cancelarAtencion,
    onSuccess: () => {
      toast.success('Paciente removido de la sala de espera')
      queryClient.invalidateQueries(['atenciones', 'activas-secretaria'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al remover paciente')
    },
  })

  const handleCancelarAtencion = (atencion, pacienteNombre, e) => {
    e.stopPropagation()
    const estadoTexto = atencion.estado === 'EN_ESPERA' ? 'sala de espera' : 'atención'
    if (window.confirm(`¿Estás seguro de que deseas remover a ${pacienteNombre} de la ${estadoTexto}?`)) {
      cancelarAtencionMutation.mutate(atencion.id)
    }
  }

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Secretaria</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Busca pacientes y envíalos a sala de espera
          </p>
        </div>
      </div>

      {/* Sección de Atenciones Activas */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary-600" />
            Estado de Atenciones
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Actualización automática
          </div>
        </div>

        {loadingAtenciones ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        ) : (() => {
          const atencionesData = atencionesActivas?.data?.data || atencionesActivas?.data
          const atencionesArray = Array.isArray(atencionesData) ? atencionesData : []
          
          if (atencionesArray.length === 0) {
            return (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No hay pacientes en sala de espera o en atención</p>
              </div>
            )
          }

          // Separar por estado
          const enEspera = atencionesArray.filter(a => a.estado === 'EN_ESPERA')
          const atendiendo = atencionesArray.filter(a => a.estado === 'ATENDIENDO')

          return (
            <div className="space-y-4">
              {/* Pacientes en Espera */}
              {enEspera.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                    En Sala de Espera ({enEspera.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {enEspera.map((atencion) => {
                      const tienePrioridad = atencion.prioridad === true
                      return (
                        <div
                          key={atencion.id}
                          className={`p-3 border rounded-lg ${
                            tienePrioridad
                              ? 'border-red-400 bg-red-50 shadow-md ring-2 ring-red-200'
                              : ''
                          }`}
                          style={!tienePrioridad ? {
                            backgroundColor: 'var(--theme-waiting-bg, #fefce8)',
                            borderColor: 'var(--theme-waiting-border, #fde047)'
                          } : {}}
                        >
                          <div className="flex items-start justify-between mb-2">
                            {tienePrioridad && (
                              <div className="flex items-center flex-1">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span className="ml-1 text-xs font-bold text-red-700 whitespace-nowrap">PRIORIDAD/OPERADO</span>
                              </div>
                            )}
                            {!tienePrioridad && <div></div>}
                            <button
                              onClick={(e) => handleCancelarAtencion(atencion, `${atencion.paciente?.nombre} ${atencion.paciente?.apellido}`, e)}
                              className="flex-shrink-0 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors ml-2"
                              title="Remover de sala de espera"
                              disabled={cancelarAtencionMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${tienePrioridad ? 'text-red-900' : 'text-gray-900'}`}>
                              {atencion.paciente?.nombre} {atencion.paciente?.apellido}
                            </p>
                            <p className={`text-sm ${tienePrioridad ? 'text-red-700' : 'text-gray-600'}`}>
                              DNI: {atencion.paciente?.dni}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Dr. {atencion.medico?.usuario?.nombre} {atencion.medico?.usuario?.apellido}
                            </p>
                            <p className="text-xs text-gray-500">
                              {atencion.medico?.especialidad}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Ingreso: {new Date(atencion.horaIngreso).toLocaleTimeString()}
                            </p>
                            {atencion.pagoAsociado?.observaciones && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <p className="font-semibold text-blue-900 mb-1">Observación de Pago:</p>
                                <p className="text-blue-800">{atencion.pagoAsociado.observaciones}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pacientes en Atención */}
              {atendiendo.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                    En Atención ({atendiendo.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {atendiendo.map((atencion) => (
                      <div
                        key={atencion.id}
                        className="p-3 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {atencion.paciente?.nombre} {atencion.paciente?.apellido}
                            </p>
                            <p className="text-sm text-gray-600">DNI: {atencion.paciente?.dni}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Dr. {atencion.medico?.usuario?.nombre} {atencion.medico?.usuario?.apellido}
                            </p>
                            <p className="text-xs text-gray-500">
                              {atencion.medico?.especialidad}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Inicio: {new Date(atencion.horaAtencion).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Búsqueda y Botón Nuevo */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Búsqueda de Pacientes</h2>
          <button
            onClick={() => {
              setSelectedPaciente(null)
              setShowForm(true)
            }}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Nuevo Paciente
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por
              </label>
              <select
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value)
                  setSearchValue('')
                  setSelectedPaciente(null)
                }}
                className="input"
              >
                <option value="dni">DNI</option>
                <option value="apellido">Apellido</option>
              </select>
            </div>
            <div className="flex-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === 'dni' ? 'DNI' : 'Apellido'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'dni' ? '12345678' : 'García'}
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de todos los pacientes (cuando no hay búsqueda) */}
      {showAllPacientes && searchValue.length === 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary-600" />
              Pacientes Registrados
            </h2>
            <button
              onClick={() => {
                setSelectedPaciente(null)
                setShowForm(true)
              }}
              className="btn btn-primary text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Paciente
            </button>
          </div>

          {loadingAll ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando pacientes...</p>
            </div>
          ) : errorAll ? (
            <div className="text-center py-8 text-red-500">
              <p>Error al cargar pacientes: {errorAll.message}</p>
              <button
                onClick={() => queryClient.invalidateQueries(['pacientes', 'all'])}
                className="mt-4 btn btn-secondary"
              >
                Reintentar
              </button>
            </div>
          ) : (() => {
            // Manejar estructura anidada de axios: {data: {data: [...]}}
            const pacientesData = allPacientes?.data?.data || allPacientes?.data
            const pacientesArray = Array.isArray(pacientesData) ? pacientesData : []
            
            console.log('allPacientes completo:', allPacientes)
            console.log('pacientesData:', pacientesData)
            console.log('pacientesArray:', pacientesArray)
            
            return pacientesArray.length > 0 ? (
              <>
                {/* Vista de tabla para pantallas grandes */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paciente</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DNI</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Obra Social</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Teléfono</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pacientesArray.map((paciente) => (
                        <tr
                          key={paciente.id}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedPaciente?.id === paciente.id
                              ? 'bg-primary-50 hover:bg-primary-100'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPaciente(paciente)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {paciente.nombre} {paciente.apellido}
                              </span>
                              {selectedPaciente?.id === paciente.id && (
                                <span className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded">Seleccionado</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.dni}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.obraSocial || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.telefono || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => handleEdit(paciente, e)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="Editar paciente"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(paciente, e)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar paciente"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPaciente(paciente)
                                  handleEnviarAEspera()
                                }}
                                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors flex items-center gap-1"
                                title="Cobrar y enviar a sala"
                              >
                                <Send className="w-4 h-4" />
                                <span className="hidden xl:inline">Cobrar y Enviar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista de tarjetas para pantallas pequeñas */}
                <div className="lg:hidden space-y-3">
                  {pacientesArray.map((paciente) => (
                    <div
                      key={paciente.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaciente?.id === paciente.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedPaciente(paciente)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            DNI: {paciente.dni} | Obra Social: {paciente.obraSocial}
                          </p>
                          {paciente.telefono && (
                            <p className="text-xs text-gray-400 mt-1">
                              Tel: {paciente.telefono}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4 items-center">
                          {selectedPaciente?.id === paciente.id && (
                            <span className="text-primary-600 font-medium text-sm">Seleccionado</span>
                          )}
                          <button
                            onClick={(e) => handleEdit(paciente, e)}
                            className="btn btn-secondary text-sm"
                            title="Editar paciente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(paciente, e)}
                            className="btn btn-danger text-sm"
                            title="Eliminar paciente"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPaciente(paciente)
                              handleEnviarAEspera()
                            }}
                            className="btn btn-primary text-sm whitespace-nowrap"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Cobrar y Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay pacientes registrados</p>
              <button
                onClick={() => {
                  setSelectedPaciente(null)
                  setShowForm(true)
                }}
                className="mt-4 btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primer Paciente
              </button>
            </div>
            )
          })()}
        </div>
      )}

      {/* Resultados de búsqueda */}
      {!showAllPacientes && isLoading && (
        <div className="card text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Buscando...</p>
        </div>
      )}

      {/* Resultados de búsqueda - Unificado */}
      {!showAllPacientes && pacientes && (() => {
        // Manejar estructura anidada de axios: {data: {data: [...]}}
        const pacientesData = pacientes?.data?.data || pacientes?.data
        const pacientesArray = Array.isArray(pacientesData) ? pacientesData : []
        const pacienteUnico = !Array.isArray(pacientesData) && pacientesData ? pacientesData : null
        
        return pacientesArray.length > 0 || pacienteUnico ? (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Resultados de Búsqueda</h2>
            {pacientesArray.length > 0 ? (
              <>
                {/* Vista de tabla para pantallas grandes */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paciente</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DNI</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Obra Social</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pacientesArray.map((paciente) => (
                        <tr
                          key={paciente.id}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedPaciente?.id === paciente.id
                              ? 'bg-primary-50 hover:bg-primary-100'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPaciente(paciente)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {paciente.nombre} {paciente.apellido}
                              </span>
                              {selectedPaciente?.id === paciente.id && (
                                <span className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded">Seleccionado</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.dni}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.obraSocial || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => handleEdit(paciente, e)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="Editar paciente"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(paciente, e)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar paciente"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPaciente(paciente)
                                  handleEnviarAEspera()
                                }}
                                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors flex items-center gap-1"
                                title="Cobrar y enviar a sala"
                              >
                                <Send className="w-4 h-4" />
                                <span className="hidden xl:inline">Cobrar y Enviar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista de tarjetas para pantallas pequeñas */}
                <div className="lg:hidden space-y-3">
                  {pacientesArray.map((paciente) => (
                    <div
                      key={paciente.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaciente?.id === paciente.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedPaciente(paciente)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            DNI: {paciente.dni} | Obra Social: {paciente.obraSocial}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4 items-center">
                          {selectedPaciente?.id === paciente.id && (
                            <span className="text-primary-600 font-medium text-sm">Seleccionado</span>
                          )}
                          <button
                            onClick={(e) => handleEdit(paciente, e)}
                            className="btn btn-secondary text-sm"
                            title="Editar paciente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(paciente, e)}
                            className="btn btn-danger text-sm"
                            title="Eliminar paciente"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPaciente(paciente)
                              handleEnviarAEspera()
                            }}
                            className="btn btn-primary text-sm whitespace-nowrap"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Cobrar y Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : pacienteUnico ? (
              // Paciente único encontrado (búsqueda por DNI)
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900">
                  {pacienteUnico.nombre} {pacienteUnico.apellido}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  DNI: {pacienteUnico.dni} | Obra Social: {pacienteUnico.obraSocial}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPaciente(pacienteUnico)
                      setShowForm(true)
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de que deseas eliminar a ${pacienteUnico.nombre} ${pacienteUnico.apellido}?`)) {
                        deleteMutation.mutate(pacienteUnico.id)
                      }
                    }}
                    className="btn btn-danger text-sm"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPaciente(pacienteUnico)
                      handleEnviarAEspera()
                    }}
                    className="btn btn-primary text-sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Cobrar y Enviar a Sala
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
            // No se encontraron resultados
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No se encontraron pacientes</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Nuevo Paciente
              </button>
            </div>
          )
        })()}
      )}

      {/* Formulario para nuevo paciente o actualizar */}
      {showForm && (
        <PacienteForm
          paciente={selectedPaciente}
          onClose={() => {
            setShowForm(false)
            setSelectedPaciente(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setSelectedPaciente(null)
            queryClient.invalidateQueries(['pacientes'])
          }}
        />
      )}

      {/* Modal de Pago y Envío a Sala de Espera */}
      {showEnviarConPago && selectedPaciente && (
        <EnviarAEsperaConPago
          paciente={selectedPaciente}
          onClose={() => {
            setShowEnviarConPago(false)
          }}
          onSuccess={() => {
            setShowEnviarConPago(false)
            setSelectedPaciente(null)
            setSearchValue('')
            queryClient.invalidateQueries(['atenciones'])
            queryClient.invalidateQueries(['pacientes'])
            queryClient.invalidateQueries(['pagos'])
          }}
        />
      )}
    </div>
  )
}

