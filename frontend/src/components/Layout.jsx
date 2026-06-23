import { useState, useEffect, useMemo } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LogOut,
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  DollarSign,
  UserPlus,
  UserCircle,
  Calendar,
  Menu,
  X,
} from 'lucide-react'
import PerfilUsuario from './PerfilUsuario'

function NavItem({ to, icon: Icon, label, isActive, onClick, mobile }) {
  const base =
    mobile
      ? 'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition'
      : 'inline-flex items-center px-2 lg:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition'

  const active = mobile
    ? 'bg-primary-50 text-primary-700'
    : 'border-primary-500 text-gray-900'

  const inactive = mobile
    ? 'text-gray-700 hover:bg-gray-50'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${base} ${isActive ? active : inactive}`}
    >
      <Icon className={mobile ? 'w-5 h-5 flex-shrink-0' : 'w-4 h-4 lg:mr-1.5 flex-shrink-0'} />
      <span>{label}</span>
    </Link>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showPerfil, setShowPerfil] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const isActive = (path) => location.pathname === path

  const getRoleName = (rol) => {
    const roles = {
      ADMINISTRADOR: 'Administrador',
      SECRETARIA: 'Secretaria',
      MEDICO: 'Médico',
    }
    return roles[rol] || rol
  }

  const navLinks = useMemo(() => {
    const links = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMINISTRADOR', 'SECRETARIA', 'MEDICO'] },
      { to: '/secretaria', icon: Users, label: 'Secretaria', roles: ['SECRETARIA', 'ADMINISTRADOR'] },
      { to: '/pagos', icon: DollarSign, label: 'Pagos', roles: ['SECRETARIA', 'ADMINISTRADOR'] },
      { to: '/agenda', icon: Calendar, label: 'Agenda', roles: ['SECRETARIA', 'ADMINISTRADOR'], medicoAgenda: true },
      { to: '/medico', icon: Stethoscope, label: 'Médico', roles: ['MEDICO', 'ADMINISTRADOR'] },
      { to: '/historias-clinicas', icon: FileText, label: 'Historias', roles: ['MEDICO', 'ADMINISTRADOR'] },
      { to: '/reportes-pagos', icon: DollarSign, label: 'Reportes', roles: ['MEDICO', 'ADMINISTRADOR', 'SECRETARIA'] },
      { to: '/usuarios', icon: UserPlus, label: 'Usuarios', roles: ['ADMINISTRADOR'] },
    ]
    return links.filter((link) => {
      if (link.medicoAgenda && user?.rol === 'MEDICO') {
        return !!user?.medico?.usaAgenda
      }
      return link.roles.includes(user?.rol)
    })
  }, [user?.rol, user?.medico?.usaAgenda])

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: 'var(--theme-bg-color, #f9fafb)' }}>
      <nav
        className="shadow-sm border-b sticky top-0 z-40"
        style={{
          backgroundColor: 'var(--theme-nav-bg, #ffffff)',
          borderColor: 'var(--theme-nav-border, #e5e7eb)',
        }}
      >
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center min-w-0 flex-1 gap-2">
              <button
                type="button"
                className="lg:hidden p-2 -ml-1 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/dashboard" className="min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-primary-600 truncate">
                  Historias Clínicas
                </h1>
              </Link>

              <div className="hidden lg:flex lg:ml-4 lg:items-center lg:gap-1 xl:gap-2 overflow-x-auto">
                {navLinks.map((link) => (
                  <NavItem
                    key={link.to}
                    {...link}
                    isActive={isActive(link.to)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="text-xs sm:text-sm text-gray-700 hidden md:block max-w-[180px] lg:max-w-none truncate">
                <span className="font-medium">{user?.nombre} {user?.apellido}</span>
                <span className="text-gray-500 ml-1 hidden lg:inline">({getRoleName(user?.rol)})</span>
              </div>
              <button
                onClick={() => setShowPerfil(true)}
                className="inline-flex items-center px-2 py-2 text-xs sm:text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 transition"
                title="Mi Perfil"
              >
                <UserCircle className="w-4 h-4 sm:mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">Perfil</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-2 py-2 text-xs sm:text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 transition"
              >
                <LogOut className="w-4 h-4 sm:mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 top-14 sm:top-16 bg-black/30 lg:hidden z-30"
              onClick={closeMobile}
              aria-hidden
            />
            <div className="lg:hidden absolute left-0 right-0 top-full z-40 bg-white border-b shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              <div className="px-3 py-3 border-b bg-gray-50 md:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-gray-500">{getRoleName(user?.rol)}</p>
              </div>
              <nav className="p-3 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavItem
                    key={link.to}
                    {...link}
                    isActive={isActive(link.to)}
                    onClick={closeMobile}
                    mobile
                  />
                ))}
              </nav>
            </div>
          </>
        )}
      </nav>

      <main className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8 xl:px-12 flex-1 w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t-2 border-gray-300 mt-auto w-full shadow-sm z-10">
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
            <p className="text-primary-600 font-medium text-center sm:text-left">
              Consultorios Médicos Dres. Colom
            </p>
            <p className="text-gray-500 text-center sm:text-right">
              Desarrollado por <span className="font-semibold text-primary-600">Nicolas Fernandez</span>
            </p>
          </div>
        </div>
      </footer>

      {showPerfil && (
        <PerfilUsuario onClose={() => setShowPerfil(false)} />
      )}
    </div>
  )
}
