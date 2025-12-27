import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Send, DollarSign, Wallet, CreditCard, Stethoscope, AlertCircle, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { enviarPacienteAEspera, getMedicos } from '../services/api'

export default function EnviarAEsperaConPago({ paciente, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    medicoId: '',
    monto: '',
    tipoPago: 'EFECTIVO',
    numeroComprobante: '',
    observacionesPago: '',
    observaciones: '',
    prioridad: false,
  })

  // Si el monto es 0, cambiar automáticamente a OBRA_SOCIAL
  useEffect(() => {
    const montoNumero = parseFloat(formData.monto) || 0
    if (montoNumero === 0 && formData.tipoPago !== 'OBRA_SOCIAL') {
      setFormData(prev => ({ ...prev, tipoPago: 'OBRA_SOCIAL' }))
    } else if (montoNumero > 0 && formData.tipoPago === 'OBRA_SOCIAL') {
      setFormData(prev => ({ ...prev, tipoPago: 'EFECTIVO' }))
    }
  }, [formData.monto, formData.tipoPago])

  // Obtener lista de médicos
  const { data: medicosData, isLoading: loadingMedicos } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => getMedicos(),
  })

  const medicos = medicosData?.data || []

  const enviarMutation = useMutation({
    mutationFn: enviarPacienteAEspera,
    onSuccess: () => {
      toast.success('Pago registrado y paciente enviado a sala de espera')
      onSuccess()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al enviar paciente'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.medicoId) {
      toast.error('Debes seleccionar un médico')
      return
    }

    if (formData.monto === '' || parseFloat(formData.monto) < 0) {
      toast.error('El monto no puede ser negativo')
      return
    }

    // Si el monto es 0, forzar tipo de pago a OBRA_SOCIAL
    const montoNumero = parseFloat(formData.monto) || 0
    const tipoPagoFinal = montoNumero === 0 ? 'OBRA_SOCIAL' : formData.tipoPago

    const data = {
      dni: paciente.dni,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      obraSocial: paciente.obraSocial,
      medicoId: parseInt(formData.medicoId),
      monto: montoNumero,
      tipoPago: tipoPagoFinal,
      numeroComprobante: formData.numeroComprobante || undefined,
      observacionesPago: formData.observacionesPago || undefined,
      observaciones: formData.observaciones || undefined,
      prioridad: formData.prioridad || false,
      actualizarDatos: false,
    }

    enviarMutation.mutate(data)
  }

  // Agrupar médicos por especialidad
  const medicosPorEspecialidad = medicos.reduce((acc, medico) => {
    const especialidad = medico.especialidad || 'Sin Especialidad'
    if (!acc[especialidad]) {
      acc[especialidad] = []
    }
    acc[especialidad].push(medico)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Registrar Pago y Enviar a Sala de Espera</h2>
            <p className="text-sm text-gray-500 mt-1">
              {paciente.nombre} {paciente.apellido} - DNI: {paciente.dni}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del Paciente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Datos del Paciente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="ml-2 font-medium">{paciente.nombre} {paciente.apellido}</span>
              </div>
              <div>
                <span className="text-gray-600">DNI:</span>
                <span className="ml-2 font-medium">{paciente.dni}</span>
              </div>
              <div>
                <span className="text-gray-600">Obra Social:</span>
                <span className="ml-2 font-medium">{paciente.obraSocial}</span>
              </div>
            </div>
          </div>

          {/* Selección de Médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Médico y Especialidad *
            </label>
            {loadingMedicos ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando médicos...</p>
              </div>
            ) : medicos.length === 0 ? (
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">No hay médicos disponibles</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(medicosPorEspecialidad).map(([especialidad, medicosEspecialidad]) => (
                  <div key={especialidad} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-primary-600" />
                      <span className="font-medium text-gray-900 text-sm">{especialidad}</span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {medicosEspecialidad.map((medico) => (
                        <label
                          key={medico.id}
                          className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                            formData.medicoId === String(medico.id)
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="medicoId"
                            value={medico.id}
                            checked={formData.medicoId === String(medico.id)}
                            onChange={(e) => setFormData({ ...formData, medicoId: e.target.value })}
                            className="mr-3 text-primary-600 focus:ring-primary-500"
                            required
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {medico.usuario.nombre} {medico.usuario.apellido}
                            </span>
                            {medico.matricula && (
                              <span className="text-xs text-gray-500 ml-2">
                                (Mat. {medico.matricula})
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario de Pago */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Registro de Pago
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto de la Consulta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="input pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago *
                </label>
                {parseFloat(formData.monto) === 0 ? (
                  <div className="p-4 border-2 border-primary-500 bg-primary-50 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="w-6 h-6 text-primary-600" />
                      <span className="font-medium text-primary-900">Obra Social</span>
                      <span className="text-xs text-gray-600">Cubierto por obra social</span>
                    </div>
                  </div>
                ) : (
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
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="w-6 h-6 text-green-600" />
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
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <span className="font-medium">Transferencia</span>
                      </div>
                    </button>
                  </div>
                )}
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
                  Observaciones del Pago
                </label>
                <textarea
                  value={formData.observacionesPago}
                  onChange={(e) => setFormData({ ...formData, observacionesPago: e.target.value })}
                  className="input"
                  rows="2"
                  placeholder="Observaciones adicionales sobre el pago..."
                />
              </div>
            </div>
          </div>

          {/* Prioridad */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div className="ml-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Enviar con Prioridad
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    El paciente aparecerá destacado en la sala de espera para atención preferencial
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Observaciones de la Atención */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones para la Atención (Opcional)
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="input"
              rows="2"
              placeholder="Observaciones para el médico..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviarMutation.isPending}
              className="btn btn-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {enviarMutation.isPending ? 'Procesando...' : 'Registrar Pago y Enviar a Sala'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

