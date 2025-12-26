import axios from 'axios'

// Detectar la URL base automáticamente
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Si estamos en el navegador, detectar si estamos en localhost o en la red local
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    
    // Si es localhost o 127.0.0.1, usar el proxy de Vite (funciona bien desde la misma máquina)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api'
    }
    
    // Si es una IP (acceso desde celular u otro dispositivo en la red), conectarse directamente al backend
    // El backend está escuchando en 0.0.0.0:3000, así que es accesible desde la red local
    // Usamos la misma IP pero puerto 3000
    return `${protocol}//${hostname}:3000`
  }
  
  // Fallback (solo para SSR o casos especiales)
  return 'http://localhost:3000'
}

const API_URL = getApiUrl()

// Log para debugging (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 API Config:', {
    API_URL,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
    port: typeof window !== 'undefined' ? window.location.port : 'N/A',
  })
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api




