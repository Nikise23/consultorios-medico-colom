import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Save, Clock, Plus, FileText, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateHistoriaClinica, crearNuevaConsulta, createHistoriaClinica, getHistoriasByPaciente } from '../services/api'
import EditorHistoriaClinica from './EditorHistoriaClinica'

export default function EditarHistoriaClinicaForm({ historia, onClose, onSuccess, onCreateNew }) {
  const [formData, setFormData] = useState({
    contenido: '',
  })
  const [puedeEditar, setPuedeEditar] = useState(true)
  const [horasRestantes, setHorasRestantes] = useState(null)
  const [especialidadesExpandidas, setEspecialidadesExpandidas] = useState({})

  // Obtener historial del paciente (excluyendo la historia actual)
  const { data: historiasPaciente } = useQuery({
    queryKey: ['historias', 'paciente', historia?.pacienteId],
    queryFn: () => getHistoriasByPaciente(historia?.pacienteId),
    enabled: !!historia?.pacienteId,
  })

  // Agrupar historias por especialidad, excluyendo la actual
  const historiasPorEspecialidad = useMemo(() => {
    const historiasData = historiasPaciente?.data?.data || historiasPaciente?.data
    const historiasArray = Array.isArray(historiasData) ? historiasData : []
    const historiasAnteriores = historiasArray.filter(h => h.id !== historia?.id)

    if (historiasAnteriores.length === 0) return {}

    return historiasAnteriores.reduce((acc, h) => {
      const especialidad = h.medico?.especialidad || 'Sin Especialidad'
      if (!acc[especialidad]) acc[especialidad] = []
      acc[especialidad].push(h)
      return acc
    }, {})
  }, [historiasPaciente?.data, historia?.id])

  useEffect(() => {
    if (historia) {
      // Cargar el contenido de la historia (puede estar en observaciones o en otros campos)
      const contenido = historia.observaciones || 
        [historia.motivoConsulta, historia.sintomas, historia.diagnostico, historia.tratamiento]
          .filter(Boolean)
          .join('\n\n')
      
      setFormData({ contenido })

      // Calcular si puede editar (menos de 24 horas)
      const ahora = new Date()
      const fechaCreacion = new Date(historia.createdAt)
      const horasTranscurridas = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60)
      const horasRestantesCalc = 24 - horasTranscurridas

      if (horasTranscurridas > 24) {
        setPuedeEditar(false)
      } else {
        setPuedeEditar(true)
        setHorasRestantes(Math.max(0, horasRestantesCalc))
      }
    }
  }, [historia])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateHistoriaClinica(id, data),
    onSuccess: () => {
      toast.success('Historia clínica actualizada exitosamente')
      onSuccess()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al actualizar historia clínica'
      toast.error(errorMessage)
    },
  })

  const isEmptyContent = (html) => {
    if (!html) return true
    const div = document.createElement('div')
    div.innerHTML = html
    return !div.textContent?.trim()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isEmptyContent(formData.contenido)) {
      toast.error('Debes completar la historia clínica')
      return
    }

    if (!puedeEditar) {
      toast.error('No se puede editar después de 24 horas. Debe crear una nueva historia clínica.')
      return
    }

    // Guardar todo en observaciones para mantener compatibilidad
    updateMutation.mutate({
      id: historia.id,
      data: {
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
      },
    })
  }

  const createNewMutation = useMutation({
    mutationFn: createHistoriaClinica,
    onSuccess: () => {
      toast.success('Nueva historia clínica creada exitosamente')
      onClose()
      if (onCreateNew) {
        onCreateNew()
      } else {
        onSuccess()
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear nueva historia clínica')
    },
  })

  const crearAtencionMutation = useMutation({
    mutationFn: crearNuevaConsulta,
    onSuccess: (data) => {
      // Cerrar este modal y abrir el formulario de creación
      onClose()
      if (onCreateNew) {
        onCreateNew(data.data)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear nueva consulta')
    },
  })

  const formatearFechaNacimiento = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    if (typeof fechaNacimiento === 'string') {
      const fechaPart = fechaNacimiento.split('T')[0]
      const [anio, mes, dia] = fechaPart.split('-').map(Number)
      return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    }
    return new Date(fechaNacimiento).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const formatearEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-'
    const hoy = new Date()
    let anio, mes, dia
    if (typeof fechaNacimiento === 'string') {
      const fechaPart = fechaNacimiento.split('T')[0]
      const partes = fechaPart.split('-').map(Number)
      anio = partes[0]; mes = partes[1] - 1; dia = partes[2]
    } else {
      const f = new Date(fechaNacimiento)
      anio = f.getFullYear(); mes = f.getMonth(); dia = f.getDate()
    }
    const nacimiento = new Date(anio, mes, dia)
    let totalMeses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth())
    if (hoy.getDate() < nacimiento.getDate()) totalMeses--
    const años = Math.floor(totalMeses / 12)
    const meses = totalMeses % 12
    if (años <= 2) {
      const textoAños = años === 0 ? '0 años' : años === 1 ? '1 año' : '2 años'
      const textoMeses = meses === 1 ? '1 mes' : `${meses} meses`
      return años === 0 && meses === 0 ? 'Recién nacido' : `${textoAños} y ${textoMeses}`
    }
    return `${años} ${años === 1 ? 'año' : 'años'}`
  }

  const handleCreateNew = () => {
    if (!historia.paciente || !historia.medico) {
      toast.error('No se puede crear una nueva historia clínica sin datos del paciente o médico')
      return
    }

    // Crear una nueva atención en estado ATENDIENDO para el mismo paciente y médico
    crearAtencionMutation.mutate({
      pacienteId: historia.pacienteId,
      medicoId: historia.medicoId,
      observaciones: 'Nueva consulta - Historia clínica anterior expirada',
    })
  }

  if (!puedeEditar) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Historia Clínica</h2>
              <p className="text-sm text-gray-500 mt-1">
                {historia.paciente?.nombre} {historia.paciente?.apellido} - DNI: {historia.paciente?.dni}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="font-medium text-yellow-800">
                  Tiempo de edición expirado
                </p>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                Han pasado más de 24 horas desde la creación de esta historia clínica. 
                No se puede modificar. Debe crear una nueva historia clínica para este paciente.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-700 text-sm mb-2">Historia Clínica Anterior:</p>
              <div
                className="text-gray-600 text-sm [&_b]:font-bold [&_i]:italic [&_u]:underline"
                dangerouslySetInnerHTML={{
                  __html: historia?.observaciones?.includes?.('<') && historia?.observaciones?.includes?.('>')
                    ? historia.observaciones
                    : `<span style="white-space: pre-wrap">${(historia?.observaciones || 'Sin contenido').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
                }}
              />
              <p className="text-xs text-gray-500 mt-4">
                Creada: {new Date(historia.createdAt).toLocaleString('es-AR')}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button onClick={onClose} className="btn btn-secondary">
                Cerrar
              </button>
              <button
                onClick={handleCreateNew}
                disabled={crearAtencionMutation.isPending || createNewMutation.isPending}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {crearAtencionMutation.isPending || createNewMutation.isPending 
                  ? 'Creando...' 
                  : 'Crear Nueva Historia Clínica'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Editar Historia Clínica</h2>
            <p className="text-sm text-gray-500 mt-1">
              {historia.paciente?.nombre} {historia.paciente?.apellido} - DNI: {historia.paciente?.dni}
            </p>
            {horasRestantes !== null && horasRestantes > 0 && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Tiempo restante para editar: {Math.floor(horasRestantes)}h {Math.floor((horasRestantes % 1) * 60)}m
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos del Paciente - igual que en creación */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Datos del Paciente
            </h3>
            {historia.atencion?.pagoAsociado?.observaciones && (
              <div className="w-full mt-2 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-800 mb-1">Observación de Pago:</p>
                <p className="text-sm font-bold text-amber-900">{historia.atencion.pagoAsociado.observaciones}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Nombre</p>
                <p className="text-sm font-semibold text-gray-900">
                  {historia.paciente?.nombre} {historia.paciente?.apellido}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Obra Social</p>
                <p className="text-sm font-semibold text-gray-900">
                  {historia.paciente?.obraSocial || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Número de Afiliado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {historia.paciente?.numeroAfiliado || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Fecha de Nacimiento</p>
                <p className="text-sm font-semibold text-gray-900">
                  {historia.paciente?.fechaNacimiento
                    ? formatearFechaNacimiento(historia.paciente.fechaNacimiento)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Edad</p>
                <p className="text-sm font-semibold text-primary-700">
                  {historia.paciente?.fechaNacimiento
                    ? formatearEdad(historia.paciente.fechaNacimiento)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">DNI</p>
                <p className="text-sm font-semibold text-gray-900">
                  {historia.paciente?.dni || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Historial de Historias Clínicas - igual que en creación */}
          {Object.keys(historiasPorEspecialidad).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                Historial de Historias Clínicas
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                {Object.entries(historiasPorEspecialidad).map(([especialidad, historiasEspecialidad]) => {
                  const isExpanded = especialidadesExpandidas[especialidad] ?? false
                  return (
                    <div key={especialidad} className="mb-4 last:mb-0">
                      <button
                        type="button"
                        onClick={() => setEspecialidadesExpandidas(prev => ({ ...prev, [especialidad]: !isExpanded }))}
                        className="flex items-center gap-2 mb-2 w-full text-left hover:bg-gray-100 p-2 rounded transition-colors"
                      >
                        <Stethoscope className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-gray-900 text-sm">{especialidad}</span>
                        <span className="text-xs text-gray-500">
                          ({historiasEspecialidad.length} {historiasEspecialidad.length === 1 ? 'consulta' : 'consultas'})
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />}
                      </button>
                      {isExpanded && (
                        <div className="space-y-2 ml-6">
                          {historiasEspecialidad.map((h) => (
                            <div key={h.id} className="p-3 border border-gray-200 rounded-lg bg-white text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(h.fechaConsulta).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                  {h.medico?.usuario && (
                                    <span className="text-xs text-gray-600 font-medium">
                                      • Dr. {h.medico.usuario.nombre} {h.medico.usuario.apellido}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div
                                className="text-gray-700 text-sm [&_b]:font-bold [&_i]:italic [&_u]:underline"
                                dangerouslySetInnerHTML={{
                                  __html: h?.observaciones?.includes?.('<') && h?.observaciones?.includes?.('>')
                                    ? h.observaciones
                                    : `<span style="white-space: pre-wrap">${(h?.observaciones || 'Sin contenido').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
                                }}
                              />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historia Clínica *
            </label>
            <EditorHistoriaClinica
              value={formData.contenido}
              onChange={(contenido) => setFormData({ ...formData, contenido })}
              placeholder="Complete aquí la historia clínica completa. Use las herramientas para dar formato al texto."
              rows={15}
            />
            <p className="mt-2 text-xs text-gray-500">
              Puede editar esta historia clínica hasta 24 horas después de su creación.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

