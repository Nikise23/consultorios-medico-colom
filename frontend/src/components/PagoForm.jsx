import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DollarSign, Save, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPago, getMedicos } from '../services/api'

export default function PagoForm({ paciente, onSuccess }) {
  const [formData, setFormData] = useState({
    monto: '',
    tipoPago: 'EFECTIVO',
    numeroComprobante: '',
    observaciones: '',
    historiaClinicaId: null,
    medicoId: '',
  })

  const { data: medicosData, isLoading: loadingMedicos } = useQuery({
    queryKey: ['medicos', 'pago-form'],
    queryFn: () => getMedicos(),
  })

  const createMutation = useMutation({
    mutationFn: createPago,
    onSuccess: () => {
      onSuccess()
      setFormData({
        monto: '',
        tipoPago: 'EFECTIVO',
        numeroComprobante: '',
        observaciones: '',
        historiaClinicaId: null,
        medicoId: '',
      })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al registrar pago'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!paciente || !paciente.id) {
      toast.error('Debe seleccionar un paciente válido')
      return
    }
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    createMutation.mutate({
      pacienteId: paciente.id,
      monto: parseFloat(formData.monto),
      tipoPago: formData.tipoPago,
      numeroComprobante: formData.numeroComprobante || undefined,
      observaciones: formData.observaciones || undefined,
      historiaClinicaId: formData.historiaClinicaId || undefined,
      medicoId: formData.medicoId ? parseInt(formData.medicoId) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            className="input pl-8"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Pago *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, tipoPago: 'EFECTIVO' })}
            className={`p-4 border-2 rounded-lg transition-colors ${
              formData.tipoPago === 'EFECTIVO'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">💵</span>
              <span className="font-medium">Efectivo</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, tipoPago: 'TRANSFERENCIA' })}
            className={`p-4 border-2 rounded-lg transition-colors ${
              formData.tipoPago === 'TRANSFERENCIA'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🏦</span>
              <span className="font-medium">Transferencia</span>
            </div>
          </button>
        </div>
      </div>

      {formData.tipoPago === 'TRANSFERENCIA' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Comprobante
          </label>
          <input
            type="text"
            value={formData.numeroComprobante}
            onChange={(e) => setFormData({ ...formData, numeroComprobante: e.target.value })}
            className="input"
            placeholder="Número de comprobante o referencia"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Médico y Especialidad <span className="text-gray-500 text-xs">(para reportes)</span>
        </label>
        {loadingMedicos ? (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-xs text-gray-500">Cargando médicos...</p>
          </div>
        ) : (
          <select
            value={formData.medicoId}
            onChange={(e) => setFormData({ ...formData, medicoId: e.target.value })}
            className="input"
          >
            <option value="">Seleccione un médico (opcional)</option>
            {medicosData?.data?.map((medico) => (
              <option key={medico.id} value={medico.id}>
                Dr. {medico.usuario?.nombre} {medico.usuario?.apellido} - {medico.especialidad}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Seleccione el médico para que el pago aparezca en su reporte correspondiente
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          className="input"
          rows="2"
          placeholder="Observaciones adicionales..."
        />
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="btn btn-primary w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        {createMutation.isPending ? 'Registrando...' : 'Registrar Pago'}
      </button>
    </form>
  )
}



