import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCitas,
  getMedicos,
  confirmarCita,
  cancelarCita,
  marcarCitaNoAsistio,
} from '../services/api'
import CitaFormModal from '../components/CitaFormModal'
import ConfigAgendaMedico from '../components/ConfigAgendaMedico'
import EnviarAEsperaConPago from '../components/EnviarAEsperaConPago'
import CitaCardItem from '../components/CitaCardItem'
import { normalizeApiList } from '../utils/normalizeApiList'

function startOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toISOStart(d) {
  return d.toISOString()
}

function toISOEnd(d) {
  const e = new Date(d)
  e.setHours(23, 59, 59, 999)
  return e.toISOString()
}

const ESTADOS_BUSQUEDA = [
  { value: '', label: 'Todos los estados' },
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'CHECKIN', label: 'En sala de espera' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'NO_ASISTIO', label: 'No asistió' },
  { value: 'COMPLETADA', label: 'Completada' },
]

export default function AgendaCitas() {
  const { user } = useAuth()
  const soloLectura = user?.rol === 'MEDICO'
  const queryClient = useQueryClient()
  const [semanaBase, setSemanaBase] = useState(() => startOfWeek(new Date()))
  const [medicoFiltro, setMedicoFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [citaEdit, setCitaEdit] = useState(null)
  const [citaCheckin, setCitaCheckin] = useState(null)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const [searchDraft, setSearchDraft] = useState({
    busqueda: '',
    medicoId: '',
    estado: '',
    desde: '',
    hasta: '',
  })
  const [appliedSearch, setAppliedSearch] = useState(null)

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const finSemana = addDays(semanaBase, 6)

  const { data: medicosData } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => getMedicos(),
  })
  const medicos = normalizeApiList(medicosData)

  const weekParams = useMemo(
    () => ({
      desde: toISOStart(semanaBase),
      hasta: toISOEnd(finSemana),
      ...(medicoFiltro ? { medicoId: medicoFiltro } : {}),
    }),
    [semanaBase, finSemana, medicoFiltro],
  )

  const { data: citasSemanaData, isLoading: loadingSemana } = useQuery({
    queryKey: ['citas', 'semana', weekParams],
    queryFn: () => getCitas(weekParams),
    enabled: !appliedSearch,
  })

  const { data: citasBusquedaData, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['citas', 'busqueda', appliedSearch],
    queryFn: () => getCitas(appliedSearch),
    enabled: !!appliedSearch,
  })

  const citas = appliedSearch
    ? normalizeApiList(citasBusquedaData)
    : normalizeApiList(citasSemanaData)
  const isLoading = appliedSearch ? loadingBusqueda : loadingSemana

  const citasPorDia = useMemo(() => {
    const map = {}
    for (let i = 0; i < 7; i++) {
      const d = addDays(semanaBase, i)
      const key = d.toISOString().slice(0, 10)
      map[key] = []
    }
    citas.forEach((c) => {
      const key = new Date(c.fechaHora).toISOString().slice(0, 10)
      if (map[key]) map[key].push(c)
    })
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    })
    return map
  }, [citas, semanaBase, appliedSearch])

  const confirmarMutation = useMutation({
    mutationFn: confirmarCita,
    onSuccess: () => {
      toast.success('Turno confirmado y notificaciones enviadas')
      queryClient.invalidateQueries(['citas'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  })

  const cancelarMutation = useMutation({
    mutationFn: cancelarCita,
    onSuccess: () => {
      toast.success('Turno cancelado')
      queryClient.invalidateQueries(['citas'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  })

  const noAsistioMutation = useMutation({
    mutationFn: marcarCitaNoAsistio,
    onSuccess: () => {
      toast.success('Marcado como no asistió')
      queryClient.invalidateQueries(['citas'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  })

  const puedeCheckin = (c) =>
    ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado) && !c.atencionId

  const esHoyOPasado = (fechaHora) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const f = new Date(fechaHora)
    f.setHours(0, 0, 0, 0)
    return f <= hoy
  }

  const refresh = () => {
    queryClient.invalidateQueries(['citas'])
    queryClient.invalidateQueries(['atenciones'])
  }

  const handleBuscar = (e) => {
    e?.preventDefault()
    const t = searchDraft.busqueda.trim()
    if (!t && !searchDraft.medicoId && !searchDraft.estado && !searchDraft.desde && !searchDraft.hasta) {
      toast.error('Ingresá al menos un criterio de búsqueda')
      return
    }
    const params = {}
    if (t) params.busqueda = t
    if (searchDraft.medicoId) params.medicoId = searchDraft.medicoId
    if (searchDraft.estado) params.estado = searchDraft.estado
    if (searchDraft.desde) params.desde = new Date(searchDraft.desde).toISOString()
    if (searchDraft.hasta) {
      const h = new Date(searchDraft.hasta)
      h.setHours(23, 59, 59, 999)
      params.hasta = h.toISOString()
    }
    setAppliedSearch(params)
    setExpandedIds(new Set())
  }

  const limpiarBusqueda = () => {
    setAppliedSearch(null)
    setSearchDraft({
      busqueda: '',
      medicoId: '',
      estado: '',
      desde: '',
      hasta: '',
    })
    setExpandedIds(new Set())
  }

  const citaHandlers = {
    onConfirmar: (id) => confirmarMutation.mutate(id),
    onCheckin: (c) => setCitaCheckin(c),
    onEdit: (c) => {
      setCitaEdit(c)
      setShowForm(true)
    },
    onNoAsistio: (id) => {
      if (window.confirm('¿Marcar como no asistió?')) {
        noAsistioMutation.mutate(id)
      }
    },
    onCancelar: (id) => {
      if (window.confirm('¿Cancelar este turno?')) {
        cancelarMutation.mutate(id)
      }
    },
  }

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary-600" />
            Agenda de Citas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Vista semanal o búsqueda de turnos para editar, cancelar o enviar a sala de espera.
          </p>
        </div>
        {!soloLectura && (
          <button
            type="button"
            onClick={() => {
              setCitaEdit(null)
              setShowForm(true)
            }}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo turno
          </button>
        )}
      </div>

      {!soloLectura && <ConfigAgendaMedico medicos={medicos} />}

      {/* Búsqueda de turnos */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary-600" />
          Buscar turno
        </h2>
        <form onSubmit={handleBuscar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente (DNI, nombre o apellido)
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="Ej: 37863139 o Fernandez"
                value={searchDraft.busqueda}
                onChange={(e) =>
                  setSearchDraft({ ...searchDraft, busqueda: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
              <select
                className="input w-full"
                value={searchDraft.medicoId}
                onChange={(e) =>
                  setSearchDraft({ ...searchDraft, medicoId: e.target.value })
                }
              >
                <option value="">Todos</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.usuario?.nombre} {m.usuario?.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                className="input w-full"
                value={searchDraft.estado}
                onChange={(e) =>
                  setSearchDraft({ ...searchDraft, estado: e.target.value })
                }
              >
                {ESTADOS_BUSQUEDA.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                className="input w-full"
                value={searchDraft.desde}
                onChange={(e) =>
                  setSearchDraft({ ...searchDraft, desde: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                className="input w-full"
                value={searchDraft.hasta}
                onChange={(e) =>
                  setSearchDraft({ ...searchDraft, hasta: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary inline-flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </button>
            {appliedSearch && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                className="btn btn-secondary inline-flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Ver agenda semanal
              </button>
            )}
          </div>
        </form>
      </div>

      {appliedSearch ? (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {isLoading
              ? 'Buscando...'
              : `${citas.length} turno${citas.length === 1 ? '' : 's'} encontrado${citas.length === 1 ? '' : 's'}. Hacé clic en un turno para ver acciones.`}
          </p>
        </div>
      ) : (
        <div className="card mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100"
              onClick={() => setSemanaBase(addDays(semanaBase, -7))}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {semanaBase.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} —{' '}
              {finSemana.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100"
              onClick={() => setSemanaBase(addDays(semanaBase, 7))}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-sm text-primary-600 ml-2"
              onClick={() => setSemanaBase(startOfWeek(new Date()))}
            >
              Hoy
            </button>
          </div>
          {!soloLectura && (
            <select
              className="input max-w-xs"
              value={medicoFiltro}
              onChange={(e) => setMedicoFiltro(e.target.value)}
            >
              <option value="">Todos los médicos</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  Dr. {m.usuario?.nombre} {m.usuario?.apellido}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : appliedSearch ? (
        citas.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron turnos con esos criterios</p>
          </div>
        ) : (
          <ul className="space-y-1.5 max-w-3xl">
            {citas.map((c) => (
              <CitaCardItem
                key={c.id}
                cita={c}
                expanded={expandedIds.has(c.id)}
                onToggle={() => toggleExpanded(c.id)}
                soloLectura={soloLectura}
                puedeCheckin={puedeCheckin}
                esHoyOPasado={esHoyOPasado}
                mostrarFecha
                {...citaHandlers}
              />
            ))}
          </ul>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(citasPorDia).map(([diaKey, citasDia]) => {
            const fecha = new Date(diaKey + 'T12:00:00')
            const esHoy = diaKey === new Date().toISOString().slice(0, 10)
            return (
              <div
                key={diaKey}
                className={`card ${esHoy ? 'ring-2 ring-primary-300' : ''}`}
              >
                <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                  {fecha.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {esHoy && (
                    <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                      Hoy
                    </span>
                  )}
                </h3>
                {citasDia.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Sin turnos</p>
                ) : (
                  <ul className="space-y-1.5">
                    {citasDia.map((c) => (
                      <CitaCardItem
                        key={c.id}
                        cita={c}
                        expanded={expandedIds.has(c.id)}
                        onToggle={() => toggleExpanded(c.id)}
                        soloLectura={soloLectura}
                        puedeCheckin={puedeCheckin}
                        esHoyOPasado={esHoyOPasado}
                        {...citaHandlers}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <CitaFormModal
          cita={citaEdit}
          onClose={() => {
            setShowForm(false)
            setCitaEdit(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setCitaEdit(null)
            refresh()
          }}
        />
      )}

      {citaCheckin && (
        <EnviarAEsperaConPago
          paciente={citaCheckin.paciente}
          medicoIdPreseleccionado={citaCheckin.medicoId}
          citaId={citaCheckin.id}
          onClose={() => setCitaCheckin(null)}
          onSuccess={() => {
            setCitaCheckin(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
