import { useRef, useEffect, useState } from 'react'
import { Bold, Italic, Underline, Highlighter } from 'lucide-react'

/**
 * Editor de texto enriquecido para historia clínica.
 * Soporta negrita, cursiva, subrayado y resaltado.
 * Los botones muestran estado activo cuando el cursor está en texto con ese formato.
 * Presionar de nuevo desactiva el formato (toggle).
 */
export default function EditorHistoriaClinica({ value = '', onChange, placeholder, rows = 15, className = '' }) {
  const editorRef = useRef(null)
  const isInternalChange = useRef(false)
  const [formatActive, setFormatActive] = useState({ bold: false, italic: false, underline: false, highlight: false })

  const hasBackgroundColor = (el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false
    const bg = el.style?.backgroundColor || window.getComputedStyle(el).backgroundColor
    return bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
  }

  const isCursorInHighlight = () => {
    const editor = editorRef.current
    const sel = window.getSelection()
    if (!sel || !editor?.contains(sel.anchorNode)) return false
    const checkNode = (n) => {
      let el = n.nodeType === Node.TEXT_NODE ? n.parentElement : n
      while (el && el !== editor) {
        if (hasBackgroundColor(el)) return true
        el = el.parentElement
      }
      return false
    }
    return checkNode(sel.anchorNode) || (sel.focusNode && sel.focusNode !== sel.anchorNode && checkNode(sel.focusNode))
  }

  const updateFormatState = () => {
    if (!editorRef.current || !document.contains(editorRef.current)) return
    const sel = window.getSelection()
    if (!sel || !editorRef.current.contains(sel.anchorNode)) {
      setFormatActive({ bold: false, italic: false, underline: false, highlight: false })
      return
    }
    try {
      const bold = document.queryCommandState('bold')
      const italic = document.queryCommandState('italic')
      const underline = document.queryCommandState('underline')
      const highlight = isCursorInHighlight()
      setFormatActive({ bold, italic, underline, highlight })
    } catch (_) {
      setFormatActive({ bold: false, italic: false, underline: false, highlight: false })
    }
  }

  useEffect(() => {
    const onSelectionChange = () => updateFormatState()
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

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

  const removeHighlight = () => {
    const editor = editorRef.current
    if (!editor) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !editor.contains(sel?.anchorNode)) return

    const range = sel.getRangeAt(0)
    const root = range.commonAncestorContainer
    const rootEl = root.nodeType === Node.TEXT_NODE ? root.parentElement : root
    if (!rootEl || !editor.contains(rootEl)) return

    const unwrap = (el) => {
      const parent = el.parentNode
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
    }

    const collect = (node, acc) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return
      if (node !== editor && hasBackgroundColor(node) && range.intersectsNode(node)) {
        acc.push(node)
        return
      }
      for (const child of node.childNodes) collect(child, acc)
    }

    const highlighted = []
    collect(rootEl, highlighted)
    highlighted.sort((a, b) => {
      const depth = (el) => { let d = 0; let p = el; while ((p = p.parentElement) && p !== editor) d++; return d }
      return depth(b) - depth(a)
    })
    highlighted.forEach(unwrap)
  }

  const applyFormat = (e, command, value = null) => {
    e.preventDefault()
    editorRef.current?.focus()
    if (command === 'backColor') {
      if (formatActive.highlight) {
        removeHighlight()
      } else {
        document.execCommand('backColor', false, '#fef08a')
      }
    } else {
      document.execCommand(command, false, value)
    }
    setTimeout(updateFormatState, 0)
    handleInput()
  }

  const btnClass = (active) =>
    `p-2 rounded transition-colors ${active ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200 text-gray-700'}`

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Barra de herramientas */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'bold')}
          className={btnClass(formatActive.bold)}
          title="Negrita (presionar de nuevo para desactivar)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'italic')}
          className={btnClass(formatActive.italic)}
          title="Cursiva (presionar de nuevo para desactivar)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'underline')}
          className={btnClass(formatActive.underline)}
          title="Subrayado (presionar de nuevo para desactivar)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => applyFormat(e, 'backColor', '#fef08a')}
          className={btnClass(formatActive.highlight)}
          title="Resaltar (presionar de nuevo para desactivar)"
        >
          <Highlighter className="w-4 h-4" />
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
