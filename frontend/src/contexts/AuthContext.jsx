import { createContext, useContext, useState, useEffect } from 'react'
import api from '../config/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const fullUrl = `${api.defaults.baseURL}/auth/login`
      console.log('🔐 Intentando login:', { 
        email, 
        baseURL: api.defaults.baseURL,
        fullUrl,
        hostname: window.location.hostname,
        origin: window.location.origin
      })
      const response = await api.post('/auth/login', { email, password })
      const { access_token, usuario } = response.data

      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(usuario))
      setUser(usuario)

      return { success: true }
    } catch (error) {
      console.error('Error en login:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        baseURL: api.defaults.baseURL,
        url: error.config?.url,
        fullURL: error.config ? `${api.defaults.baseURL}${error.config.url}` : 'N/A'
      })
      
      // Determinar el mensaje de error más específico
      let errorMessage = 'Error al iniciar sesión'
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión.'
      } else if (error.response?.status === 401) {
        errorMessage = error.response?.data?.message || 'Credenciales inválidas'
      } else if (error.response?.status === 404) {
        errorMessage = 'Servidor no encontrado. Verifica la configuración.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}



