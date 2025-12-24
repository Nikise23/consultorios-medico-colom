import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Save, Clock, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateHistoriaClinica, crearNuevaConsulta, createHistoriaClinica } from '../services/api'

export default function EditarHistoriaClinicaForm({ historia, onClose, onSuccess, onCreateNew }) {
  const [formData, setFormData] = useState({
    contenido: '',
  })
  const [puedeEditar, setPuedeEditar] = useState(true)
  const [horasRestantes, setHorasRestantes] = useState(null)

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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.contenido || formData.contenido.trim() === '') {
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
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {historia.observaciones || 'Sin contenido'}
              </p>
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historia Clínica *
            </label>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              className="input"
              rows="15"
              placeholder="Complete aquí la historia clínica completa..."
              required
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

