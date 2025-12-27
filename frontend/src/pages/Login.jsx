import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Mail, Lock } from 'lucide-react'
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
      // Mostrar error más detallado
      const errorMsg = result.error || 'Error al iniciar sesión'
      console.error('Error de login:', errorMsg)
      toast.error(errorMsg, {
        duration: 5000, // Mostrar por 5 segundos
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-primary-50">
      {/* Fondo decorativo - responsive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex-1 flex items-center justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
          {/* Card principal - responsive */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 p-5 sm:p-6 md:p-8">
            {/* Logo mejorado - responsive */}
            <div className="flex flex-col items-center mb-4 sm:mb-5 md:mb-6">
              {/* Símbolo C con cruz médica - responsive */}
              <div className="relative mb-2 sm:mb-3 md:mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-3 sm:border-4 border-primary-700 flex items-center justify-center bg-gradient-to-br from-white to-primary-50 shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
                    {/* Letra C estilizada con dos arcos concéntricos */}
                    <svg className="w-full h-full text-primary-700" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Arco exterior de la C */}
                      <path 
                        d="M 30 50 A 20 20 0 0 1 50 30" 
                        stroke="currentColor" 
                        strokeWidth="6" 
                        strokeLinecap="round" 
                        fill="none"
                        className="opacity-80"
                      />
                      <path 
                        d="M 30 50 A 20 20 0 0 0 50 70" 
                        stroke="currentColor" 
                        strokeWidth="6" 
                        strokeLinecap="round" 
                        fill="none"
                        className="opacity-80"
                      />
                      {/* Arco interior de la C */}
                      <path 
                        d="M 35 50 A 12 12 0 0 1 47 38" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        fill="none"
                      />
                      <path 
                        d="M 35 50 A 12 12 0 0 0 47 62" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        fill="none"
                      />
                      {/* Cruz médica en el centro */}
                      <line x1="50" y1="42" x2="50" y2="58" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                      <line x1="42" y1="50" x2="58" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Texto del logo - responsive */}
              <div className="text-center space-y-0.5 sm:space-y-1">
                <p className="text-primary-600 text-xs sm:text-sm md:text-base font-medium tracking-wide">
                  Consultorios médicos
                </p>
                <h1 className="text-primary-700 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                  Dres. Colom
                </h1>
                <p className="text-primary-600 text-xs sm:text-sm italic font-light">
                  Desde 1958
                </p>
              </div>
            </div>
            
            {/* Título del sistema - responsive */}
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1">
                Sistema de Historias Clínicas
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Inicia sesión para continuar
              </p>
            </div>

            {/* Formulario - responsive */}
            <form className="space-y-3 sm:space-y-4 md:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-3 sm:space-y-4">
                {/* Campo Email */}
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Botón de envío - responsive */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647A7.962 7.962 0 0112 20a7.962 7.962 0 01-8-8h4z"></path>
                      </svg>
                      <span className="text-xs sm:text-sm md:text-base">Iniciando sesión...</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      <span className="text-xs sm:text-sm md:text-base">Iniciar sesión</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer mejorado - responsive */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 w-full shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <div>
              <p className="text-primary-600 font-semibold text-center sm:text-left">
                Consultorios Médicos Dres. Colom
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-center sm:text-right">
                Desarrollado por <span className="font-semibold text-primary-600">Nicolas Fernandez</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Estilos para animación de blob */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}




