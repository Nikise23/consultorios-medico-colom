import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, LayoutDashboard, Users, Stethoscope, FileText, DollarSign, UserPlus, UserCircle } from 'lucide-react'
import PerfilUsuario from './PerfilUsuario'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showPerfil, setShowPerfil] = useState(false)

  const isActive = (path) => location.pathname === path

  const getRoleName = (rol) => {
    const roles = {
      ADMINISTRADOR: 'Administrador',
      SECRETARIA: 'Secretaria',
      MEDICO: 'Médico',
    }
    return roles[rol] || rol
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-primary-600 whitespace-nowrap">
                  Historias Clínicas
                </h1>
              </div>
              <div className="hidden sm:ml-3 sm:flex sm:space-x-2 lg:space-x-3 overflow-x-auto">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    isActive('/dashboard')
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                {(user?.rol === 'SECRETARIA' || user?.rol === 'ADMINISTRADOR') && (
                  <>
                    <Link
                      to="/secretaria"
                      className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                        isActive('/secretaria')
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Secretaria</span>
                    </Link>
                    <Link
                      to="/pagos"
                      className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                        isActive('/pagos')
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Pagos</span>
                    </Link>
                  </>
                )}

                {user?.rol === 'MEDICO' && (
                  <Link
                    to="/medico"
                    className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isActive('/medico')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Médico</span>
                  </Link>
                )}

                {(user?.rol === 'MEDICO' || user?.rol === 'ADMINISTRADOR') && (
                  <Link
                    to="/historias-clinicas"
                    className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isActive('/historias-clinicas')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Historias</span>
                  </Link>
                )}

                {(user?.rol === 'MEDICO' || user?.rol === 'ADMINISTRADOR' || user?.rol === 'SECRETARIA') && (
                  <Link
                    to="/reportes-pagos"
                    className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isActive('/reportes-pagos')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Reportes</span>
                  </Link>
                )}

                {user?.rol === 'ADMINISTRADOR' && (
                  <Link
                    to="/usuarios"
                    className={`inline-flex items-center px-1.5 sm:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isActive('/usuarios')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Usuarios</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className="text-xs sm:text-sm text-gray-700 hidden lg:block">
                <span className="font-medium">{user?.nombre} {user?.apellido}</span>
                <span className="text-gray-500 ml-1">({getRoleName(user?.rol)})</span>
              </div>
              <button
                onClick={() => setShowPerfil(true)}
                className="inline-flex items-center px-1.5 sm:px-2 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 hover:text-gray-900 focus:outline-none transition"
                title="Mi Perfil"
              >
                <UserCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">Perfil</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-1.5 sm:px-2 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 hover:text-gray-900 focus:outline-none transition"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 xl:px-12 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-gray-300 mt-auto w-full shadow-sm z-10">
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
            <div>
              <p className="text-primary-600 font-medium text-center sm:text-left">Consultorios Médicos Dres. Colom</p>
            </div>
            <div>
              <p className="text-gray-500 text-center sm:text-right">
                Desarrollado por <span className="font-semibold text-primary-600">Nicolas Fernandez</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Perfil */}
      {showPerfil && (
        <PerfilUsuario onClose={() => setShowPerfil(false)} />
      )}
    </div>
  )
}


