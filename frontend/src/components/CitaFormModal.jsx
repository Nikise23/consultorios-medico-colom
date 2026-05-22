import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Calendar, Mail, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { createCita, updateCita, searchPacientes, getMedicos } from '../services/api'
import { getTipoNotificacion } from '../utils/citaNotificaciones'
import PacienteForm from './PacienteForm'

export default function CitaFormModal({ cita, onClose, onSuccess }) {
  const isEdit = !!cita
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(cita?.paciente || null)
  const [busquedaDni, setBusquedaDni] = useState('')

  const defaultFecha = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setMinutes(0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  const [form, setForm] = useState({
    medicoId: cita?.medicoId?.toString() || '',
    fechaHora: cita?.fechaHora
      ? new Date(cita.fechaHora).toISOString().slice(0, 16)
      : defaultFecha(),
    duracionMinutos: cita?.duracionMinutos?.toString() || '20',
    motivo: cita?.motivo || '',
    notas: cita?.notas || '',
    confirmar: true,
  })

  const { data: medicosData } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => getMedicos(),
  })
  const medicos = medicosData?.data || []

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
      if (!pacienteSeleccionado?.id) {
        throw new Error('Seleccioná un paciente')
      }
      const payload = {
        pacienteId: pacienteSeleccionado.id,
        medicoId: parseInt(form.medicoId, 10),
        fechaHora: new Date(form.fechaHora).toISOString(),
        duracionMinutos: parseInt(form.duracionMinutos, 10) || 20,
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
              onChange={(e) => setForm({ ...form, medicoId: e.target.value })}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
              <input
                type="datetime-local"
                className="input w-full"
                value={form.fechaHora}
                onChange={(e) => setForm({ ...form, fechaHora: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
              <input
                type="number"
                min={5}
                max={480}
                className="input w-full"
                value={form.duracionMinutos}
                onChange={(e) => setForm({ ...form, duracionMinutos: e.target.value })}
              />
            </div>
          </div>

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
              disabled={mutation.isPending}
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
