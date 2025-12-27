import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, User, Lock, Save, Palette, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { updateProfile, changePassword } from '../services/api'

export default function PerfilUsuario({ onClose }) {
  const { user, setUser } = useAuth()
  const { theme, themes, changeTheme, setCustomTheme, applyThemePreview } = useTheme()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('perfil')
  const [showCustomTheme, setShowCustomTheme] = useState(false)
  const [selectedPredefinedTheme, setSelectedPredefinedTheme] = useState(null) // Tema predefinido seleccionado pero no aplicado
  
  // Cargar tema personalizado guardado o usar valores por defecto (Boca)
  const loadCustomTheme = () => {
    const savedCustomTheme = localStorage.getItem('customTheme')
    if (savedCustomTheme) {
      try {
        const customData = JSON.parse(savedCustomTheme)
        return customData
      } catch (e) {
        return { color1: '#0ea5e9', color2: '#fbbf24', name: 'Boca' }
      }
    }
    return { color1: '#0ea5e9', color2: '#fbbf24', name: 'Boca' }
  }
  
  const [customColors, setCustomColors] = useState(loadCustomTheme)
  
  // Mostrar formulario personalizado si el tema actual es personalizado
  useEffect(() => {
    if (typeof theme === 'object' && theme.type === 'custom') {
      setShowCustomTheme(true)
      setCustomColors(theme.data)
      setSelectedPredefinedTheme(null) // Limpiar selección predefinida
    } else if (typeof theme === 'string') {
      setSelectedPredefinedTheme(theme) // Sincronizar con tema actual
      setShowCustomTheme(false)
    }
  }, [theme])
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['usuarios', 'profile'])
      // Manejar estructura anidada de axios
      const usuarioData = response?.data?.data || response?.data || response
      // Actualizar el usuario en el contexto
      setUser({
        ...user,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        email: usuarioData.email,
      })
      // Actualizar localStorage
      const userData = { ...user, nombre: usuarioData.nombre, apellido: usuarioData.apellido, email: usuarioData.email }
      localStorage.setItem('user', JSON.stringify(userData))
      toast.success('Perfil actualizado exitosamente')
      setProfileData({
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        email: usuarioData.email,
      })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña')
    },
  })

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileData)
  }

  const handleChangePassword = (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Mi Perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'perfil'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Datos Personales
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Cambiar Contraseña
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'theme'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="w-4 h-4 inline mr-2" />
              Personalización
            </button>
          </div>

          {/* Tab: Perfil */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.nombre}
                  onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.apellido}
                  onChange={(e) => setProfileData({ ...profileData, apellido: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Tab: Cambiar Contraseña */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input"
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* Tab: Personalización */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tema del Panel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Elige un color predefinido o crea tu propio tema combinando dos colores.
                </p>
              </div>

              {/* Botón para crear tema personalizado */}
              <div className="mb-4">
                <button
                  onClick={() => setShowCustomTheme(!showCustomTheme)}
                  className="w-full p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-primary-700">
                    {showCustomTheme ? 'Ocultar' : 'Crear Tema Personalizado'}
                  </span>
                </button>
              </div>

              {/* Formulario de tema personalizado */}
              {showCustomTheme && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  <h4 className="font-semibold text-gray-900">Combinar Colores</h4>
                  <p className="text-sm text-gray-600">
                    Selecciona dos colores para crear tu tema personalizado. Por ejemplo: Azul y Amarillo para Boca.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Primario (Botones, Enlaces)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={customColors.color1}
                          onChange={(e) => {
                            const newColors = { ...customColors, color1: e.target.value }
                            setCustomColors(newColors)
                            // Aplicar vista previa del tema personalizado
                            applyThemePreview({ type: 'custom', data: newColors })
                          }}
                          className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customColors.color1}
                          onChange={(e) => {
                            const newColors = { ...customColors, color1: e.target.value }
                            setCustomColors(newColors)
                            // Aplicar vista previa del tema personalizado
                            applyThemePreview({ type: 'custom', data: newColors })
                          }}
                          className="flex-1 input text-sm font-mono"
                          placeholder="#0ea5e9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Secundario (Fondos, Acentos)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={customColors.color2}
                          onChange={(e) => {
                            const newColors = { ...customColors, color2: e.target.value }
                            setCustomColors(newColors)
                            // Aplicar vista previa del tema personalizado
                            applyThemePreview({ type: 'custom', data: newColors })
                          }}
                          className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customColors.color2}
                          onChange={(e) => {
                            const newColors = { ...customColors, color2: e.target.value }
                            setCustomColors(newColors)
                            // Aplicar vista previa del tema personalizado
                            if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                              applyThemePreview({ type: 'custom', data: newColors })
                            }
                          }}
                          className="flex-1 input text-sm font-mono"
                          placeholder="#fbbf24"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Tema (opcional)
                    </label>
                    <input
                      type="text"
                      value={customColors.name}
                      onChange={(e) => setCustomColors({ ...customColors, name: e.target.value })}
                      className="input"
                      placeholder="Ej: Boca, Personalizado, etc."
                    />
                  </div>

                  {/* Vista previa */}
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Vista Previa:</p>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-lg shadow-md"
                        style={{ 
                          background: `linear-gradient(135deg, ${customColors.color1} 0%, ${customColors.color2} 100%)`
                        }}
                      />
                      <div className="flex-1">
                        <button
                          style={{ backgroundColor: customColors.color1 }}
                          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                        >
                          Botón Primario
                        </button>
                        <div
                          className="mt-2 p-3 rounded-lg border"
                          style={{ 
                            backgroundColor: customColors.color2 + '40',
                            borderColor: customColors.color2
                          }}
                        >
                          <p className="text-xs text-gray-700">Fondo Secundario</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await setCustomTheme(customColors.color1, customColors.color2, customColors.name || 'Personalizado')
                      toast.success(`Tema personalizado "${customColors.name || 'Personalizado'}" aplicado`)
                    }}
                    className="btn btn-primary w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Aplicar Tema Personalizado
                  </button>
                </div>
              )}

              {/* Temas predefinidos */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Temas Predefinidos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto mb-4">
                  {Object.entries(themes).map(([key, themeData]) => {
                    const isSelected = selectedPredefinedTheme === key
                    const isActive = typeof theme === 'string' && theme === key
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedPredefinedTheme(key)
                          setShowCustomTheme(false) // Ocultar tema personalizado si se selecciona uno predefinido
                          // Aplicar vista previa del tema seleccionado
                          applyThemePreview(key)
                        }}
                        className={`relative p-4 border-2 rounded-lg transition-all hover:scale-105 ${
                          isSelected || isActive
                            ? 'border-primary-600 ring-2 ring-primary-200 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className="w-16 h-16 rounded-full shadow-md"
                            style={{ backgroundColor: themeData.primary[500] }}
                          />
                          <span className={`font-medium text-sm ${
                            isSelected || isActive ? 'text-primary-700' : 'text-gray-700'
                          }`}>
                            {themeData.name}
                          </span>
                          {isActive && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                
                {/* Botón para aplicar tema predefinido seleccionado */}
                {selectedPredefinedTheme && (
                  <button
                    onClick={async () => {
                      try {
                        await changeTheme(selectedPredefinedTheme)
                        toast.success(`Tema "${themes[selectedPredefinedTheme]?.name}" aplicado correctamente`)
                      } catch (error) {
                        console.error('Error al aplicar tema:', error)
                        toast.error('Error al aplicar el tema. Por favor, intenta nuevamente.')
                      }
                    }}
                    className="btn btn-primary w-full mb-4"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Aplicar Tema Predefinido: {themes[selectedPredefinedTheme]?.name}
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    // Restaurar el tema original antes de cerrar (si no se aplicó ningún cambio)
                    if (typeof theme === 'string') {
                      applyThemePreview(theme)
                    } else if (typeof theme === 'object' && theme.type === 'custom') {
                      applyThemePreview(theme)
                    }
                    onClose()
                  }}
                  className="btn btn-primary w-full"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

