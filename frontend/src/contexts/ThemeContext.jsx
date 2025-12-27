import { createContext, useContext, useState, useEffect } from 'react'
import { updateTheme, getProfile } from '../services/api'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

// 12 temas predefinidos
export const themes = {
  azul: {
    name: 'Azul',
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    bgColor: '#f9fafb', // gray-50
  },
  verde: {
    name: 'Verde',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    bgColor: '#f0fdf4', // green-50
  },
  purpura: {
    name: 'Púrpura',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    bgColor: '#faf5ff', // purple-50
  },
  rojo: {
    name: 'Rojo',
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    bgColor: '#fef2f2', // red-50
  },
  naranja: {
    name: 'Naranja',
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    bgColor: '#fff7ed', // orange-50
  },
  teal: {
    name: 'Teal',
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    bgColor: '#f0fdfa', // teal-50
  },
  indigo: {
    name: 'Indigo',
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    bgColor: '#eef2ff', // indigo-50
  },
  rose: {
    name: 'Rosa',
    primary: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
    bgColor: '#fff1f2', // rose-50
  },
  emerald: {
    name: 'Esmeralda',
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    bgColor: '#ecfdf5', // emerald-50
  },
  amber: {
    name: 'Ámbar',
    primary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    bgColor: '#fffbeb', // amber-50
  },
  slate: {
    name: 'Gris Azulado',
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    bgColor: '#f8fafc', // slate-50
  },
}

// Función para generar paleta de colores a partir de un color base
function generateColorPalette(baseColor) {
  // Asegurar que el color tenga el formato correcto
  let hex = baseColor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Convertir hex a RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Función para convertir RGB a hex
  const rgbToHex = (r, g, b) => {
    return `#${[r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')}`
  }

  // Función para aclarar/oscurecer color
  const lighten = (amount) => {
    const newR = Math.min(255, Math.round(r + (255 - r) * amount))
    const newG = Math.min(255, Math.round(g + (255 - g) * amount))
    const newB = Math.min(255, Math.round(b + (255 - b) * amount))
    return rgbToHex(newR, newG, newB)
  }

  const darken = (amount) => {
    const newR = Math.max(0, Math.round(r * (1 - amount)))
    const newG = Math.max(0, Math.round(g * (1 - amount)))
    const newB = Math.max(0, Math.round(b * (1 - amount)))
    return rgbToHex(newR, newG, newB)
  }

  return {
    50: lighten(0.95),
    100: lighten(0.9),
    200: lighten(0.75),
    300: lighten(0.5),
    400: lighten(0.25),
    500: `#${hex}`,
    600: darken(0.2),
    700: darken(0.4),
    800: darken(0.6),
    900: darken(0.8),
  }
}

// Función para combinar dos colores y crear un tema personalizado
function createCustomTheme(color1, color2, name = 'Personalizado') {
  const primary = generateColorPalette(color1)
  const secondary = generateColorPalette(color2)
  
  // Usar el color primario para botones y elementos principales
  // Usar el color secundario para fondos y acentos
  // Usar una versión más fuerte del color secundario para el fondo (100 en lugar de 50)
  return {
    name,
    primary,
    secondary,
    bgColor: secondary[100], // Fondo usando el color secundario más visible
  }
}

