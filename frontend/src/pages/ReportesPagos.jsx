import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Calendar, TrendingUp, Wallet, CreditCard, BarChart3, Download, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'
import { getReportePagosDia, getReportePagosMes, getReportePagosAnio, getEstadisticasPagos } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function ReportesPagos() {
  const { user } = useAuth()
  const [medicosExpandidos, setMedicosExpandidos] = useState({})
  // Inicializar mesSeleccionado con el mes actual en formato YYYY-MM
  const getMesActual = () => {
    const ahora = new Date()
    const anio = ahora.getFullYear()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    return `${anio}-${mes}`
  }

  const [periodo, setPeriodo] = useState('dia') // dia, mes, anio
  const [mesSeleccionado, setMesSeleccionado] = useState(getMesActual())
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear().toString())

  // Obtener estadísticas generales
  const { data: estadisticas, isLoading: loadingStats } = useQuery({
    queryKey: ['pagos', 'estadisticas'],
    queryFn: () => getEstadisticasPagos(),
    refetchInterval: 60000, // Actualizar cada minuto
  })

  // Obtener reporte según el período seleccionado
  const { data: reporte, isLoading: loadingReporte, error: errorReporte } = useQuery({
    queryKey: ['pagos', 'reporte', periodo, mesSeleccionado, anioSeleccionado],
    queryFn: () => {
      if (periodo === 'dia') {
        return getReportePagosDia()
      } else if (periodo === 'mes') {
        // Parsear el string YYYY-MM del input type="month"
        if (mesSeleccionado) {
          const [anio, mes] = mesSeleccionado.split('-').map(Number)
          return getReportePagosMes(anio, mes)
        } else {
          const ahora = new Date()
          return getReportePagosMes(ahora.getFullYear(), ahora.getMonth() + 1)
        }
      } else {
        return getReportePagosAnio(parseInt(anioSeleccionado))
      }
    },
    enabled: true, // Siempre habilitado, el mesSeleccionado ya tiene valor por defecto
  })

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto)
  }

  const obtenerNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[mes - 1] || ''
  }

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes de Pagos</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Consulta los ingresos por efectivo y transferencia
        </p>
      </div>

      {/* Estadísticas Generales */}
      {loadingStats ? (
        <div className="card text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : estadisticas?.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Resumen del Día */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Hoy</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatearMoneda(estadisticas.data.dia.total)}
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-700">
                    Efectivo: {formatearMoneda(estadisticas.data.dia.efectivo)}
                  </span>
                  <span className="text-green-700">
                    Transf: {formatearMoneda(estadisticas.data.dia.transferencia)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {estadisticas.data.dia.cantidad} {estadisticas.data.dia.cantidad === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
              <div className="bg-green-200 rounded-full p-3">
                <Calendar className="w-8 h-8 text-green-700" />
              </div>
            </div>
          </div>

          {/* Resumen del Mes */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Este Mes</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatearMoneda(estadisticas.data.mes.total)}
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-blue-700">
                    Efectivo: {formatearMoneda(estadisticas.data.mes.efectivo)}
                  </span>
                  <span className="text-blue-700">
                    Transf: {formatearMoneda(estadisticas.data.mes.transferencia)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {estadisticas.data.mes.cantidad} {estadisticas.data.mes.cantidad === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
              <div className="bg-blue-200 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-blue-700" />
              </div>
            </div>
          </div>

          {/* Resumen del Año */}
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Este Año</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {formatearMoneda(estadisticas.data.anio.total)}
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-purple-700">
                    Efectivo: {formatearMoneda(estadisticas.data.anio.efectivo)}
                  </span>
                  <span className="text-purple-700">
                    Transf: {formatearMoneda(estadisticas.data.anio.transferencia)}
                  </span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {estadisticas.data.anio.cantidad} {estadisticas.data.anio.cantidad === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
              <div className="bg-purple-200 rounded-full p-3">
                <BarChart3 className="w-8 h-8 text-purple-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Período y Reporte Detallado */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reporte Detallado</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodo('dia')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === 'dia'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => {
                setPeriodo('mes')
                // Asegurar que mesSeleccionado tenga un valor
                if (!mesSeleccionado) {
                  setMesSeleccionado(getMesActual())
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === 'mes'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setPeriodo('anio')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === 'anio'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Año
            </button>
          </div>
        </div>

        {/* Filtros según período */}
        <div className="mb-4 flex gap-4">
          {periodo === 'mes' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Mes
              </label>
              <input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="input"
              />
            </div>
          )}
          {periodo === 'anio' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Año
              </label>
              <input
                type="number"
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
                min="2020"
                max={new Date().getFullYear() + 1}
                className="input"
              />
            </div>
          )}
        </div>

        {/* Reporte Detallado */}
        {loadingReporte ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando reporte...</p>
          </div>
        ) : errorReporte ? (
          <div className="text-center py-8 text-red-600">
            <p>Error al cargar el reporte: {errorReporte.message || 'Error desconocido'}</p>
          </div>
        ) : reporte?.data ? (
          <div className="space-y-6">
            {/* Resumen del Período */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Efectivo</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatearMoneda(reporte.data.totalEfectivo)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Transferencia</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatearMoneda(reporte.data.totalTransferencia)}
                </p>
              </div>
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-primary-900">Total</span>
                </div>
                <p className="text-2xl font-bold text-primary-700">
                  {formatearMoneda(reporte.data.total)}
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  {reporte.data.cantidadPagos} {reporte.data.cantidadPagos === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
            </div>

            {/* Desglose por Médico (solo para administradores) */}
            {user?.rol === 'ADMINISTRADOR' && reporte.data.pagosPorMedico && reporte.data.pagosPorMedico.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2 text-primary-600" />
                  Desglose por Médico
                </h3>
                <div className="space-y-4">
                  {reporte.data.pagosPorMedico.map((medico, index) => {
                    const medicoKey = `${medico.medicoId}-${medico.medicoNombre}`
                    const isExpanded = medicosExpandidos[medicoKey] || false
                    const totalMedico = medico.totalEfectivo + medico.totalTransferencia
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        {/* Header del médico - clickeable para expandir/colapsar */}
                        <button
                          onClick={() => {
                            setMedicosExpandidos(prev => ({
                              ...prev,
                              [medicoKey]: !isExpanded
                            }))
                          }}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Stethoscope className="w-5 h-5 text-primary-600" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{medico.medicoNombre}</div>
                              <div className="text-xs text-gray-500">{medico.especialidad}</div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-right">
                                <div className="text-gray-500 text-xs">Total</div>
                                <div className="font-bold text-primary-700">
                                  {formatearMoneda(totalMedico)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-500 text-xs">
                                  {medico.cantidadPagos} {medico.cantidadPagos === 1 ? 'pago' : 'pagos'}
                                </div>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 ml-4" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 ml-4" />
                          )}
                        </button>

                        {/* Contenido expandible */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            {/* Resumen del médico */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Wallet className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-900">Efectivo</span>
                                </div>
                                <p className="text-xl font-bold text-green-700">
                                  {formatearMoneda(medico.totalEfectivo)}
                                </p>
                              </div>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <CreditCard className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-900">Transferencia</span>
                                </div>
                                <p className="text-xl font-bold text-blue-700">
                                  {formatearMoneda(medico.totalTransferencia)}
                                </p>
                              </div>
                              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <DollarSign className="w-4 h-4 text-primary-600" />
                                  <span className="text-sm font-medium text-primary-900">Total</span>
                                </div>
                                <p className="text-xl font-bold text-primary-700">
                                  {formatearMoneda(totalMedico)}
                                </p>
                              </div>
                            </div>

                            {/* Desglose por día (solo para reporte mensual) */}
                            {periodo === 'mes' && medico.pagosPorDia && medico.pagosPorDia.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  Desglose por Día - {medico.medicoNombre}
                                </h4>
                                <div className="space-y-2">
                                  {medico.pagosPorDia.map((dia, idx) => {
                                    const [anio, mes, diaNum] = dia.fecha.split('-').map(Number)
                                    const fechaLocal = new Date(anio, mes - 1, diaNum)
                                    return (
                                      <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-white">
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium text-gray-900">
                                            {fechaLocal.toLocaleDateString('es-AR', {
                                              day: 'numeric',
                                              month: 'long'
                                            })}
                                          </span>
                                          <div className="flex gap-4 text-sm">
                                            <span className="text-green-700">
                                              Efectivo: {formatearMoneda(dia.totalEfectivo)}
                                            </span>
                                            <span className="text-blue-700">
                                              Transf: {formatearMoneda(dia.totalTransferencia)}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                              Total: {formatearMoneda(dia.totalEfectivo + dia.totalTransferencia)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Desglose por mes (solo para reporte anual) */}
                            {periodo === 'anio' && medico.pagosPorMes && medico.pagosPorMes.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  Desglose por Mes - {medico.medicoNombre}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {medico.pagosPorMes.map((mes, idx) => (
                                    <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-white">
                                      <div className="font-medium text-gray-900 mb-2">
                                        {obtenerNombreMes(mes.mes)}
                                      </div>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-green-700">Efectivo:</span>
                                          <span className="font-medium">{formatearMoneda(mes.totalEfectivo)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Transferencia:</span>
                                          <span className="font-medium">{formatearMoneda(mes.totalTransferencia)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                          <span className="font-medium text-gray-900">Total:</span>
                                          <span className="font-bold text-primary-700">
                                            {formatearMoneda(mes.totalEfectivo + mes.totalTransferencia)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {mes.cantidad} {mes.cantidad === 1 ? 'pago' : 'pagos'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lista de pagos del médico */}
                            {medico.pagos && medico.pagos.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  Lista de Pagos de {medico.medicoNombre}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Fecha
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Paciente
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Tipo
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                          Monto
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Comprobante
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {medico.pagos.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {pago.paciente?.nombre} {pago.paciente?.apellido}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            <span
                                              className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                                                pago.tipoPago === 'EFECTIVO'
                                                  ? 'bg-green-100 text-green-800'
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}
                                            >
                                              {pago.tipoPago === 'EFECTIVO' ? (
                                                <Wallet className="w-3 h-3 mr-1" />
                                              ) : (
                                                <CreditCard className="w-3 h-3 mr-1" />
                                              )}
                                              {pago.tipoPago}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                            {formatearMoneda(pago.monto)}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                            {pago.numeroComprobante || '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900">
                                          Total
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                          {formatearMoneda(totalMedico)}
                                        </td>
                                        <td></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Desglose por día/mes según período */}
            {periodo === 'mes' && reporte.data.pagosPorDia && reporte.data.pagosPorDia.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Desglose por Día</h3>
                <div className="space-y-2">
                  {reporte.data.pagosPorDia.map((dia, index) => {
                    // Parsear la fecha correctamente considerando la zona horaria local
                    // dia.fecha viene como "YYYY-MM-DD" desde el backend
                    const [anio, mes, diaNum] = dia.fecha.split('-').map(Number)
                    const fechaLocal = new Date(anio, mes - 1, diaNum)
                    
                    return (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          {fechaLocal.toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-700">
                            Efectivo: {formatearMoneda(dia.totalEfectivo)}
                          </span>
                          <span className="text-blue-700">
                            Transf: {formatearMoneda(dia.totalTransferencia)}
                          </span>
                          <span className="font-medium text-gray-900">
                            Total: {formatearMoneda(dia.totalEfectivo + dia.totalTransferencia)}
                          </span>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            )}

            {periodo === 'anio' && reporte.data.pagosPorMes && reporte.data.pagosPorMes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Desglose por Mes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reporte.data.pagosPorMes.map((mes, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900 mb-2">
                        {obtenerNombreMes(mes.mes)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Efectivo:</span>
                          <span className="font-medium">{formatearMoneda(mes.totalEfectivo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Transferencia:</span>
                          <span className="font-medium">{formatearMoneda(mes.totalTransferencia)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-medium text-gray-900">Total:</span>
                          <span className="font-bold text-primary-700">
                            {formatearMoneda(mes.totalEfectivo + mes.totalTransferencia)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {mes.cantidad} {mes.cantidad === 1 ? 'pago' : 'pagos'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Pagos */}
            {reporte.data.pagos && reporte.data.pagos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Lista de Pagos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Monto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Comprobante
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reporte.data.pagos.map((pago) => (
                        <tr key={pago.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {pago.paciente?.nombre} {pago.paciente?.apellido}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                                pago.tipoPago === 'EFECTIVO'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {pago.tipoPago === 'EFECTIVO' ? (
                                <Wallet className="w-3 h-3 mr-1" />
                              ) : (
                                <CreditCard className="w-3 h-3 mr-1" />
                              )}
                              {pago.tipoPago}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatearMoneda(pago.monto)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {pago.numeroComprobante || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatearMoneda(reporte.data.total)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No hay pagos registrados para este período</p>
          </div>
        )}
      </div>
    </div>
  )
}

