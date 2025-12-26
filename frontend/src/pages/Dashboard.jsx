import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, Stethoscope, FileText, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()

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
      SECRETARIA: 'Gestiona pacientes y envía a sala de espera',
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


