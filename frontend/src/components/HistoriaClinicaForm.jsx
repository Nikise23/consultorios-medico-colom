import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Save, FileText, Stethoscope, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { createHistoriaClinica, getHistoriasByPaciente } from '../services/api'

export default function HistoriaClinicaForm({ atencion, onClose, onSuccess }) {
  // Estado para controlar qué especialidades están expandidas
  const [especialidadesExpandidas, setEspecialidadesExpandidas] = useState({})
  // Clave para localStorage basada en el ID de la atención
  const storageKey = `historia_clinica_draft_${atencion?.id}`

  // Cargar borrador guardado o inicializar vacío
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return {
      contenido: saved || '',
    }
  })

  // Obtener historial del paciente
  const { data: historiasPaciente } = useQuery({
    queryKey: ['historias', 'paciente', atencion?.pacienteId],
    queryFn: () => getHistoriasByPaciente(atencion?.pacienteId),
    enabled: !!atencion?.pacienteId,
  })

  // Agrupar historias por especialidad
  const historiasPorEspecialidad = useMemo(() => {
    // Manejar estructura anidada de axios: {data: {data: [...]}}
    const historiasData = historiasPaciente?.data?.data || historiasPaciente?.data
    const historiasArray = Array.isArray(historiasData) ? historiasData : []
    
    if (!historiasArray || historiasArray.length === 0) {
      return {}
    }
    
    return historiasArray.reduce((acc, historia) => {
      const especialidad = historia.medico?.especialidad || 'Sin Especialidad'
      if (!acc[especialidad]) {
        acc[especialidad] = []
      }
      acc[especialidad].push(historia)
      return acc
    }, {})
  }, [historiasPaciente?.data])

  // Autoguardado cada vez que cambia el contenido
  useEffect(() => {
    if (formData.contenido.trim() !== '') {
      localStorage.setItem(storageKey, formData.contenido)
    } else {
      localStorage.removeItem(storageKey)
    }
  }, [formData.contenido, storageKey])

  const createMutation = useMutation({
    mutationFn: createHistoriaClinica,
    onSuccess: () => {
      // Limpiar el borrador guardado después de guardar exitosamente
      localStorage.removeItem(storageKey)
      toast.success('Historia clínica creada exitosamente')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear historia clínica')
    },
  })

  // Función para calcular la edad (evitar problemas de zona horaria)
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    
    const hoy = new Date()
    
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    let anio, mes, dia
    if (typeof fechaNacimiento === 'string') {
      const fechaPart = fechaNacimiento.split('T')[0]
      const partes = fechaPart.split('-').map(Number)
      anio = partes[0]
      mes = partes[1] - 1 // Mes en JavaScript es 0-11
      dia = partes[2]
    } else {
      const fecha = new Date(fechaNacimiento)
      anio = fecha.getFullYear()
      mes = fecha.getMonth()
      dia = fecha.getDate()
    }
    
    // Crear fecha de nacimiento en hora local
    const nacimiento = new Date(anio, mes, dia)
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mesDiff = hoy.getMonth() - nacimiento.getMonth()
    
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    
    return edad
  }

  // Formatear fecha de nacimiento (evitar problemas de zona horaria)
  const formatearFechaNacimiento = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    
    // Si la fecha viene como string en formato ISO (YYYY-MM-DD), parsearla directamente
    // sin usar new Date() para evitar problemas de zona horaria
    if (typeof fechaNacimiento === 'string') {
      // Si viene como "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss.sssZ"
      const fechaPart = fechaNacimiento.split('T')[0] // Tomar solo la parte de la fecha
      const [anio, mes, dia] = fechaPart.split('-').map(Number)
      
      // Crear fecha en hora local (no UTC) para evitar el desfase
      const fecha = new Date(anio, mes - 1, dia)
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
    // Si ya es un objeto Date, formatearlo directamente
    const fecha = new Date(fechaNacimiento)
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.contenido || formData.contenido.trim() === '') {
      toast.error('Debes completar la historia clínica')
      return
    }

    createMutation.mutate({
      atencionId: atencion.id,
      motivoConsulta: '',
      sintomas: '',
      diagnostico: '',
      tratamiento: '',
      observaciones: formData.contenido,
      presionArterial: '',
      temperatura: '',
      peso: null,
      altura: null,
      proximoControl: null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Nueva Historia Clínica</h2>
            <p className="text-sm text-gray-500 mt-1">
              {atencion.paciente?.nombre} {atencion.paciente?.apellido} - DNI: {atencion.paciente?.dni}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos del Paciente */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Datos del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Nombre</p>
                <p className="text-sm font-semibold text-gray-900">
                  {atencion.paciente?.nombre} {atencion.paciente?.apellido}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Obra Social</p>
                <p className="text-sm font-semibold text-gray-900">
                  {atencion.paciente?.obraSocial || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Número de Afiliado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {atencion.paciente?.numeroAfiliado || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Fecha de Nacimiento</p>
                <p className="text-sm font-semibold text-gray-900">
                  {atencion.paciente?.fechaNacimiento 
                    ? formatearFechaNacimiento(atencion.paciente.fechaNacimiento)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Edad</p>
                <p className="text-sm font-semibold text-primary-700">
                  {atencion.paciente?.fechaNacimiento 
                    ? `${calcularEdad(atencion.paciente.fechaNacimiento)} ${calcularEdad(atencion.paciente.fechaNacimiento) === 1 ? 'año' : 'años'}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">DNI</p>
                <p className="text-sm font-semibold text-gray-900">
                  {atencion.paciente?.dni || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Historial de Historias Clínicas del Paciente */}
          {Object.keys(historiasPorEspecialidad).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                Historial de Historias Clínicas
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                {Object.entries(historiasPorEspecialidad).map(([especialidad, historiasEspecialidad]) => {
                  const isExpanded = especialidadesExpandidas[especialidad] ?? false // Por defecto colapsado
                  return (
                    <div key={especialidad} className="mb-4 last:mb-0">
                      <button
                        onClick={() => {
                          setEspecialidadesExpandidas(prev => ({
                            ...prev,
                            [especialidad]: !isExpanded
                          }))
                        }}
                        className="flex items-center gap-2 mb-2 w-full text-left hover:bg-gray-100 p-2 rounded transition-colors"
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
                      {historiasEspecialidad.map((historia) => (
                        <div
                          key={historia.id}
                          className="p-3 border border-gray-200 rounded-lg bg-white text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(historia.fechaConsulta).toLocaleDateString('es-AR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {historia.medico?.usuario && (
                                <span className="text-xs text-gray-600 font-medium">
                                  • Dr. {historia.medico.usuario.nombre} {historia.medico.usuario.apellido}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                            {historia.observaciones || 'Sin contenido'}
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
          )}

          {/* Campo único para la historia clínica */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Nueva Historia Clínica *
              </label>
              {formData.contenido.trim() !== '' && (
                <span className="text-xs text-green-600 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Autoguardado activo
                </span>
              )}
            </div>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              className="input"
              rows="15"
              placeholder="Complete aquí la historia clínica completa. Puede incluir motivo de consulta, síntomas, signos vitales, diagnóstico, tratamiento, observaciones, etc."
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Complete toda la información de la consulta en este campo. El contenido se guarda automáticamente mientras escribe.
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                // Guardar borrador antes de cerrar
                if (formData.contenido.trim() !== '') {
                  localStorage.setItem(storageKey, formData.contenido)
                  toast.success('Borrador guardado. Puede continuar más tarde.')
                }
                onClose()
              }}
              className="btn btn-secondary text-sm"
            >
              Guardar y Cerrar
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending ? 'Guardando...' : 'Guardar Historia Clínica'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
