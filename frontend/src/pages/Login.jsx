import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      toast.success('Inicio de sesión exitoso')
      navigate('/dashboard')
    } else {
      toast.error(result.error || 'Error al iniciar sesión')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            {/* Símbolo C con cruz médica */}
            <div className="relative mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 sm:border-[5px] border-primary-700 flex items-center justify-center bg-white shadow-lg">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  {/* Letra C estilizada */}
                  <svg className="w-full h-full text-primary-700" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Círculo exterior para la C */}
                    <path d="M20 32C20 24.268 26.268 18 34 18C41.732 18 48 24.268 48 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"/>
                    {/* Cruz médica en el centro */}
                    <line x1="34" y1="24" x2="34" y2="40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <line x1="26" y1="32" x2="42" y2="32" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Texto del logo */}
            <div className="text-center space-y-1">
              <p className="text-primary-600 text-sm font-normal tracking-wide">
                Consultorios médicos
              </p>
              <h1 className="text-primary-700 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Dres. Colom
              </h1>
              <p className="text-primary-600 text-sm italic">
                Desde 1958
              </p>
            </div>
          </div>
          
          <h2 className="mt-6 text-center text-xl sm:text-2xl font-semibold text-gray-700">
            Sistema de Historias Clínicas
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
            Inicia sesión para continuar
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Ingrese su email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647A7.962 7.962 0 0112 20a7.962 7.962 0 01-8-8h4z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-gray-300 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
    </div>
  )
}




