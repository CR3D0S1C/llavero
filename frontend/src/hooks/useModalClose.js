import { useEffect } from 'react'

// Cierra el modal al presionar Escape. El click afuera se maneja en el JSX
// con onClick={onClose} en el backdrop y stopPropagation en el contenido.
export function useModalClose(onClose, enabled = true) {
  useEffect(() => {
    if (!enabled || !onClose) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, enabled])
}