export function ThemeProvider({ children }) {
  const { user, setUser } = useAuth()
  const [theme, setTheme] = useState('azul')
  const [loading, setLoading] = useState(true)

  // Cargar tema del usuario cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      // Siempre cargar desde el backend para asegurar que tenemos la versión más reciente
      const loadUserTheme = async () => {
        try {
          const response = await getProfile()
          const userData = response?.data?.data || response?.data || response
          if (userData?.tema) {
            const temaData = userData.tema
            if (typeof temaData === 'string') {
              // Tema predefinido
              setTheme(temaData)
              // Actualizar el usuario en AuthContext y localStorage con el tema del backend
              const updatedUser = { ...user, tema: temaData }
              setUser(updatedUser)
              localStorage.setItem('user', JSON.stringify(updatedUser))
            } else if (temaData && temaData.type === 'custom') {
              // Tema personalizado
              setTheme({ type: 'custom', data: temaData.data })
              // Actualizar el usuario en AuthContext y localStorage con el tema del backend
              const updatedUser = { ...user, tema: temaData }
              setUser(updatedUser)
              localStorage.setItem('user', JSON.stringify(updatedUser))
            } else {
              setTheme('azul')
            }
          } else {
            // Si no hay tema en el backend, usar el del usuario actual o default
            if (user.tema) {
              const temaData = user.tema
              if (typeof temaData === 'string') {
                setTheme(temaData)
              } else if (temaData && temaData.type === 'custom') {
                setTheme({ type: 'custom', data: temaData.data })
              } else {
                setTheme('azul')
              }
            } else {
              setTheme('azul')
            }
          }
        } catch (error) {
          console.error('Error al cargar tema del usuario:', error)
          // Si falla, usar el tema del usuario actual o default
          if (user.tema) {
            const temaData = user.tema
            if (typeof temaData === 'string') {
              setTheme(temaData)
            } else if (temaData && temaData.type === 'custom') {
              setTheme({ type: 'custom', data: temaData.data })
            } else {
              setTheme('azul')
            }
          } else {
            setTheme('azul')
          }
        }
        setLoading(false)
      }
      loadUserTheme()
    } else {
      setTheme('azul')
      setLoading(false)
    }
  }, [user?.id, setUser])

  // Función para aplicar un tema visualmente (sin guardar)
  const applyThemePreview = (themeKeyOrObject) => {
    let themeData
    
    if (typeof themeKeyOrObject === 'object' && themeKeyOrObject.type === 'custom') {
      // Tema personalizado
      themeData = createCustomTheme(themeKeyOrObject.data.color1, themeKeyOrObject.data.color2, themeKeyOrObject.data.name)
    } else if (typeof themeKeyOrObject === 'string' && themes[themeKeyOrObject]) {
      // Tema predefinido
      themeData = themes[themeKeyOrObject]
    } else {
      return // No aplicar si no es válido
    }
    
    if (themeData) {
      const root = document.documentElement
      
      // Aplicar colores primarios como variables CSS
      Object.entries(themeData.primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value)
      })
      
      // Aplicar color de fondo
      root.style.setProperty('--theme-bg-color', themeData.bgColor)
      root.style.setProperty('--theme-nav-bg', themeData.secondary ? themeData.secondary[100] : themeData.primary[50])
      root.style.setProperty('--theme-nav-border', themeData.secondary ? themeData.secondary[300] : themeData.primary[200])
      root.style.setProperty('--theme-waiting-bg', themeData.secondary ? themeData.secondary[100] : themeData.primary[50])
      root.style.setProperty('--theme-waiting-border', themeData.secondary ? themeData.secondary[300] : themeData.primary[200])
      document.body.style.backgroundColor = themeData.bgColor
    }
  }

  useEffect(() => {
    // Aplicar el tema al documento
    let themeData
    
    if (typeof theme === 'object' && theme.type === 'custom') {
      // Tema personalizado
      themeData = createCustomTheme(theme.data.color1, theme.data.color2, theme.data.name)
    } else {
      // Tema predefinido
      themeData = themes[theme]
    }
    
    if (themeData) {
      const root = document.documentElement
      
      // Aplicar colores primarios como variables CSS
      Object.entries(themeData.primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value)
      })
      
      // Aplicar color de fondo
      root.style.setProperty('--theme-bg-color', themeData.bgColor)
      root.style.setProperty('--theme-nav-bg', themeData.secondary ? themeData.secondary[100] : themeData.primary[50]) // Fondo de navbar más visible
      root.style.setProperty('--theme-nav-border', themeData.secondary ? themeData.secondary[300] : themeData.primary[200]) // Borde de navbar
      // Colores para tarjetas de sala de espera
      root.style.setProperty('--theme-waiting-bg', themeData.secondary ? themeData.secondary[100] : themeData.primary[50]) // Fondo de tarjetas de espera más visible
      root.style.setProperty('--theme-waiting-border', themeData.secondary ? themeData.secondary[300] : themeData.primary[200]) // Borde de tarjetas de espera
      document.body.style.backgroundColor = themeData.bgColor
    }
  }, [theme])

  const changeTheme = async (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme)
      // Guardar en el backend si hay usuario logueado
      if (user?.id) {
        try {
          // Envolver el string en un objeto para evitar problemas con ValidationPipe
          await updateTheme({ tema: newTheme })
          // Actualizar el usuario en AuthContext y localStorage con el nuevo tema
          const updatedUser = { ...user, tema: newTheme }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        } catch (error) {
          console.error('Error al guardar tema:', error)
        }
      }
    }
  }

  const setCustomTheme = async (color1, color2, name) => {
    const customData = { color1, color2, name }
    const themeObj = { type: 'custom', data: customData }
    setTheme(themeObj)
    // Guardar en el backend si hay usuario logueado
    if (user?.id) {
      try {
        // Envolver en un objeto para consistencia con el formato del backend
        await updateTheme({ tema: themeObj })
        // Actualizar el usuario en AuthContext y localStorage con el nuevo tema
        const updatedUser = { ...user, tema: themeObj }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
      } catch (error) {
        console.error('Error al guardar tema personalizado:', error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, themes, changeTheme, setCustomTheme, applyThemePreview }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

