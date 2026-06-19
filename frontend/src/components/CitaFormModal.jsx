import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Mail, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createCita,
  updateCita,
  searchPacientes,
  getMedicos,
  getAgendaMedico,
  getDisponibilidadAgenda,
} from '../services/api'
import { getTipoNotificacion } from '../utils/citaNotificaciones'
import { formatFechaHora24 } from '../utils/formatFecha'
import PacienteForm from './PacienteForm'

const DIAS_LABEL = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
}

function toDateInputValue(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDiasAtencion(dias) {
  if (!dias?.length) return ''
  return dias.map((d) => DIAS_LABEL[d] ?? d).join(', ')
}

export default function CitaFormModal({ cita, onClose, onSuccess }) {
  const isEdit = !!cita
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(cita?.paciente || null)
  const [busquedaDni, setBusquedaDni] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() =>
    cita?.fechaHora ? toDateInputValue(new Date(cita.fechaHora)) : toDateInputValue(),
  )
  const [slotSeleccionado, setSlotSeleccionado] = useState(null)

  const [form, setForm] = useState({
    medicoId: cita?.medicoId?.toString() || '',
    motivo: cita?.motivo || '',
    notas: cita?.notas || '',
    confirmar: true,
  })

  const { data: medicosData } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => getMedicos(),
  })
  const medicos = medicosData?.data || []

  const { data: agendaData, isLoading: loadingAgenda } = useQuery({
    queryKey: ['agenda', form.medicoId, 'config'],
    queryFn: () => getAgendaMedico(form.medicoId),
    enabled: !!form.medicoId,
  })

  const agenda = agendaData?.data || agendaData
  const horariosActivos = useMemo(
    () => (agenda?.horarios || []).filter((h) => h.activo),
    [agenda],
  )
  const sinHorarios = !!form.medicoId && !loadingAgenda && horariosActivos.length === 0

  const diasAtencion = useMemo(
    () => [...new Set(horariosActivos.map((h) => h.diaSemana))].sort((a, b) => a - b),
    [horariosActivos],
  )

  const { data: dispData, isLoading: loadingSlots } = useQuery({
    queryKey: ['agenda', form.medicoId, 'disp', fechaSeleccionada, cita?.id],
    queryFn: () =>
      getDisponibilidadAgenda(form.medicoId, fechaSeleccionada, cita?.id),
    enabled: !!form.medicoId && !!fechaSeleccionada && !sinHorarios,
  })

  const disponibilidad = dispData?.data || dispData
  const slots = disponibilidad?.slots || []

  const { data: pacientesBusqueda } = useQuery({
    queryKey: ['pacientes', 'dni-cita', busquedaDni],
    queryFn: () => searchPacientes({ dni: busquedaDni }),
    enabled: busquedaDni.length >= 6 && !pacienteSeleccionado,
  })

  const pacientesEncontrados =
    pacientesBusqueda?.data?.data || pacientesBusqueda?.data || []

  const notif = getTipoNotificacion(pacienteSeleccionado?.email)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pacienteSeleccionado?.id && !isEdit) {
        throw new Error('Seleccioná un paciente')
      }
      if (!slotSeleccionado?.disponible) {
        throw new Error('Seleccioná un horario disponible')
      }

      const payload = {
        pacienteId: isEdit ? cita.pacienteId : pacienteSeleccionado.id,
        medicoId: parseInt(form.medicoId, 10),
        fechaHora: slotSeleccionado.fechaHora,
        duracionMinutos: slotSeleccionado.slotMinutos,
        motivo: form.motivo || undefined,
        notas: form.notas || undefined,
        confirmar: form.confirmar,
      }

      if (isEdit) {
        return updateCita(cita.id, {
          medicoId: payload.medicoId,
          fechaHora: payload.fechaHora,
          duracionMinutos: payload.duracionMinutos,
          motivo: payload.motivo,
          notas: payload.notas,
        })
      }
      return createCita(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Turno actualizado' : 'Turno agendado')
      onSuccess()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Error al guardar')
    },
  })

  useEffect(() => {
    if (cita?.paciente) setPacienteSeleccionado(cita.paciente)
  }, [cita])

  useEffect(() => {
    if (!slots.length) return

    if (cita?.fechaHora) {
      const citaTime = new Date(cita.fechaHora).getTime()
      const match = slots.find(
        (s) => new Date(s.fechaHora).getTime() === citaTime,
      )
      if (match) {
        setSlotSeleccionado(match)
        return
      }
    }

    if (!slotSeleccionado) {
      const first = slots.find((s) => s.disponible)
      if (first) setSlotSeleccionado(first)
    }
  }, [slots, cita?.fechaHora])

  const handleMedicoChange = (medicoId) => {
    setForm((prev) => ({ ...prev, medicoId }))
    setFechaSeleccionada(toDateInputValue())
    setSlotSeleccionado(null)
  }

  const mensajeHorarios = () => {
    if (!form.medicoId || loadingAgenda) return null
    if (sinHorarios) {
      return (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Este médico no tiene días y horarios designados. Configuralos en la sección
          &quot;Horarios y bloqueos por profesional&quot; de la agenda.
        </div>
      )
    }
    return (
      <p className="text-sm text-gray-600">
        Atiende: <span className="font-medium capitalize">{formatDiasAtencion(diasAtencion)}</span>
      </p>
    )
  }

  const mensajeFecha = () => {
    if (!disponibilidad || loadingSlots) return null
    if (disponibilidad.bloqueado) {
      return (
        <p className="text-sm text-red-600">
          Este día está bloqueado y el médico no atiende.
        </p>
      )
    }
    if (!disponibilidad.diaAtiende) {
      return (
        <p className="text-sm text-amber-700">
          El médico no atiende este día. Elegí un{' '}
          <span className="capitalize">{formatDiasAtencion(diasAtencion)}</span>.
        </p>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEdit ? 'Editar turno' : 'Nuevo turno'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="p-6 space-y-4"
        >
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente (DNI)</label>
              {pacienteSeleccionado ? (
                <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                    </p>
                    <p className="text-sm text-gray-600">DNI: {pacienteSeleccionado.dni}</p>
                    {pacienteSeleccionado.email && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {pacienteSeleccionado.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-sm text-primary-600"
                    onClick={() => setPacienteSeleccionado(null)}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Buscar por DNI (mín. 6 caracteres)"
                    value={busquedaDni}
                    onChange={(e) => setBusquedaDni(e.target.value)}
                  />
                  {pacientesEncontrados.length > 0 && (
                    <ul className="mt-2 border rounded-lg divide-y max-h-32 overflow-y-auto">
                      {pacientesEncontrados.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setPacienteSeleccionado(p)
                              setBusquedaDni('')
                            }}
                          >
                            {p.apellido}, {p.nombre} — DNI {p.dni}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="mt-2 text-sm text-primary-600"
                    onClick={() => setShowNuevoPaciente(true)}
                  >
                    + Crear paciente nuevo
                  </button>
                </>
              )}
            </div>
          )}

          {pacienteSeleccionado && !isEdit && (
            <div className={`p-3 rounded-lg border text-sm ${notif.color}`}>
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {notif.mensaje}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Médico *</label>
            <select
              className="input w-full"
              value={form.medicoId}
              onChange={(e) => handleMedicoChange(e.target.value)}
              required
              disabled={isEdit && cita?.estado === 'CHECKIN'}
            >
              <option value="">Seleccionar médico</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  Dr. {m.usuario?.nombre} {m.usuario?.apellido}
                  {m.especialidad ? ` — ${m.especialidad}` : ''}
                </option>
              ))}
            </select>
            {form.medicoId && <div className="mt-2">{mensajeHorarios()}</div>}
          </div>

          {form.medicoId && !sinHorarios && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={fechaSeleccionada}
                  min={toDateInputValue()}
                  onChange={(e) => {
                    setFechaSeleccionada(e.target.value)
                    setSlotSeleccionado(null)
                  }}
                  required
                />
                {mensajeFecha()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Horario *
                </label>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-500" />
                    Disponible
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-400" />
                    Ocupado
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                    Pasado
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center border rounded-lg">
                    {disponibilidad?.bloqueado || !disponibilidad?.diaAtiende
                      ? 'No hay horarios para esta fecha'
                      : 'No hay turnos disponibles este día'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {slots.map((slot) => {
                      const selected = slotSeleccionado?.fechaHora === slot.fechaHora
                      let classes =
                        'px-3 py-2 rounded-lg text-sm font-medium border transition'

                      if (slot.disponible) {
                        classes += selected
                          ? ' bg-green-600 text-white border-green-700 ring-2 ring-green-300'
                          : ' bg-green-100 text-green-800 border-green-500 hover:bg-green-200'
                      } else if (slot.ocupado) {
                        classes += ' bg-red-100 text-red-700 border-red-300 cursor-not-allowed opacity-80'
                      } else {
                        classes += ' bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                      }

                      return (
                        <button
                          key={slot.fechaHora}
                          type="button"
                          disabled={!slot.disponible}
                          className={classes}
                          onClick={() => setSlotSeleccionado(slot)}
                          title={
                            slot.disponible
                              ? `Disponible (${slot.slotMinutos} min)`
                              : slot.ocupado
                                ? 'Ocupado'
                                : 'Horario pasado'
                          }
                        >
                          {slot.hora}
                        </button>
                      )
                    })}
                  </div>
                )}

                {slotSeleccionado?.disponible && (
                  <p className="text-sm text-gray-600 mt-2">
                    Seleccionado:{' '}
                    <span className="font-medium">
                      {formatFechaHora24(slotSeleccionado.fechaHora)}
                    </span>{' '}
                    ({slotSeleccionado.slotMinutos} min)
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              className="input w-full"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              className="input w-full"
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </div>

          {!isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.confirmar}
                onChange={(e) => setForm({ ...form, confirmar: e.target.checked })}
              />
              Confirmar y enviar notificaciones al paciente
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                mutation.isPending ||
                sinHorarios ||
                !slotSeleccionado?.disponible
              }
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agendar turno'}
            </button>
          </div>
        </form>
      </div>

      {showNuevoPaciente && (
        <PacienteForm
          onClose={() => setShowNuevoPaciente(false)}
          onCreateAndSend={(nuevo) => {
            const p = nuevo?.data?.data || nuevo?.data || nuevo
            setPacienteSeleccionado(p)
            setShowNuevoPaciente(false)
          }}
          onSuccess={() => setShowNuevoPaciente(false)}
        />
      )}
    </div>
  )
}
