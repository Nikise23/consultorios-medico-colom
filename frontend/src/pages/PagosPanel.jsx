import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, DollarSign, CreditCard, Wallet, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchPacientes, getPagosByPaciente, createPago, searchPagos, deletePago } from '../services/api'
import PagoForm from '../components/PagoForm'
import EditarPagoForm from '../components/EditarPagoForm'

export default function PagosPanel() {
  const [searchType, setSearchType] = useState('dni')
  const [searchValue, setSearchValue] = useState('')
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [pagoEditando, setPagoEditando] = useState(null)
  const [viewMode, setViewMode] = useState('paciente') // 'paciente' o 'todos'
  const queryClient = useQueryClient()

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ['pacientes', 'pagos', searchType, searchValue],
    queryFn: async () => {
      const result = await searchPacientes({ [searchType]: searchValue })
      console.log('Resultado de búsqueda en PagosPanel:', result)
      
      // La respuesta de Axios es: { data: { data: [...] } }
      // Necesitamos acceder a result.data.data para obtener el array
      let pacientesArray = []
      
      if (result?.data) {
        // Si result.data es un array directamente
        if (Array.isArray(result.data)) {
          pacientesArray = result.data
        } 
        // Si result.data tiene una propiedad data que es un array
        else if (result.data?.data && Array.isArray(result.data.data)) {
          pacientesArray = result.data.data
        }
        // Si result.data es un objeto único (un solo paciente)
        else if (result.data && typeof result.data === 'object' && result.data.id) {
          pacientesArray = [result.data]
        }
        // Si result.data.data es un objeto único
        else if (result.data?.data && typeof result.data.data === 'object' && result.data.data.id) {
          pacientesArray = [result.data.data]
        }
      }
      
      console.log('Pacientes normalizados:', pacientesArray)
      return { data: pacientesArray }
    },
    enabled: searchValue.length > 0,
  })

  const { data: pagos, isLoading: loadingPagos } = useQuery({
    queryKey: ['pagos', 'paciente', selectedPaciente?.id],
    queryFn: () => getPagosByPaciente(selectedPaciente.id),
    enabled: !!selectedPaciente && !!selectedPaciente.id && viewMode === 'paciente',
  })

  const { data: todosPagos, isLoading: loadingTodosPagos } = useQuery({
    queryKey: ['pagos', 'todos'],
    queryFn: () => searchPagos({}),
    enabled: viewMode === 'todos',
  })

  const deleteMutation = useMutation({
    mutationFn: deletePago,
    onSuccess: () => {
      queryClient.invalidateQueries(['pagos'])
      toast.success('Pago eliminado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al eliminar pago'
      toast.error(errorMessage)
    },
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.length > 0) {
      // La búsqueda se ejecuta automáticamente con useQuery
    }
  }

  const handlePacienteSelect = (paciente) => {
    if (!paciente || !paciente.id) {
      toast.error('Paciente inválido')
      return
    }
    setSelectedPaciente(paciente)
    setSearchValue('')
  }

  const getTipoPagoIcon = (tipo) => {
    return tipo === 'EFECTIVO' ? (
      <Wallet className="w-4 h-4 text-green-600" />
    ) : (
      <CreditCard className="w-4 h-4 text-blue-600" />
    )
  }

  const getTipoPagoLabel = (tipo) => {
    return tipo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'
  }

  const totalPagado = pagos?.data?.reduce((sum, pago) => sum + pago.monto, 0) || 0
  const totalTodosPagos = todosPagos?.data?.reduce((sum, pago) => sum + pago.monto, 0) || 0

  const handleEliminarPago = (pago) => {
    if (window.confirm(`¿Está seguro de eliminar el pago de $${pago.monto.toFixed(2)} del ${new Date(pago.fechaPago).toLocaleDateString()}?`)) {
      deleteMutation.mutate(pago.id)
    }
  }

  const pagosList = viewMode === 'paciente' ? (pagos?.data || []) : (todosPagos?.data || [])
  const isLoadingPagos = viewMode === 'paciente' ? loadingPagos : loadingTodosPagos

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Busca pacientes y registra pagos de consultas
        </p>
      </div>

      {/* Tabs para cambiar vista */}
      <div className="card mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setViewMode('paciente')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'paciente'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Por Paciente
          </button>
          <button
            onClick={() => setViewMode('todos')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'todos'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos los Pagos
          </button>
        </div>
      </div>

      {/* Búsqueda de Paciente - Solo visible en modo paciente */}
      {viewMode === 'paciente' && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Buscar Paciente</h2>
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
      )}

      {/* Resultados de búsqueda - Solo visible en modo paciente */}
      {viewMode === 'paciente' && (
        <>
          {isLoading && (
            <div className="card text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Buscando...</p>
            </div>
          )}

          {pacientes?.data && Array.isArray(pacientes.data) && pacientes.data.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Resultados</h2>
              
              {/* Vista de tabla para pantallas grandes */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paciente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DNI</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Obra Social</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Teléfono</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.data.map((paciente) => {
                      if (!paciente || !paciente.id) return null
                      
                      return (
                        <tr
                          key={paciente.id}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedPaciente?.id === paciente.id
                              ? 'bg-primary-50 hover:bg-primary-100'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handlePacienteSelect(paciente)}
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {paciente.nombre} {paciente.apellido}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.dni}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.obraSocial || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.telefono || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{paciente.email || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            {selectedPaciente?.id === paciente.id && (
                              <span className="text-xs px-2 py-1 bg-primary-600 text-white rounded">Seleccionado</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para pantallas pequeñas */}
              <div className="lg:hidden space-y-3">
                {pacientes.data.map((paciente) => {
                  if (!paciente || !paciente.id) return null
                  
                  const formatFechaNacimiento = (dateString) => {
                    if (!dateString) return ''
                    const datePart = dateString.split('T')[0]
                    const [year, month, day] = datePart.split('-').map(Number)
                    const date = new Date(year, month - 1, day)
                    return date.toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  }
                  
                  return (
                    <div
                      key={paciente.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaciente?.id === paciente.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => handlePacienteSelect(paciente)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-gray-900 mb-2">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <p><span className="font-medium">DNI:</span> {paciente.dni}</p>
                            {paciente.obraSocial && (
                              <p><span className="font-medium">Obra Social:</span> {paciente.obraSocial}</p>
                            )}
                            {paciente.fechaNacimiento && (
                              <p><span className="font-medium">Fecha de Nacimiento:</span> {formatFechaNacimiento(paciente.fechaNacimiento)}</p>
                            )}
                            {paciente.telefono && (
                              <p><span className="font-medium">Teléfono:</span> {paciente.telefono}</p>
                            )}
                            {paciente.email && (
                              <p><span className="font-medium">Email:</span> {paciente.email}</p>
                            )}
                            {paciente.direccion && (
                              <p className="md:col-span-2"><span className="font-medium">Dirección:</span> {paciente.direccion}</p>
                            )}
                          </div>
                        </div>
                        {selectedPaciente?.id === paciente.id && (
                          <span className="text-primary-600 font-medium ml-4">Seleccionado</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {pacientes?.data && Array.isArray(pacientes.data) && pacientes.data.length === 0 && (
            <div className="card mb-6">
              <div className="text-center py-8 text-gray-500">
                <p>No se encontraron pacientes</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lista de Todos los Pagos */}
      {viewMode === 'todos' && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Todos los Pagos</h2>
          {isLoadingPagos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : pagosList && pagosList.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Vista de tabla para pantallas grandes */}
              <table className="hidden lg:table w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paciente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Monto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Comprobante</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Médico</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosList.map((pago) => (
                    <tr key={pago.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {pago.paciente?.nombre} {pago.paciente?.apellido}
                        <span className="text-gray-500 text-xs block">DNI: {pago.paciente?.dni}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        ${pago.monto.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getTipoPagoIcon(pago.tipoPago)}
                          <span className="text-gray-700">{getTipoPagoLabel(pago.tipoPago)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {pago.numeroComprobante || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {(() => {
                          // Intentar obtener el médico desde historia clínica o desde atención
                          const medico = pago.historiaClinica?.medico || pago.atencion?.medico;
                          if (medico) {
                            return (
                              <span>
                                Dr. {medico.usuario?.nombre} {medico.usuario?.apellido}
                                <span className="text-xs text-gray-500 block">{medico.especialidad}</span>
                              </span>
                            );
                          }
                          return '-';
                        })()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPagoEditando(pago)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="Editar pago"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarPago(pago)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar pago"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Vista de tarjetas para pantallas pequeñas */}
              <div className="lg:hidden space-y-3">
                {pagosList.map((pago) => (
                  <div
                    key={pago.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getTipoPagoIcon(pago.tipoPago)}
                        <span className="font-medium text-gray-900">
                          ${pago.monto.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(pago.fechaPago).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => setPagoEditando(pago)}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Editar pago"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminarPago(pago)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar pago"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Paciente:</span> {pago.paciente?.nombre} {pago.paciente?.apellido} (DNI: {pago.paciente?.dni})
                      </p>
                      <p>Tipo: {getTipoPagoLabel(pago.tipoPago)}</p>
                      {pago.numeroComprobante && (
                        <p>Comprobante: {pago.numeroComprobante}</p>
                      )}
                      {(() => {
                        const medico = pago.historiaClinica?.medico || pago.atencion?.medico;
                        if (pago.historiaClinica) {
                          return (
                            <p className="text-xs text-gray-500 mt-1">
                              Consulta: {new Date(pago.historiaClinica.fechaConsulta).toLocaleDateString()}
                              {medico && (
                                <span> - Dr. {medico.usuario?.nombre} {medico.usuario?.apellido} ({medico.especialidad})</span>
                              )}
                            </p>
                          );
                        } else if (medico) {
                          return (
                            <p className="text-xs text-gray-500 mt-1">
                              Médico: Dr. {medico.usuario?.nombre} {medico.usuario?.apellido} ({medico.especialidad})
                            </p>
                          );
                        }
                        return null;
                      })()}
                      {pago.observaciones && (
                        <p className="text-xs text-gray-500 mt-1">
                          Observaciones: {pago.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 text-lg">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    ${totalTodosPagos.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay pagos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Información del Paciente Seleccionado y Registro de Pago */}
      {viewMode === 'paciente' && selectedPaciente && selectedPaciente.id && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Formulario de Pago */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Registrar Pago</h2>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Paciente:</p>
              <p className="font-medium text-gray-900">
                {selectedPaciente.nombre} {selectedPaciente.apellido}
              </p>
              <p className="text-xs text-gray-500">DNI: {selectedPaciente.dni}</p>
            </div>
            <PagoForm
              paciente={selectedPaciente}
              onSuccess={() => {
                queryClient.invalidateQueries(['pagos'])
                toast.success('Pago registrado exitosamente')
              }}
            />
          </div>

          {/* Historial de Pagos */}
          <div className="card lg:col-span-1 xl:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Historial de Pagos</h2>
            {loadingPagos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : pagos?.data && pagos.data.length > 0 ? (
              <>
                {/* Vista de tabla para pantallas grandes */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Monto</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Comprobante</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.data.map((pago) => (
                        <tr key={pago.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            ${pago.monto.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              {getTipoPagoIcon(pago.tipoPago)}
                              <span className="text-gray-700">{getTipoPagoLabel(pago.tipoPago)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {pago.numeroComprobante || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPagoEditando(pago)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="Editar pago"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarPago(pago)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar pago"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan="4" className="py-3 px-4 text-right font-semibold text-gray-900">
                          Total Pagado:
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xl font-bold text-primary-600">
                            ${totalPagado.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Vista de tarjetas para pantallas pequeñas */}
                <div className="lg:hidden space-y-3">
                  {pagos.data.map((pago) => (
                    <div
                      key={pago.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getTipoPagoIcon(pago.tipoPago)}
                          <span className="font-medium text-gray-900">
                            ${pago.monto.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(pago.fechaPago).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Tipo: {getTipoPagoLabel(pago.tipoPago)}</p>
                        {pago.numeroComprobante && (
                          <p>Comprobante: {pago.numeroComprobante}</p>
                        )}
                        {pago.historiaClinica && (
                          <p className="text-xs text-gray-500 mt-1">
                            Consulta: {new Date(pago.historiaClinica.fechaConsulta).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setPagoEditando(pago)}
                          className="btn btn-secondary text-xs py-1 px-2"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarPago(pago)}
                          className="btn btn-danger text-xs py-1 px-2"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Pagado:</span>
                      <span className="text-xl font-bold text-primary-600">
                        ${totalPagado.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No hay pagos registrados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Editar Pago */}
      {pagoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Editar Pago</h2>
                <button
                  onClick={() => setPagoEditando(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Paciente:</p>
                <p className="font-medium text-gray-900">
                  {pagoEditando.paciente?.nombre} {pagoEditando.paciente?.apellido}
                </p>
                <p className="text-xs text-gray-500">DNI: {pagoEditando.paciente?.dni}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Fecha: {new Date(pagoEditando.fechaPago).toLocaleDateString()}
                </p>
              </div>
              <EditarPagoForm
                pago={pagoEditando}
                onSuccess={() => {
                  queryClient.invalidateQueries(['pagos'])
                  setPagoEditando(null)
                }}
                onCancel={() => setPagoEditando(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



