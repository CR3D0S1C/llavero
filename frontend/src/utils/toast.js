// Sistema simple de notificaciones tipo toast — sin proveedor de contexto
// Uso: toast('mensaje'), toast.success(...), toast.error(...), toast.warning(...)

const listeners = new Set()
let counter = 0

function emit(msg, type, duration = 4000) {
  const id = ++counter
  const t = { id, message: msg, type, duration }
  listeners.forEach(fn => fn({ kind: 'add', toast: t }))
  if (duration > 0) {
    setTimeout(() => listeners.forEach(fn => fn({ kind: 'remove', id })), duration)
  }
  return id
}

export function toast(msg, opts = {}) {
  return emit(msg, opts.type || 'info', opts.duration ?? 4000)
}
toast.success = (msg, opts) => emit(msg, 'success', opts?.duration ?? 3500)
toast.error   = (msg, opts) => emit(msg, 'error',   opts?.duration ?? 5000)
toast.warning = (msg, opts) => emit(msg, 'warning', opts?.duration ?? 4500)
toast.info    = (msg, opts) => emit(msg, 'info',    opts?.duration ?? 3500)

export function dismiss(id) {
  listeners.forEach(fn => fn({ kind: 'remove', id }))
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
