import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SecretariaPanel from './pages/SecretariaPanel'
import MedicoPanel from './pages/MedicoPanel'
import HistoriasClinicas from './pages/HistoriasClinicas'
import PagosPanel from './pages/PagosPanel'
import ReportesPagos from './pages/ReportesPagos'
import GestionUsuarios from './pages/GestionUsuarios'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  if (!allowedRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route
          path="secretaria"
          element={
            <RoleRoute allowedRoles={['SECRETARIA', 'ADMINISTRADOR']}>
              <SecretariaPanel />
            </RoleRoute>
          }
        />
        
        <Route
          path="pagos"
          element={
            <RoleRoute allowedRoles={['SECRETARIA', 'ADMINISTRADOR']}>
              <PagosPanel />
            </RoleRoute>
          }
        />
        
        <Route
          path="medico"
          element={
            <RoleRoute allowedRoles={['MEDICO', 'ADMINISTRADOR']}>
              <MedicoPanel />
            </RoleRoute>
          }
        />
        
        <Route
          path="historias-clinicas"
          element={
            <RoleRoute allowedRoles={['MEDICO', 'ADMINISTRADOR']}>
              <HistoriasClinicas />
            </RoleRoute>
          }
        />
        
        <Route
          path="reportes-pagos"
          element={
            <RoleRoute allowedRoles={['MEDICO', 'ADMINISTRADOR', 'SECRETARIA']}>
              <ReportesPagos />
            </RoleRoute>
          }
        />
        
        <Route
          path="usuarios"
          element={
            <RoleRoute allowedRoles={['ADMINISTRADOR']}>
              <GestionUsuarios />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App


