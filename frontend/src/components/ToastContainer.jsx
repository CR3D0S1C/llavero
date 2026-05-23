import { useState, useEffect } from 'react'
import { subscribe, dismiss } from '../utils/toast'

const config = {
  info:    { color: 'bg-card border-border text-gray-200',           icon: 'ℹ' },
  success: { color: 'bg-green-900/40 border-green-700 text-green-200', icon: '✓' },
  error:   { color: 'bg-red-900/40 border-red-700 text-red-200',     icon: '✕' },
  warning: { color: 'bg-yellow-900/40 border-yellow-700 text-yellow-200', icon: '⚠' },
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribe(({ kind, toast, id }) => {
    if (kind === 'add')    setToasts(t => [...t, toast])
    if (kind === 'remove') setToasts(t => t.filter(x => x.id !== id))
  }), [])

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map(t => {
        const c = config[t.type] || config.info
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto cursor-pointer border rounded-lg px-4 py-3 shadow-2xl backdrop-blur-sm flex items-start gap-2.5 min-w-[260px] max-w-sm animate-slide-in-right ${c.color}`}
          >
            <span className="font-bold text-base mt-0.5">{c.icon}</span>
            <span className="text-sm flex-1 break-words">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
