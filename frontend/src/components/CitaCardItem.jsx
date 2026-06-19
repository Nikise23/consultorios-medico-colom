import {
  ChevronDown,
  Clock,
  Stethoscope,
  Send,
  Check,
  X,
  UserX,
  Calendar,
  User,
} from 'lucide-react'
import {
  ESTADO_CITA_LABELS,
  ESTADO_CITA_COLORS,
  getTipoNotificacion,
} from '../utils/citaNotificaciones'
import { puedeEnviarEsperaAhora } from '../utils/citaAgenda'
import { formatHora24, TZ_ARGENTINA } from '../utils/formatFecha'

export default function CitaCardItem({
  cita,
  expanded,
  onToggle,
  soloLectura,
  puedeCheckin,
  onConfirmar,
  onCheckin,
  onEdit,
  onNoAsistio,
  onCancelar,
  onEliminar,
  mostrarFecha = false,
}) {
  const notif = getTipoNotificacion(cita.paciente?.email)
  const fechaHora = new Date(cita.fechaHora)
  const checkinDisponible =
    puedeCheckin(cita) && puedeEnviarEsperaAhora(cita.fechaHora)
  const hora = formatHora24(cita.fechaHora)
  const fechaTexto = fechaHora.toLocaleDateString('es-AR', {
    timeZone: TZ_ARGENTINA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <li
      className={`border border-gray-200 rounded-lg bg-white overflow-hidden transition-colors ${
        expanded ? 'border-primary-200 shadow-sm' : 'hover:border-gray-300'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-2.5 py-2 flex items-center gap-2 min-h-0"
      >
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
        {mostrarFecha && (
          <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:flex items-center">
            <Calendar className="w-3 h-3 mr-0.5" />
            {fechaTexto}
          </span>
        )}
        <span className="font-medium text-primary-700 text-sm flex-shrink-0 flex items-center">
          <Clock className="w-3 h-3 mr-0.5" />
          {hora}
        </span>
        <span className="font-medium text-gray-900 text-sm truncate flex-1 min-w-0">
          {cita.paciente?.apellido}, {cita.paciente?.nombre}
          {cita.paciente?.dni && (
            <span className="text-gray-500 font-normal"> · DNI {cita.paciente.dni}</span>
          )}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${ESTADO_CITA_COLORS[cita.estado] || ''}`}
        >
          {ESTADO_CITA_LABELS[cita.estado]}
        </span>
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 pt-0 border-t border-gray-100 space-y-2">
          {mostrarFecha && (
            <p className="text-xs text-gray-600 sm:hidden flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {fechaTexto}
            </p>
          )}
          {cita.paciente && (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-0.5">
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                {cita.paciente.apellido}, {cita.paciente.nombre}
              </p>
              {cita.paciente.dni && (
                <p className="text-xs text-gray-600 pl-5">DNI {cita.paciente.dni}</p>
              )}
              {cita.paciente.obraSocial && (
                <p className="text-xs text-gray-600 pl-5">
                  Obra social: {cita.paciente.obraSocial}
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 flex items-center">
            <Stethoscope className="w-3 h-3 mr-1 flex-shrink-0" />
            Dr. {cita.medico?.usuario?.nombre} {cita.medico?.usuario?.apellido}
          </p>
          {cita.motivo && <p className="text-xs text-gray-600">{cita.motivo}</p>}
          <p className={`text-xs px-2 py-1 rounded border ${notif.color}`}>{notif.mensaje}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {!soloLectura && cita.estado === 'PROGRAMADA' && (
              <button
                type="button"
                title="Confirmar y notificar"
                className="p-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100"
                onClick={() => onConfirmar(cita.id)}
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {!soloLectura && checkinDisponible && (
              <button
                type="button"
                title="Enviar a sala de espera"
                className="p-1.5 rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
                onClick={() => onCheckin(cita)}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            {!soloLectura && ['PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado) && (
              <>
                {['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado) && (
                  <button
                    type="button"
                    title="Editar"
                    className="p-1.5 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs"
                    onClick={() => onEdit(cita)}
                  >
                    Editar
                  </button>
                )}
                {['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado) && (
                  <>
                    <button
                      type="button"
                      title="No asistió"
                      className="p-1.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100"
                      onClick={() => onNoAsistio(cita.id)}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Cancelar turno (libera el horario)"
                      className="p-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => onCancelar(cita.id)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  title="Eliminar turno de la agenda"
                  className="p-1.5 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs"
                  onClick={() => onEliminar(cita.id)}
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
