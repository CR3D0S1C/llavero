import { useState, useEffect } from 'react'

const estadoConfig = {
  libre:        { label: 'Libre',       color: 'border-green-500 bg-green-500/10',   dot: 'bg-green-500',  text: 'text-green-400' },
  ocupado:      { label: 'Ocupado',     color: 'border-red-500 bg-red-500/10',       dot: 'bg-red-500',    text: 'text-red-400' },
  aseo:         { label: 'En Aseo',     color: 'border-orange-500 bg-orange-500/10', dot: 'bg-orange-500', text: 'text-orange-400' },
  mantenimiento:{ label: 'Mantención',  color: 'border-yellow-500 bg-yellow-500/10', dot: 'bg-yellow-500', text: 'text-yellow-400' },
  deshabilitada:{ label: 'Deshabilitada',color: 'border-gray-600 bg-gray-600/10',   dot: 'bg-gray-500',   text: 'text-gray-500' },
}

function useContador(salidaEstimada) {
  const [ms, setMs] = useState(null)

  useEffect(() => {
    if (!salidaEstimada) return
    const calcular = () => setMs(new Date(salidaEstimada) - new Date())
    calcular()
    const t = setInterval(calcular, 1000)
    return () => clearInterval(t)
  }, [salidaEstimada])

  return ms
}

function formatTiempo(ms) {
  if (ms === null) return null
  if (ms <= 0) return { texto: 'TIEMPO VENCIDO', vencido: true }
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return { texto: `${h}h ${m}m`, vencido: false }
  if (m > 0) return { texto: `${m}m ${s}s`, vencido: false }
  return { texto: `${s}s`, vencido: false }
}

export default function RoomCard({ habitacion, onClick, onLiberar, seleccionada = false }) {
  const cfg = estadoConfig[habitacion.estado] || estadoConfig.libre
  const msRestante = useContador(habitacion.salidaEstimada)
  const tiempo = formatTiempo(msRestante)

  const handleLiberar = (e) => {
    e.stopPropagation()
    if (onLiberar) onLiberar(habitacion)
  }

  const salidaHora = habitacion.salidaEstimada
    ? new Date(habitacion.salidaEstimada).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : null
  const salidaDia = habitacion.salidaEstimada
    ? new Date(habitacion.salidaEstimada).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
    : null

  return (
    <div
      onClick={() => onClick && onClick(habitacion)}
      className={`border-2 rounded-xl p-4 transition-all ${cfg.color}
        ${seleccionada ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg">{habitacion.numero}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
        </div>
      </div>

      <p className="text-sm text-muted">{habitacion.tipoLabel}</p>
      <p className="text-xs text-gray-600 mt-0.5">
        {habitacion.bano === 'Privado' ? '🚿 Baño privado' : '🚿 Baño compartido'}
      </p>

      {/* Contador de tiempo para ocupadas */}
      {habitacion.estado === 'ocupado' && tiempo && (
        <div className={`mt-2 text-center rounded-lg py-1.5 ${tiempo.vencido ? 'bg-red-900/50 animate-pulse' : 'bg-black/20'}`}>
          {tiempo.vencido ? (
            <span className="text-red-400 font-bold text-xs">⚠ TIEMPO VENCIDO</span>
          ) : (
            <div>
              <span className={`font-mono font-bold text-sm ${msRestante < 600000 ? 'text-red-400' : msRestante < 1800000 ? 'text-yellow-400' : 'text-gray-300'}`}>
                {tiempo.texto}
              </span>
              <span className="text-gray-600 text-xs ml-1">restante</span>
            </div>
          )}
          {salidaHora && (
            <p className="text-gray-600 text-xs mt-0.5">Sale {salidaDia} {salidaHora}</p>
          )}
        </div>
      )}

      {habitacion.nota && (
        <p className="text-xs text-yellow-500/80 mt-2 truncate">📝 {habitacion.nota}</p>
      )}

      {/* Botón gestionar — visible en todos los estados excepto deshabilitada */}
      {habitacion.estado !== 'deshabilitada' && onLiberar && (
        <button
          onClick={handleLiberar}
          className={`mt-3 w-full text-xs py-1.5 rounded-lg border transition-colors font-medium ${
            habitacion.estado === 'aseo'
              ? 'border-orange-700 hover:bg-orange-900/30 text-orange-400'
              : habitacion.estado === 'ocupado'
                ? 'border-green-700 hover:bg-green-900/30 text-green-400'
                : 'border-gray-600 hover:bg-gray-700/30 text-gray-400'
          }`}
        >
          {habitacion.estado === 'aseo'
            ? '🧹 Gestionar aseo'
            : habitacion.estado === 'ocupado'
              ? '🔓 Liberar / Aseo'
              : '⚙️ Gestionar'}
        </button>
      )}
    </div>
  )
}
