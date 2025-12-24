import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile, changePassword } from '../services/api'

export default function PerfilUsuario({ onClose }) {
  const { user, setUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('perfil')
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
        </div>
      </div>
    </div>
  )
}

