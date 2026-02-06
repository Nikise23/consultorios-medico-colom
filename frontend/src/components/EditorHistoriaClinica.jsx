import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Highlighter } from 'lucide-react'

/**
 * Editor de texto enriquecido para historia clínica.
 * Soporta negrita, cursiva, subrayado y resaltado.
 * Almacena HTML para preservar el formato.
 */
export default function EditorHistoriaClinica({ value = '', onChange, placeholder, rows = 15, className = '' }) {
  const editorRef = useRef(null)
  const isInternalChange = useRef(false)

  // Sincronizar value externo solo cuando viene de una fuente externa (carga inicial, cambio de paciente)
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      if (isInternalChange.current) {
        isInternalChange.current = false
        return
      }
      const normalizedValue = value || ''
      const currentContent = editorRef.current.innerHTML
      const normalizedCurrent = (currentContent === '<br>' || currentContent === '<p><br></p>') ? '' : currentContent
      if (normalizedValue !== normalizedCurrent) {
        editorRef.current.innerHTML = normalizedValue || ''
      }
    }
  }, [value])

  const handleInput = () => {
    isInternalChange.current = true
    const content = editorRef.current?.innerHTML || ''
    onChange?.(content)
  }

  const applyFormat = (e, command, value = null) => {
    e.preventDefault()
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleInput()
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Barra de herramientas */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'bold')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Negrita"
        >
          <Bold className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'italic')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Cursiva"
        >
          <Italic className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'underline')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Subrayado"
        >
          <Underline className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'backColor', '#fef08a')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Resaltar"
        >
          <Highlighter className="w-4 h-4 text-gray-700" />
        </button>
      </div>
      {/* Área de edición */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[200px] p-4 text-gray-900 focus:outline-none focus:ring-0 overflow-y-auto"
        style={{
          minHeight: `${rows * 24}px`,
        }}
        suppressContentEditableWarning
      />
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
