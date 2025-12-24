import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { updatePago } from '../services/api'

export default function EditarPagoForm({ pago, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    monto: '',
    tipoPago: 'EFECTIVO',
    numeroComprobante: '',
    observaciones: '',
  })

  useEffect(() => {
    if (pago) {
      setFormData({
        monto: pago.monto || '',
        tipoPago: pago.tipoPago || 'EFECTIVO',
        numeroComprobante: pago.numeroComprobante || '',
        observaciones: pago.observaciones || '',
      })
    }
  }, [pago])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePago(id, data),
    onSuccess: () => {
      toast.success('Pago actualizado exitosamente')
      onSuccess()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al actualizar pago'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    updateMutation.mutate({
      id: pago.id,
      data: {
        monto: parseFloat(formData.monto),
        tipoPago: formData.tipoPago,
        numeroComprobante: formData.numeroComprobante || undefined,
        observaciones: formData.observaciones || undefined,
      },
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn btn-primary flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Pago'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </button>
      </div>
    </form>
  )
}

