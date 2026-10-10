import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users, Stethoscope, FileText, DollarSign, Calendar, Download, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { descargarBackup } from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [backupLoading, setBackupLoading] = useState(false)

  const handleBackup = async () => {
    if (backupLoading) return
    const ok = window.confirm(
      'Se descargará un archivo con todos los datos del sistema (pacientes, historias, turnos, pagos, usuarios). Guardalo en un lugar seguro. ¿Continuar?',
    )
    if (!ok) return

    setBackupLoading(true)
    try {
      const response = await descargarBackup()
      const disposition = response.headers['content-disposition'] || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename =
        match?.[1] || `backup-consultorios-colom-${new Date().toISOString().slice(0, 10)}.json`
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Backup descargado correctamente')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'No se pudo generar el backup')
    } finally {
      setBackupLoading(false)
    }
  }

  const getRoleName = (rol) => {
    const roles = {
      ADMINISTRADOR: 'Administrador',
      SECRETARIA: 'Secretaria',
      MEDICO: 'Médico',
    }
    return roles[rol] || rol
  }

  const getRoleDescription = (rol) => {
    const descriptions = {
      ADMINISTRADOR: 'Tienes acceso completo al sistema',
      SECRETARIA: 'Gestiona pacientes, turnos y sala de espera',
      MEDICO: 'Atiende pacientes y crea historias clínicas',
    }
    return descriptions[rol] || ''
  }

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Bienvenido, {user?.nombre} {user?.apellido}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          {getRoleDescription(user?.rol)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(user?.rol === 'SECRETARIA' || user?.rol === 'ADMINISTRADOR') && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Panel Secretaria
                </h3>
                <p className="text-sm text-gray-500">
                  Gestiona pacientes y sala de espera
                </p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/secretaria"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Ir al panel →
              </a>
            </div>
          </div>
        )}

        {(user?.rol === 'SECRETARIA' ||
          user?.rol === 'ADMINISTRADOR' ||
          (user?.rol === 'MEDICO' && user?.medico?.usaAgenda)) && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">Agenda de Citas</h3>
                <p className="text-sm text-gray-500">
                  {user?.rol === 'MEDICO'
                    ? 'Tus turnos y bloqueos de agenda'
                    : 'Turnos, bloqueos y envío a sala de espera'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/agenda"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Ir a la agenda →
              </Link>
            </div>
          </div>
        )}

        {(user?.rol === 'MEDICO' || user?.rol === 'ADMINISTRADOR') && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Panel Médico
                </h3>
                <p className="text-sm text-gray-500">
                  Atiende pacientes en espera
                </p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/medico"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Ir al panel →
              </a>
            </div>
          </div>
        )}

        {(user?.rol === 'MEDICO' || user?.rol === 'ADMINISTRADOR') && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Historias Clínicas
                </h3>
                <p className="text-sm text-gray-500">
                  Consulta historial de pacientes
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/historias-clinicas"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Ver historias →
              </Link>
            </div>
          </div>
        )}

        {(user?.rol === 'MEDICO' || user?.rol === 'ADMINISTRADOR') && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Reportes de Pagos
                </h3>
                <p className="text-sm text-gray-500">
                  Consulta ingresos y estadísticas
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/reportes-pagos"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Ver reportes →
              </Link>
            </div>
          </div>
        )}

        {user?.rol === 'ADMINISTRADOR' && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-violet-100 rounded-lg p-3">
                <UserPlus className="w-6 h-6 text-violet-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Usuarios</h3>
                <p className="text-sm text-gray-500">
                  Alta y gestión de cuentas del sistema
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/usuarios"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Ir a usuarios →
              </Link>
            </div>
          </div>
        )}

        {user?.rol === 'ADMINISTRADOR' && (
          <div className="card hover:shadow-lg transition-shadow border border-amber-200 bg-amber-50/40">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-lg p-3">
                <Download className="w-6 h-6 text-amber-700" />
              </div>
              <div className="ml-4 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">
                  Backup del sistema
                </h3>
                <p className="text-sm text-gray-500">
                  Descarga un respaldo JSON de todos los datos
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBackup}
                disabled={backupLoading}
                className="text-amber-800 hover:text-amber-900 font-medium text-sm disabled:opacity-60"
              >
                {backupLoading ? 'Generando backup…' : 'Descargar backup →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información del Sistema
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Rol:</span> {getRoleName(user?.rol)}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user?.email}
          </p>
        </div>
      </div>
    </div>
  )
}


