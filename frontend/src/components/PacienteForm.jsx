import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPaciente, updatePaciente } from '../services/api'

export default function PacienteForm({ paciente, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    obraSocial: '',
    numeroAfiliado: '',
  })

  useEffect(() => {
    if (paciente) {
      setFormData({
        dni: paciente.dni || '',
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        fechaNacimiento: paciente.fechaNacimiento
          ? paciente.fechaNacimiento.split('T')[0]
          : '',
        telefono: paciente.telefono || '',
        email: paciente.email || '',
        direccion: paciente.direccion || '',
        obraSocial: paciente.obraSocial || '',
        numeroAfiliado: paciente.numeroAfiliado || '',
      })
    }
  }, [paciente])

  const createMutation = useMutation({
    mutationFn: createPaciente,
    onSuccess: () => {
      toast.success('Paciente creado exitosamente')
      onSuccess()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al crear paciente'
      toast.error(errorMessage)
      console.error('Error al crear paciente:', error.response?.data)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePaciente(id, data),
    onSuccess: () => {
      toast.success('Paciente actualizado exitosamente')
      onSuccess()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al actualizar paciente'
      toast.error(errorMessage)
      console.error('Error al actualizar paciente:', error.response?.data)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Limpiar campos vacíos y convertir fechaNacimiento
    const cleanData = { ...formData }
    
    // Si fechaNacimiento está vacío, no enviarlo
    if (!cleanData.fechaNacimiento || cleanData.fechaNacimiento === '') {
      delete cleanData.fechaNacimiento
    }
    
    // Eliminar campos vacíos opcionales
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' && key !== 'dni' && key !== 'nombre' && key !== 'apellido' && key !== 'obraSocial') {
        delete cleanData[key]
      }
    })
    
    if (paciente) {
      updateMutation.mutate({ id: paciente.id, data: cleanData })
    } else {
      createMutation.mutate(cleanData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {paciente ? 'Actualizar Paciente' : 'Nuevo Paciente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI *
              </label>
              <input
                type="text"
                required
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="input"
                disabled={!!paciente}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obra Social *
              </label>
              <input
                type="text"
                required
                value={formData.obraSocial}
                onChange={(e) => setFormData({ ...formData, obraSocial: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Afiliado
              </label>
              <input
                type="text"
                value={formData.numeroAfiliado}
                onChange={(e) => setFormData({ ...formData, numeroAfiliado: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="input"
              rows="2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : paciente
                ? 'Actualizar'
                : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


