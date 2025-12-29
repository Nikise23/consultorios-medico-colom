import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, FileText, Calendar, User, Stethoscope, Plus, X, ChevronDown, ChevronUp, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { searchHistoriasClinicas, getHistoriasByPaciente, getMedicos, crearNuevaConsulta, createHistoriaClinica, getProfile, searchPacientes } from '../services/api'
import HistoriaClinicaForm from '../components/HistoriaClinicaForm'
import { jsPDF } from 'jspdf'

// Hook para debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function HistoriasClinicas() {
  // Estado para controlar qué especialidades están expandidas
  const [especialidadesExpandidas, setEspecialidadesExpandidas] = useState({})
  const [searchType, setSearchType] = useState('paciente')
  const [searchBy, setSearchBy] = useState('dni') // dni o apellido
  const [searchValue, setSearchValue] = useState('')
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [showNuevaHistoria, setShowNuevaHistoria] = useState(false)
  const [nuevaAtencion, setNuevaAtencion] = useState(null)
  const [showMedicoSelector, setShowMedicoSelector] = useState(false)
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('')
  
  const { user } = useAuth()
  // Para filtros avanzados
  const [dniFiltro, setDniFiltro] = useState('')
  const [apellidoFiltro, setApellidoFiltro] = useState('')
  const [medicoId, setMedicoId] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  
  // Debounce para búsqueda en tiempo real (esperar 500ms después de que el usuario deje de escribir)
  const dniFiltroDebounced = useDebounce(dniFiltro, 500)
  const apellidoFiltroDebounced = useDebounce(apellidoFiltro, 500)
  
  const queryClient = useQueryClient()

  // Obtener lista de médicos para obtener especialidades
  const { data: medicosData } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => getMedicos(),
  })

  // Obtener lista única de especialidades
  const especialidades = useMemo(() => {
    if (!medicosData?.data) return []
    const especialidadesSet = new Set()
    medicosData.data.forEach((medico) => {
      if (medico.especialidad) {
        especialidadesSet.add(medico.especialidad)
      }
    })
    return Array.from(especialidadesSet).sort()
  }, [medicosData?.data])

  // Buscar paciente cuando se ingresa DNI o apellido
  const { data: pacientesData, isLoading: loadingPacientes, error: errorPacientes } = useQuery({
    queryKey: ['pacientes', 'search', searchBy, searchValue],
    queryFn: async () => {
      const params = {}
      if (searchBy === 'dni') {
        params.dni = searchValue.trim()
      } else {
        params.apellido = searchValue.trim()
      }
      console.log('Buscando pacientes con params:', params)
      const result = await searchPacientes(params)
      console.log('Resultado de búsqueda de pacientes:', result)
      console.log('Resultado.data:', result?.data)
      console.log('Resultado.data.data:', result?.data?.data)
      return result
    },
    enabled: searchType === 'paciente' && !!searchValue && searchValue.length >= 2,
  })

  // Seleccionar automáticamente el paciente si hay uno solo
  useEffect(() => {
    if (!pacientesData) return
    
    // Manejar estructura anidada de axios: {data: {data: [...]}}
    const pacientesArray = pacientesData?.data?.data || pacientesData?.data
    console.log('useEffect - pacientesArray:', pacientesArray)
    console.log('useEffect - es array?', Array.isArray(pacientesArray))
    console.log('useEffect - longitud:', pacientesArray?.length)
    console.log('useEffect - selectedPaciente actual:', selectedPaciente)
    
    // Si se encuentra un paciente, seleccionarlo automáticamente
    if (pacientesArray && Array.isArray(pacientesArray) && pacientesArray.length === 1) {
      // Solo seleccionar si no hay un paciente ya seleccionado o si el seleccionado es diferente
      if (!selectedPaciente || selectedPaciente.id !== pacientesArray[0].id) {
        console.log('Seleccionando paciente automáticamente:', pacientesArray[0])
        setSelectedPaciente(pacientesArray[0])
      }
    }
  }, [pacientesData, selectedPaciente])

  // Obtener historias del paciente seleccionado
  const { data: historias, isLoading: loadingHistorias, error: errorHistorias } = useQuery({
    queryKey: ['historias', 'paciente', selectedPaciente?.id],
    queryFn: () => {
      if (selectedPaciente?.id) {
        return getHistoriasByPaciente(selectedPaciente.id)
      }
      return Promise.resolve({ data: [] })
    },
    enabled: !!selectedPaciente?.id,
  })

  // Para búsqueda avanzada - usar valores con debounce para DNI y apellido
  const { data: historiasAvanzadas, isLoading: loadingAvanzadas, error: errorAvanzadas } = useQuery({
    queryKey: ['historias', 'avanzada', dniFiltroDebounced, apellidoFiltroDebounced, medicoId, especialidad, fechaDesde, fechaHasta],
    queryFn: async () => {
      const params = {}
      if (dniFiltroDebounced && dniFiltroDebounced.trim()) params.dni = dniFiltroDebounced.trim()
      if (apellidoFiltroDebounced && apellidoFiltroDebounced.trim()) params.apellido = apellidoFiltroDebounced.trim()
      if (medicoId) params.medicoId = parseInt(medicoId)
      if (especialidad) params.especialidad = especialidad
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta
      
      console.log('🔍 Buscando historias clínicas con parámetros:', params)
      const result = await searchHistoriasClinicas(params)
      console.log('📋 Resultado de búsqueda:', result)
      console.log('📋 Resultado.data:', result?.data)
      console.log('📋 Resultado.data.data:', result?.data?.data)
      
      // Normalizar la respuesta: el backend retorna {data: [...]} y axios lo envuelve en {data: {data: [...]}}
      return result
    },
    enabled: searchType === 'filtros' && (
      (dniFiltroDebounced && dniFiltroDebounced.trim().length > 0) || 
      (apellidoFiltroDebounced && apellidoFiltroDebounced.trim().length > 0) || 
      !!medicoId || 
      !!especialidad || 
      !!fechaDesde || 
      !!fechaHasta
    ),
  })

  // Obtener perfil del usuario para saber si es médico
  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const result = await getProfile()
      console.log('Perfil del usuario completo:', result)
      return result
    },
    enabled: !!user,
  })

  const crearConsultaMutation = useMutation({
    mutationFn: crearNuevaConsulta,
    onSuccess: (data) => {
      setNuevaAtencion(data.data)
      setShowNuevaHistoria(true)
      toast.success('Nueva consulta creada')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear consulta')
    },
  })

  // Ya no necesitamos seleccionar pacientes, se busca directamente

  const handleCrearNuevaHistoria = () => {
    if (!selectedPaciente || !selectedPaciente.id) {
      toast.error('Debes seleccionar un paciente primero')
      return
    }
    
    // Si el usuario es médico, usar su médicoId automáticamente
    if (user?.rol === 'MEDICO') {
      // Obtener el médicoId del perfil
      // La estructura puede ser: userProfile.data.medico.id o userProfile.data.medicoId
      const profileData = userProfile?.data?.data || userProfile?.data || userProfile
      const medicoIdFromProfile = profileData?.medico?.id || profileData?.medicoId
      
      console.log('Buscando médicoId para usuario médico:', {
        userProfile,
        profileData,
        medicoIdFromProfile,
        'profileData.medico': profileData?.medico
      })
      
      if (medicoIdFromProfile) {
        console.log('Creando consulta con médicoId:', medicoIdFromProfile)
        crearConsultaMutation.mutate({
          pacienteId: selectedPaciente.id,
          medicoId: medicoIdFromProfile,
          observaciones: '',
        })
        return
      } else {
        // Si no se encuentra el médicoId, esperar a que se cargue el perfil
        if (!userProfile) {
          toast.error('Cargando información del médico, por favor espera...')
          return
        }
        toast.error('No se pudo obtener la información del médico. Por favor, recarga la página.')
        console.error('No se encontró médicoId en:', profileData)
        return
      }
    }
    
    // Si no es médico, mostrar selector (para administradores)
    const medicos = medicosData?.data || []
    if (medicos.length === 0) {
      toast.error('No hay médicos disponibles')
      return
    }
    
    if (medicos.length === 1) {
      // Si solo hay un médico, usarlo directamente
      crearConsultaMutation.mutate({
        pacienteId: selectedPaciente.id,
        medicoId: medicos[0].id,
        observaciones: '',
      })
    } else {
      // Si hay múltiples médicos, mostrar selector
      setShowMedicoSelector(true)
    }
  }

  const handleConfirmarMedico = () => {
    if (!medicoSeleccionado || !selectedPaciente) {
      toast.error('Debes seleccionar un médico')
      return
    }
    
    crearConsultaMutation.mutate({
      pacienteId: selectedPaciente.id,
      medicoId: parseInt(medicoSeleccionado),
      observaciones: '',
    })
    setShowMedicoSelector(false)
    setMedicoSeleccionado('')
    setSelectedPaciente(null)
  }

  const handleHistoriaSuccess = () => {
    setShowNuevaHistoria(false)
    setNuevaAtencion(null)
    queryClient.invalidateQueries(['historias'])
    queryClient.invalidateQueries(['atenciones'])
    toast.success('Historia clínica creada exitosamente')
  }

  // Función para generar y descargar PDF
  const handleDownloadPDF = () => {
    if (!selectedPaciente) {
      toast.error('No hay paciente seleccionado')
      return
    }

    // Obtener historias del paciente - normalizar estructura de datos
    let historiasData = historias?.data
    // Manejar estructura anidada de axios: {data: {data: [...]}}
    if (historiasData && !Array.isArray(historiasData)) {
      historiasData = historiasData.data || historiasData
    }
    // Asegurarse de que sea un array
    if (!Array.isArray(historiasData)) {
      historiasData = []
    }
    
    if (historiasData.length === 0) {
      toast.error('No hay historias clínicas para descargar')
      return
    }

    // Crear nuevo documento PDF
    const doc = new jsPDF()
    let yPosition = 20

    // Configuración de colores y estilos
    const primaryColor = [0, 122, 204] // Azul
    const textColor = [51, 51, 51] // Gris oscuro
    const lightGray = [245, 245, 245] // Gris claro

    // Título principal
    doc.setFontSize(18)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('HISTORIA CLÍNICA', 105, yPosition, { align: 'center' })
    yPosition += 10

    // Línea separadora
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    // Información del paciente
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL PACIENTE', 20, yPosition)
    yPosition += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nombre: ${selectedPaciente.nombre} ${selectedPaciente.apellido}`, 20, yPosition)
    yPosition += 6
    doc.text(`DNI: ${selectedPaciente.dni}`, 20, yPosition)
    yPosition += 6

    if (selectedPaciente.obraSocial) {
      doc.text(`Obra Social: ${selectedPaciente.obraSocial}`, 20, yPosition)
      yPosition += 6
    }

    if (selectedPaciente.fechaNacimiento) {
      const fechaStr = selectedPaciente.fechaNacimiento
      let fecha
      if (typeof fechaStr === 'string') {
        const fechaParte = fechaStr.split('T')[0]
        const [anio, mes, dia] = fechaParte.split('-').map(Number)
        fecha = new Date(anio, mes - 1, dia)
      } else {
        fecha = new Date(fechaStr)
      }
      const fechaFormateada = fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      doc.text(`Fecha de Nacimiento: ${fechaFormateada}`, 20, yPosition)
      yPosition += 6
    }

    if (selectedPaciente.telefono) {
      doc.text(`Teléfono: ${selectedPaciente.telefono}`, 20, yPosition)
      yPosition += 6
    }

    if (selectedPaciente.email) {
      doc.text(`Email: ${selectedPaciente.email}`, 20, yPosition)
      yPosition += 6
    }

    if (selectedPaciente.direccion) {
      doc.text(`Dirección: ${selectedPaciente.direccion}`, 20, yPosition)
      yPosition += 6
    }

    yPosition += 5

    // Agrupar historias por especialidad
    const historiasPorEspecialidadPDF = historiasData.reduce((acc, historia) => {
      const especialidad = historia.medico?.especialidad || 'Sin Especialidad'
      if (!acc[especialidad]) {
        acc[especialidad] = []
      }
      acc[especialidad].push(historia)
      return acc
    }, {})

    // Agregar historias clínicas
    Object.entries(historiasPorEspecialidadPDF).forEach(([especialidad, historiasEspecialidad]) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Título de especialidad
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text(especialidad.toUpperCase(), 20, yPosition)
      yPosition += 8

      // Agregar cada historia
      historiasEspecialidad.forEach((historia, index) => {
        // Verificar si necesitamos una nueva página
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Fecha y médico
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...textColor)
        const fechaConsulta = new Date(historia.fechaConsulta).toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        doc.text(`Fecha: ${fechaConsulta}`, 20, yPosition)
        yPosition += 5

        if (historia.medico?.usuario) {
          doc.text(`Médico: Dr. ${historia.medico.usuario.nombre} ${historia.medico.usuario.apellido}`, 20, yPosition)
          yPosition += 5
        }

        // Contenido de la historia
        const maxWidth = 170 // Ancho máximo para el texto
        if (historia.observaciones) {
          doc.setFont('helvetica', 'bold')
          doc.text('Historia Clínica:', 20, yPosition)
          yPosition += 5
          doc.setFont('helvetica', 'normal')
          
          // Dividir texto en líneas que quepan en el ancho de la página
          const lines = doc.splitTextToSize(historia.observaciones, maxWidth)
          lines.forEach((line) => {
            if (yPosition > 250) {
              doc.addPage()
              yPosition = 20
            }
            doc.text(line, 20, yPosition)
            yPosition += 5
          })
        } else {
          // Si no hay observaciones, mostrar otros campos si existen
          if (historia.motivoConsulta || historia.diagnostico || historia.tratamiento) {
            if (historia.motivoConsulta) {
              doc.setFont('helvetica', 'bold')
              doc.text('Motivo de Consulta:', 20, yPosition)
              yPosition += 5
              doc.setFont('helvetica', 'normal')
              const lines = doc.splitTextToSize(historia.motivoConsulta, maxWidth)
              lines.forEach((line) => {
                if (yPosition > 250) {
                  doc.addPage()
                  yPosition = 20
                }
                doc.text(line, 20, yPosition)
                yPosition += 5
              })
            }

            if (historia.diagnostico) {
              doc.setFont('helvetica', 'bold')
              doc.text('Diagnóstico:', 20, yPosition)
              yPosition += 5
              doc.setFont('helvetica', 'normal')
              const lines = doc.splitTextToSize(historia.diagnostico, maxWidth)
              lines.forEach((line) => {
                if (yPosition > 250) {
                  doc.addPage()
                  yPosition = 20
                }
                doc.text(line, 20, yPosition)
                yPosition += 5
              })
            }

            if (historia.tratamiento) {
              doc.setFont('helvetica', 'bold')
              doc.text('Tratamiento:', 20, yPosition)
              yPosition += 5
              doc.setFont('helvetica', 'normal')
              const lines = doc.splitTextToSize(historia.tratamiento, maxWidth)
              lines.forEach((line) => {
                if (yPosition > 250) {
                  doc.addPage()
                  yPosition = 20
                }
                doc.text(line, 20, yPosition)
                yPosition += 5
              })
            }
          } else {
            doc.text('Sin contenido registrado', 20, yPosition)
            yPosition += 5
          }
        }

        // Línea separadora entre historias
        if (index < historiasEspecialidad.length - 1) {
          yPosition += 3
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.2)
          doc.line(20, yPosition, 190, yPosition)
          yPosition += 5
        }
      })

      yPosition += 5
    })

    // Pie de página con fecha de generación
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.setFont('helvetica', 'normal')
      const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(
        `Generado el ${fechaGeneracion} - Página ${i} de ${totalPages}`,
        105,
        285,
        { align: 'center' }
      )
    }

    // Descargar PDF
    const fileName = `Historia_Clinica_${selectedPaciente.apellido}_${selectedPaciente.nombre}_${selectedPaciente.dni}.pdf`
    doc.save(fileName)
    toast.success('PDF descargado exitosamente')
  }

  // Agrupar historias por especialidad
  const historiasPorEspecialidad = useMemo(() => {
    // Para búsqueda por paciente, usar historias del paciente seleccionado
    // Para búsqueda avanzada, usar historiasAvanzadas
    let historiasData
    
    if (searchType === 'paciente') {
      historiasData = historias?.data
    } else {
      // Normalizar la respuesta de búsqueda avanzada
      historiasData = historiasAvanzadas?.data?.data || historiasAvanzadas?.data
    }
    
    // Manejar estructura anidada de axios: {data: {data: [...]}}
    // El backend retorna {data: [...]} y axios lo envuelve en {data: {data: [...]}}
    if (historiasData && !Array.isArray(historiasData)) {
      historiasData = historiasData.data || historiasData
    }
    
    // Verificar que historiasData sea un array
    if (!historiasData || !Array.isArray(historiasData) || historiasData.length === 0) {
      return {}
    }
    
    // Agrupar por especialidad
    return historiasData.reduce((acc, historia) => {
      const especialidad = historia.medico?.especialidad || 'Sin Especialidad'
      if (!acc[especialidad]) {
        acc[especialidad] = []
      }
      acc[especialidad].push(historia)
      return acc
    }, {})
  }, [historias?.data, historiasAvanzadas?.data, searchType])

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historias Clínicas</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Consulta el historial de atenciones y historias clínicas
        </p>
      </div>

      {/* Filtros de búsqueda */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Buscar Historias Clínicas</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Búsqueda
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="input"
            >
              <option value="paciente">Por Paciente</option>
              <option value="filtros">Filtros Avanzados</option>
            </select>
          </div>

          {searchType === 'paciente' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por
                </label>
                <select
                  value={searchBy}
                  onChange={(e) => {
                    setSearchBy(e.target.value)
                    setSearchValue('')
                  }}
                  className="input"
                >
                  <option value="dni">DNI</option>
                  <option value="apellido">Apellido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {searchBy === 'dni' ? 'DNI' : 'Apellido'}
                </label>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchBy === 'dni' ? '12345678' : 'García'}
                  className="input"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI del Paciente
                </label>
                <input
                  type="text"
                  value={dniFiltro}
                  onChange={(e) => setDniFiltro(e.target.value)}
                  placeholder="12345678"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido del Paciente
                </label>
                <input
                  type="text"
                  value={apellidoFiltro}
                  onChange={(e) => setApellidoFiltro(e.target.value)}
                  placeholder="García"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="input"
                >
                  <option value="">Todas las especialidades</option>
                  {especialidades.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Médico (Opcional)
                </label>
                <input
                  type="number"
                  value={medicoId}
                  onChange={(e) => setMedicoId(e.target.value)}
                  placeholder="Opcional"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Búsqueda de paciente y mostrar sus datos e historial */}
      {searchType === 'paciente' && searchValue && searchValue.length >= 2 && (
        <>
          {/* Mostrar pacientes encontrados si hay múltiples */}
          {loadingPacientes ? (
            <div className="card text-center py-8 mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Buscando pacientes...</p>
            </div>
          ) : errorPacientes ? (
            <div className="card text-center py-8 text-red-500 mb-6">
              <User className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p>Error al buscar pacientes</p>
              <p className="text-sm mt-2">{errorPacientes.message}</p>
            </div>
          ) : (() => {
            // Manejar estructura anidada de axios
            const pacientesArray = pacientesData?.data?.data || pacientesData?.data
            const pacientesList = Array.isArray(pacientesArray) ? pacientesArray : []
            
            if (pacientesList.length > 1) {
              return (
                <div className="card mb-6">
                  <h2 className="text-lg font-semibold mb-4">Pacientes Encontrados</h2>
                  <div className="space-y-3">
                    {pacientesList.map((paciente) => (
                  <div
                    key={paciente.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaciente?.id === paciente.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedPaciente(paciente)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <p className="text-sm text-gray-500">DNI: {paciente.dni}</p>
                          {paciente.obraSocial && (
                            <p className="text-xs text-gray-400">Obra Social: {paciente.obraSocial}</p>
                          )}
                        </div>
                      </div>
                      {selectedPaciente?.id === paciente.id && (
                        <span className="text-primary-600 font-medium">✓ Seleccionado</span>
                      )}
                    </div>
                    </div>
                  ))}
                </div>
              </div>
            )
            } else if (pacientesList.length === 0 && !loadingPacientes) {
              return (
                <div className="card text-center py-8 text-gray-500 mb-6">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No se encontraron pacientes</p>
                </div>
              )
            }
            return null
          })()}

          {/* Mostrar datos del paciente seleccionado y su historial */}
          {selectedPaciente && (
            <div className="card mb-6">
              <div className="mb-4 pb-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedPaciente.nombre} {selectedPaciente.apellido}
                  </h2>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>DNI: {selectedPaciente.dni}</p>
                    {selectedPaciente.obraSocial && (
                      <p>Obra Social: {selectedPaciente.obraSocial}</p>
                    )}
                    {selectedPaciente.fechaNacimiento && (
                      <p>
                        Fecha de Nacimiento: {(() => {
                          // Parsear la fecha sin problemas de zona horaria
                          // Si viene como string ISO, extraer solo la parte de la fecha
                          const fechaStr = selectedPaciente.fechaNacimiento
                          let fecha
                          
                          if (typeof fechaStr === 'string') {
                            // Si es un string ISO, extraer solo YYYY-MM-DD
                            const fechaParte = fechaStr.split('T')[0]
                            const [anio, mes, dia] = fechaParte.split('-').map(Number)
                            // Crear fecha en zona horaria local (sin conversión UTC)
                            fecha = new Date(anio, mes - 1, dia)
                          } else {
                            // Si ya es un Date object
                            fecha = new Date(fechaStr)
                          }
                          
                          return fecha.toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        })()}
                      </p>
                    )}
                    {selectedPaciente.telefono && (
                      <p>Teléfono: {selectedPaciente.telefono}</p>
                    )}
                    {selectedPaciente.email && (
                      <p>Email: {selectedPaciente.email}</p>
                    )}
                    {selectedPaciente.direccion && (
                      <p>Dirección: {selectedPaciente.direccion}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPaciente(null)
                      setSearchValue('')
                    }}
                    className="btn btn-secondary"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cambiar Búsqueda
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="btn btn-primary"
                    title="Descargar historia clínica en PDF"
                    disabled={!historias?.data || historias.data.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Descargar PDF
                  </button>
                  <button
                    onClick={handleCrearNuevaHistoria}
                    disabled={crearConsultaMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {crearConsultaMutation.isPending ? 'Creando...' : 'Nueva Historia Clínica'}
                  </button>
                </div>
              </div>

              {loadingHistorias ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando historial...</p>
                </div>
              ) : Object.keys(historiasPorEspecialidad).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(historiasPorEspecialidad).map(([especialidad, historiasEspecialidad]) => {
                    const isExpanded = especialidadesExpandidas[especialidad] ?? true // Por defecto expandido
                    return (
                      <div key={especialidad}>
                        <button
                          onClick={() => {
                            setEspecialidadesExpandidas(prev => ({
                              ...prev,
                              [especialidad]: !isExpanded
                            }))
                          }}
                          className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <Stethoscope className="w-5 h-5 text-primary-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{especialidad}</h3>
                          <span className="text-sm text-gray-500">
                            ({historiasEspecialidad.length} {historiasEspecialidad.length === 1 ? 'consulta' : 'consultas'})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="space-y-4">
                        {historiasEspecialidad.map((historia) => (
                          <div key={historia.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-right text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {new Date(historia.fechaConsulta).toLocaleDateString('es-AR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="flex items-center mt-1">
                                  <User className="w-4 h-4 mr-1" />
                                  Dr. {historia.medico?.usuario?.nombre} {historia.medico?.usuario?.apellido}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              {historia.observaciones ? (
                                <div>
                                  <p className="font-medium text-gray-700 text-sm mb-2">Historia Clínica:</p>
                                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{historia.observaciones}</p>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">Sin contenido registrado</p>
                              )}
                            </div>
                          </div>
                        ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : !loadingHistorias ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay historias clínicas registradas para este paciente</p>
                  {errorHistorias && (
                    <p className="text-red-500 text-sm mt-2">
                      Error: {errorHistorias.message || 'Error al cargar historias clínicas'}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Resultados de búsqueda avanzada */}
      {searchType === 'filtros' && (
        <>
          {loadingAvanzadas ? (
            <div className="card text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Buscando...</p>
            </div>
          ) : errorAvanzadas ? (
            <div className="card text-center py-8 text-red-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p>Error al buscar historias clínicas</p>
              <p className="text-sm mt-2">{errorAvanzadas.message || 'Error desconocido'}</p>
              <p className="text-xs mt-2 text-gray-500">
                {errorAvanzadas.response?.data?.message || ''}
              </p>
            </div>
          ) : (() => {
            // Normalizar la respuesta: manejar estructura anidada de axios
            const historiasData = historiasAvanzadas?.data?.data || historiasAvanzadas?.data
            const historiasArray = Array.isArray(historiasData) ? historiasData : []
            
            console.log('📊 Historias normalizadas:', historiasArray)
            console.log('📊 Cantidad de historias:', historiasArray.length)
            
            return historiasArray.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(historiasPorEspecialidad).map(([especialidad, historiasEspecialidad]) => {
                  const isExpanded = especialidadesExpandidas[especialidad] ?? true // Por defecto expandido
                  return (
                    <div key={especialidad} className="card">
                      <button
                        onClick={() => {
                          setEspecialidadesExpandidas(prev => ({
                            ...prev,
                            [especialidad]: !isExpanded
                          }))
                        }}
                        className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <Stethoscope className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-gray-900">{especialidad}</h2>
                        <span className="text-sm text-gray-500">
                          ({historiasEspecialidad.length} {historiasEspecialidad.length === 1 ? 'consulta' : 'consultas'})
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="space-y-4">
                          {historiasEspecialidad.map((historia) => (
                            <div key={historia.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  {searchType !== 'paciente' && (
                                    <>
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {historia.paciente?.nombre} {historia.paciente?.apellido}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        DNI: {historia.paciente?.dni}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(historia.fechaConsulta).toLocaleDateString('es-AR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <User className="w-4 h-4 mr-1" />
                                    Dr. {historia.medico?.usuario?.nombre} {historia.medico?.usuario?.apellido}
                                  </div>
                                </div>
                              </div>

                              {/* Mostrar contenido de la historia clínica */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                {historia.observaciones ? (
                                  <div>
                                    <p className="font-medium text-gray-700 text-sm mb-2">Historia Clínica:</p>
                                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{historia.observaciones}</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {historia.motivoConsulta && (
                                      <div>
                                        <p className="font-medium text-gray-700">Motivo de Consulta:</p>
                                        <p className="text-gray-600">{historia.motivoConsulta}</p>
                                      </div>
                                    )}
                                    {historia.diagnostico && (
                                      <div>
                                        <p className="font-medium text-gray-700">Diagnóstico:</p>
                                        <p className="text-gray-600">{historia.diagnostico}</p>
                                      </div>
                                    )}
                                    {historia.tratamiento && (
                                      <div>
                                        <p className="font-medium text-gray-700">Tratamiento:</p>
                                        <p className="text-gray-600">{historia.tratamiento}</p>
                                      </div>
                                    )}
                                    {(historia.presionArterial || historia.temperatura || historia.peso) && (
                                      <div>
                                        <p className="font-medium text-gray-700">Signos Vitales:</p>
                                        <p className="text-gray-600">
                                          {historia.presionArterial && `PA: ${historia.presionArterial} `}
                                          {historia.temperatura && `Temp: ${historia.temperatura}°C `}
                                          {historia.peso && `Peso: ${historia.peso}kg `}
                                          {historia.altura && `Altura: ${historia.altura}m`}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No se encontraron historias clínicas</p>
                <p className="text-xs mt-2 text-gray-400">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            )
          })()}
        </>
      )}

      {/* Modal de Selección de Médico */}
      {showMedicoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Seleccionar Médico</h2>
              <button
                onClick={() => {
                  setShowMedicoSelector(false)
                  setMedicoSeleccionado('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médico
              </label>
              <select
                value={medicoSeleccionado}
                onChange={(e) => setMedicoSeleccionado(e.target.value)}
                className="input"
              >
                <option value="">Seleccione un médico</option>
                {medicosData?.data?.map((medico) => (
                  <option key={medico.id} value={medico.id}>
                    Dr. {medico.usuario?.nombre} {medico.usuario?.apellido} - {medico.especialidad}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMedicoSelector(false)
                  setMedicoSeleccionado('')
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarMedico}
                disabled={crearConsultaMutation.isPending}
                className="btn btn-primary"
              >
                {crearConsultaMutation.isPending ? 'Creando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Historia Clínica */}
      {showNuevaHistoria && nuevaAtencion && (
        <HistoriaClinicaForm
          atencion={nuevaAtencion}
          onClose={() => {
            setShowNuevaHistoria(false)
            setNuevaAtencion(null)
          }}
          onSuccess={handleHistoriaSuccess}
        />
      )}
    </div>
  )
}


