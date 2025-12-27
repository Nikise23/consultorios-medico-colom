import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, FileText, Stethoscope, Clock, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { getHistoriasByPaciente } from '../services/api'

export default function VerHistoriaClinica({ historia, onClose }) {
  // Estado para controlar qué especialidades están expandidas
  const [especialidadesExpandidas, setEspecialidadesExpandidas] = useState({})
  // Obtener el pacienteId de la historia (puede estar en historia.pacienteId o historia.paciente?.id)
  const pacienteId = historia?.pacienteId || historia?.paciente?.id || historia?.atencion?.pacienteId
  
  console.log('VerHistoriaClinica - historia completa:', historia)
  console.log('VerHistoriaClinica - pacienteId encontrado:', pacienteId)
  console.log('VerHistoriaClinica - historia.pacienteId:', historia?.pacienteId)
  console.log('VerHistoriaClinica - historia.paciente?.id:', historia?.paciente?.id)
  console.log('VerHistoriaClinica - historia.atencion?.pacienteId:', historia?.atencion?.pacienteId)
  
  // Obtener historial del paciente (excluyendo la historia actual)
  const { data: historiasPaciente, isLoading, error } = useQuery({
    queryKey: ['historias', 'paciente', pacienteId, historia?.id],
    queryFn: async () => {
      if (!pacienteId) {
        console.error('No se pudo obtener el pacienteId de la historia')
        return { data: [] }
      }
      console.log('Buscando historias para pacienteId:', pacienteId)
      try {
        const result = await getHistoriasByPaciente(pacienteId)
        console.log('Resultado de getHistoriasByPaciente:', result)
        return result
      } catch (err) {
        console.error('Error al obtener historias:', err)
        throw err
      }
    },
    enabled: !!pacienteId,
  })

  // Agrupar historias por especialidad (excluyendo la historia actual)
  const historiasPorEspecialidad = useMemo(() => {
    // La respuesta de axios tiene estructura: {data: {data: [...]}}
    // Necesitamos acceder a historiasPaciente.data.data
    const historiasData = historiasPaciente?.data?.data || historiasPaciente?.data
    
    if (!historiasData) {
      return {}
    }
    
    // Verificar si es un array directamente o si está dentro de otro objeto
    const historiasArray = Array.isArray(historiasData) ? historiasData : (historiasData.data || [])
    
    if (!Array.isArray(historiasArray) || historiasArray.length === 0) {
      return {}
    }
    
    // Filtrar la historia actual del historial
    const historiasAnteriores = historiasArray.filter(
      h => h.id !== historia?.id
    )
    
    return historiasAnteriores.reduce((acc, historiaItem) => {
      const especialidad = historiaItem.medico?.especialidad || 'Sin Especialidad'
      if (!acc[especialidad]) {
        acc[especialidad] = []
      }
      acc[especialidad].push(historiaItem)
      return acc
    }, {})
  }, [historiasPaciente?.data, historia?.id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Historia Clínica</h2>
            <p className="text-sm text-gray-500 mt-1">
              {historia?.paciente?.nombre} {historia?.paciente?.apellido} - DNI: {historia?.paciente?.dni}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Historia Clínica Actual */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                Historia Clínica Actual
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(historia?.fechaConsulta).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                {historia?.medico?.especialidad && (
                  <div className="flex items-center">
                    <Stethoscope className="w-4 h-4 mr-1" />
                    {historia.medico.especialidad}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="text-gray-700 whitespace-pre-wrap">
                {historia?.observaciones || 'Sin contenido registrado'}
              </div>
            </div>
            {historia?.medico && (
              <div className="mt-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Médico:</span> {historia.medico.usuario?.nombre} {historia.medico.usuario?.apellido}
                </p>
              </div>
            )}
          </div>

          {/* Historial de Historias Clínicas del Paciente */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 border border-red-200 rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p>Error al cargar el historial</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          ) : Object.keys(historiasPorEspecialidad).length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                Historial de Historias Clínicas
              </h3>
              <div className="space-y-4">
                {Object.entries(historiasPorEspecialidad).map(([especialidad, historiasEspecialidad]) => {
                  const isExpanded = especialidadesExpandidas[especialidad] ?? true // Por defecto expandido
                  return (
                    <div key={especialidad} className="mb-4">
                      <button
                        onClick={() => {
                          setEspecialidadesExpandidas(prev => ({
                            ...prev,
                            [especialidad]: !isExpanded
                          }))
                        }}
                        className="flex items-center gap-2 mb-2 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <Stethoscope className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-gray-900 text-sm">{especialidad}</span>
                        <span className="text-xs text-gray-500">
                          ({historiasEspecialidad.length} {historiasEspecialidad.length === 1 ? 'consulta' : 'consultas'})
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="space-y-2 ml-6">
                      {historiasEspecialidad.map((historiaItem) => (
                        <div
                          key={historiaItem.id}
                          className="p-3 border border-gray-200 rounded-lg bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(historiaItem.fechaConsulta).toLocaleDateString('es-AR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {historiaItem.medico?.usuario && (
                                <span className="text-xs text-gray-600 font-medium">
                                  • Dr. {historiaItem.medico.usuario.nombre} {historiaItem.medico.usuario.apellido}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap text-sm">
                            {historiaItem.observaciones || 'Sin contenido'}
                          </p>
                        </div>
                      ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay historial de historias clínicas anteriores</p>
            </div>
          )}

          {/* Botón de cerrar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={onClose} className="btn btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

