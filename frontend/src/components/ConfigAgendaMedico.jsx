import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Ban, Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getAgendaMedico,
  setHorariosMedico,
  agregarBloqueoAgenda,
  eliminarBloqueoAgenda,
} from '../services/api'

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

const horarioVacio = () => ({
  diaSemana: 3,
  horaInicio: '09:00',
  horaFin: '12:00',
  slotMinutos: 20,
  activo: true,
})

function formatFechaBloqueo(fecha) {
  const d = new Date(fecha)
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function toDateInputValue(fecha) {
  const d = new Date(fecha)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function ConfigAgendaMedico({ medicos }) {
  const queryClient = useQueryClient()
  const [medicoId, setMedicoId] = useState('')
  const [horarios, setHorarios] = useState([])
  const [bloqueoFecha, setBloqueoFecha] = useState('')
  const [bloqueoMotivo, setBloqueoMotivo] = useState('')

  const { data: agendaData, isLoading } = useQuery({
    queryKey: ['agenda', medicoId],
    queryFn: () => getAgendaMedico(medicoId),
    enabled: !!medicoId,
  })

  const agenda = agendaData?.data || agendaData

  useEffect(() => {
    if (agenda?.horarios) {
      setHorarios(
        agenda.horarios.map((h) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          slotMinutos: h.slotMinutos,
          activo: h.activo,
        })),
      )
    }
  }, [agenda])

  const guardarHorariosMutation = useMutation({
    mutationFn: () => setHorariosMedico(medicoId, { horarios }),
    onSuccess: () => {
      toast.success('Horarios guardados')
      queryClient.invalidateQueries(['agenda', medicoId])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error al guardar'),
  })

  const agregarBloqueoMutation = useMutation({
    mutationFn: () =>
      agregarBloqueoAgenda(medicoId, {
        fecha: bloqueoFecha,
        motivo: bloqueoMotivo || undefined,
      }),
    onSuccess: () => {
      toast.success('Día bloqueado')
      setBloqueoFecha('')
      setBloqueoMotivo('')
      queryClient.invalidateQueries(['agenda', medicoId])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error al bloquear'),
  })

  const eliminarBloqueoMutation = useMutation({
    mutationFn: (fecha) => eliminarBloqueoAgenda(medicoId, fecha),
    onSuccess: () => {
      toast.success('Bloqueo eliminado')
      queryClient.invalidateQueries(['agenda', medicoId])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  })

  const actualizarHorario = (index, campo, valor) => {
    setHorarios((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [campo]: valor } : h)),
    )
  }

  const agregarFranja = () => {
    setHorarios((prev) => [...prev, horarioVacio()])
  }

  const quitarFranja = (index) => {
    setHorarios((prev) => prev.filter((_, i) => i !== index))
  }

  const medicoSeleccionado = medicos.find((m) => String(m.id) === medicoId)

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary-600" />
        Horarios y bloqueos por profesional
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesional
        </label>
        <select
          className="input max-w-md w-full"
          value={medicoId}
          onChange={(e) => setMedicoId(e.target.value)}
        >
          <option value="">Seleccionar profesional</option>
          {medicos.map((m) => (
            <option key={m.id} value={m.id}>
              Dr. {m.usuario?.nombre} {m.usuario?.apellido}
            </option>
          ))}
        </select>
      </div>

      {!medicoId ? (
        <p className="text-sm text-gray-500">
          Elegí un profesional para ver o modificar sus días y horarios de atención.
        </p>
      ) : isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="font-medium text-gray-900">
                Horario semanal
                {medicoSeleccionado && (
                  <span className="text-gray-500 font-normal ml-2">
                    — Dr. {medicoSeleccionado.usuario?.nombre}{' '}
                    {medicoSeleccionado.usuario?.apellido}
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={agregarFranja}
                  className="btn btn-secondary inline-flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar franja
                </button>
                <button
                  type="button"
                  onClick={() => guardarHorariosMutation.mutate()}
                  disabled={guardarHorariosMutation.isPending}
                  className="btn btn-primary inline-flex items-center text-sm"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {guardarHorariosMutation.isPending ? 'Guardando...' : 'Guardar horarios'}
                </button>
              </div>
            </div>

            {horarios.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 border rounded-lg text-center">
                Sin horarios configurados. Agregá franjas para habilitar turnos.
              </p>
            ) : (
              <div className="space-y-3">
                {horarios.map((h, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end p-3 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Día
                      </label>
                      <select
                        className="input w-full text-sm"
                        value={h.diaSemana}
                        onChange={(e) =>
                          actualizarHorario(index, 'diaSemana', Number(e.target.value))
                        }
                      >
                        {DIAS_SEMANA.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Desde
                      </label>
                      <input
                        type="time"
                        className="input w-full text-sm"
                        value={h.horaInicio}
                        onChange={(e) =>
                          actualizarHorario(index, 'horaInicio', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Hasta
                      </label>
                      <input
                        type="time"
                        className="input w-full text-sm"
                        value={h.horaFin}
                        onChange={(e) =>
                          actualizarHorario(index, 'horaFin', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cada (min)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        className="input w-full text-sm"
                        value={h.slotMinutos}
                        onChange={(e) =>
                          actualizarHorario(
                            index,
                            'slotMinutos',
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm mt-5">
                        <input
                          type="checkbox"
                          checked={h.activo}
                          onChange={(e) =>
                            actualizarHorario(index, 'activo', e.target.checked)
                          }
                        />
                        Activo
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => quitarFranja(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Quitar franja"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
              <Ban className="w-4 h-4 text-red-500" />
              Días bloqueados (no atiende)
            </h3>

            <div className="flex flex-wrap gap-3 items-end mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  className="input text-sm"
                  value={bloqueoFecha}
                  onChange={(e) => setBloqueoFecha(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  className="input w-full text-sm"
                  placeholder="Ej: vacaciones, congreso..."
                  value={bloqueoMotivo}
                  onChange={(e) => setBloqueoMotivo(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!bloqueoFecha) {
                    toast.error('Seleccioná una fecha')
                    return
                  }
                  agregarBloqueoMutation.mutate()
                }}
                disabled={agregarBloqueoMutation.isPending}
                className="btn btn-secondary inline-flex items-center text-sm"
              >
                <Ban className="w-4 h-4 mr-1" />
                Bloquear día
              </button>
            </div>

            {!agenda?.bloqueos?.length ? (
              <p className="text-sm text-gray-500">No hay días bloqueados.</p>
            ) : (
              <ul className="space-y-2">
                {agenda.bloqueos.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {formatFechaBloqueo(b.fecha)}
                      </p>
                      {b.motivo && (
                        <p className="text-sm text-gray-500">{b.motivo}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            '¿Desbloquear este día y permitir turnos nuevamente?',
                          )
                        ) {
                          eliminarBloqueoMutation.mutate(toDateInputValue(b.fecha))
                        }
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Desbloquear
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
