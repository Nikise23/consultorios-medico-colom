import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, User, UserPlus, X, Stethoscope, Shield, Edit, Lock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsuarios, createUsuario, updateUsuario, adminChangePassword, deleteUsuario } from '../services/api'

export default function GestionUsuarios() {
  const [showForm, setShowForm] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordToChange, setPasswordToChange] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rol: 'SECRETARIA',
    nombre: '',
    apellido: '',
    matricula: '',
    especialidad: '',
    activo: true,
  })

  const queryClient = useQueryClient()

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => getUsuarios(),
  })

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios'])
      setShowForm(false)
      setEditingUsuario(null)
      setFormData({
        email: '',
        password: '',
        rol: 'SECRETARIA',
        nombre: '',
        apellido: '',
        matricula: '',
        especialidad: '',
        activo: true,
      })
      toast.success('Usuario creado exitosamente')
    },
    onError: (error) => {
      console.error('Error completo:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.message || 
                          (Array.isArray(error.response?.data?.message) 
                            ? error.response.data.message.join(', ') 
                            : error.response?.data?.error || 'Error al crear el usuario')
      toast.error(errorMessage)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios'])
      setShowForm(false)
      setEditingUsuario(null)
      setFormData({
        email: '',
        password: '',
        rol: 'SECRETARIA',
        nombre: '',
        apellido: '',
        matricula: '',
        especialidad: '',
        activo: true,
      })
      toast.success('Usuario actualizado exitosamente')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el usuario')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) => adminChangePassword(userId, { newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios'])
      setShowChangePassword(false)
      setEditingUsuario(null)
      setPasswordToChange('')
      toast.success('Contraseña actualizada exitosamente')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios'])
      toast.success('Usuario eliminado exitosamente')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el usuario')
    },
  })

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      email: usuario.email,
      password: '', // No mostrar contraseña
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      matricula: usuario.medico?.matricula || '',
      especialidad: usuario.medico?.especialidad || '',
      activo: usuario.activo,
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validar campos requeridos
    if (!formData.email || !formData.nombre || !formData.apellido) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    // Si es creación, validar contraseña
    if (!editingUsuario && !formData.password) {
      toast.error('La contraseña es requerida para crear un usuario')
      return
    }

    // Si es médico, validar matrícula y especialidad
    if (formData.rol === 'MEDICO') {
      if (!formData.matricula || !formData.especialidad) {
        toast.error('Los médicos deben tener matrícula y especialidad')
        return
      }
    }

    // Preparar datos para enviar
    const dataToSend = {
      email: formData.email.trim(),
      rol: formData.rol,
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
    }

    // Solo agregar contraseña si se está creando o si se está editando y se proporcionó una nueva
    if (!editingUsuario) {
      dataToSend.password = formData.password
    } else if (editingUsuario && formData.password && formData.password.trim()) {
      // Si se está editando y se proporcionó una nueva contraseña, incluirla
      dataToSend.password = formData.password
    }

    // Solo agregar matrícula y especialidad si es médico y tienen valor
    if (formData.rol === 'MEDICO') {
      const matriculaTrimmed = formData.matricula?.trim()
      const especialidadTrimmed = formData.especialidad?.trim()
      
      if (matriculaTrimmed) {
        dataToSend.matricula = matriculaTrimmed
      }
      if (especialidadTrimmed) {
        dataToSend.especialidad = especialidadTrimmed
      }
    }

    console.log('Enviando datos:', dataToSend)

    if (editingUsuario) {
      updateMutation.mutate({ id: editingUsuario.id, data: dataToSend })
    } else {
      createMutation.mutate(dataToSend)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingUsuario(null)
    setFormData({
      email: '',
      password: '',
      rol: 'SECRETARIA',
      nombre: '',
      apellido: '',
      matricula: '',
      especialidad: '',
      activo: true,
    })
  }

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'MEDICO':
        return <Stethoscope className="w-5 h-5 text-blue-500" />
      case 'ADMINISTRADOR':
        return <Shield className="w-5 h-5 text-purple-500" />
      case 'SECRETARIA':
        return <User className="w-5 h-5 text-green-500" />
      default:
        return <User className="w-5 h-5 text-gray-500" />
    }
  }

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'MEDICO':
        return 'Médico'
      case 'ADMINISTRADOR':
        return 'Administrador'
      case 'SECRETARIA':
        return 'Secretaria'
      default:
        return rol
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Crea y gestiona usuarios del sistema
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Lista de usuarios */}
      {isLoading ? (
        <div className="card text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      ) : usuarios?.data?.length > 0 ? (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Usuarios Registrados</h2>
          <div className="space-y-3">
            {usuarios.data.map((usuario) => (
              <div
                key={usuario.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getRolIcon(usuario.rol)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <p className="text-sm text-gray-500">{usuario.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {getRolLabel(usuario.rol)}
                        </span>
                        {usuario.medico && (
                          <>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              Mat: {usuario.medico.matricula}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {usuario.medico.especialidad}
                            </span>
                          </>
                        )}
                        {!usuario.activo && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="btn btn-secondary text-sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsuario(usuario)
                        setShowChangePassword(true)
                        setPasswordToChange('')
                      }}
                      className="btn btn-secondary text-sm"
                      title="Cambiar contraseña"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de que deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`)) {
                          deleteMutation.mutate(usuario.id)
                        }
                      }}
                      className="btn btn-danger text-sm"
                      title="Eliminar usuario"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-500">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No hay usuarios registrados</p>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              {!editingUsuario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="input"
                >
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="MEDICO">Médico</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="input"
                />
              </div>

              {formData.rol === 'MEDICO' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matrícula *
                    </label>
                    <input
                      type="text"
                      required={formData.rol === 'MEDICO'}
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      className="input"
                      placeholder="Ej: 12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidad *
                    </label>
                    <input
                      type="text"
                      required={formData.rol === 'MEDICO'}
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      className="input"
                      placeholder="Ej: Clínica Médica, Cardiología, etc."
                    />
                  </div>
                </>
              )}

              {editingUsuario && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      placeholder="Dejar vacío para no cambiar"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El administrador puede cambiar la contraseña sin conocer la actual
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={formData.activo ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                      className="input"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {editingUsuario
                    ? (updateMutation.isPending ? 'Actualizando...' : 'Actualizar Usuario')
                    : (createMutation.isPending ? 'Creando...' : 'Crear Usuario')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cambiar contraseña */}
      {showChangePassword && editingUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Cambiar Contraseña - {editingUsuario.nombre} {editingUsuario.apellido}
              </h2>
              <button
                onClick={() => {
                  setShowChangePassword(false)
                  setEditingUsuario(null)
                  setPasswordToChange('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!passwordToChange || passwordToChange.length < 6) {
                  toast.error('La contraseña debe tener al menos 6 caracteres')
                  return
                }
                changePasswordMutation.mutate({
                  userId: editingUsuario.id,
                  newPassword: passwordToChange,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordToChange}
                  onChange={(e) => setPasswordToChange(e.target.value)}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El administrador puede cambiar la contraseña sin conocer la actual
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false)
                    setEditingUsuario(null)
                    setPasswordToChange('')
                  }}
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
          </div>
        </div>
      )}
    </div>
  )
}

