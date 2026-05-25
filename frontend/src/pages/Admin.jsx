import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { getEstadoActual, getMetricas, enviarResumenDia } from '../services/api'
import { toast } from '../utils/toast'

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')

function minutos(inicio) {
  const diff = Math.floor((Date.now() - new Date(inicio)) / 60000)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function salidaLabel(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const hoy = new Date()
  const esHoy = d.toDateString() === hoy.toDateString()
  return esHoy
    ? d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Admin() {
  const [estado, setEstado] = useState(null)
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const cargar = useCallback(() => {
    Promise.all([getEstadoActual(), getMetricas()]).then(([e, m]) => {
      setEstado(e.data)
      setMetricas(m.data)
      setUltimaActualizacion(new Date())
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000) // refresca cada 30s
    return () => clearInterval(interval)
  }, [cargar])

  const handleEnviarResumen = async () => {
    setEnviando(true)
    try {
      await enviarResumenDia()
      toast.success('Resumen del día enviado al correo del jefe')
    } catch {
      toast.error('Error al enviar el resumen')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="p-6 text-muted">Cargando...</div>
    </div>
  )

  const vencidas = estado?.habitacionesOcupadas?.filter(h => h.vencida) || []

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel del Jefe</h1>
            {ultimaActualizacion && (
              <p className="text-muted text-xs mt-0.5">
                Actualizado: {ultimaActualizacion.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                <span className="ml-2 text-gray-600">· refresca cada 30s</span>
              </p>
            )}
          </div>
          <button
            onClick={handleEnviarResumen}
            disabled={enviando}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            📧 {enviando ? 'Enviando...' : 'Enviar resumen del día'}
          </button>
        </div>

        {/* Alerta habitaciones vencidas */}
        {vencidas.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <div>
              <div className="font-semibold text-red-400">
                {vencidas.length} habitación{vencidas.length > 1 ? 'es' : ''} con tiempo vencido
              </div>
              <div className="text-sm text-red-300/80 mt-0.5">
                {vencidas.map(h => `Hab. ${h.numero}`).join(', ')} — el cajero debe liberar o extender
              </div>
            </div>
          </div>
        )}

        {/* Total del día */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center col-span-2 md:col-span-1">
            <div className="text-muted text-xs mb-1">TOTAL HOY</div>
            <div className="text-3xl font-bold text-green-400">${fmt(estado?.totalDia)}</div>
            <div className="text-muted text-xs mt-1">{estado?.ventasDia} ventas</div>
          </div>
          <div className="card text-center">
            <div className="text-muted text-xs mb-1">ESTA SEMANA</div>
            <div className="text-xl font-bold">${fmt(metricas?.totalSemana)}</div>
            <div className="text-muted text-xs mt-1">{metricas?.ventasSemana} ventas</div>
          </div>
          <div className="card text-center">
            <div className="text-muted text-xs mb-1">TURNOS ACTIVOS</div>
            <div className="text-xl font-bold text-accent">{estado?.turnosActivos?.length ?? 0}</div>
            <div className="text-muted text-xs mt-1">cajeros trabajando</div>
          </div>
          <div className="card text-center">
            <div className="text-muted text-xs mb-1">DTE PENDIENTES</div>
            <div className={`text-xl font-bold ${estado?.dtePendientes > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {estado?.dtePendientes ?? 0}
            </div>
            <div className="text-muted text-xs mt-1">por emitir en SII</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Turnos activos ahora */}
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
              Turnos activos ahora
            </h2>
            {estado?.turnosActivos?.length === 0 ? (
              <p className="text-muted text-sm">Nadie trabajando en este momento</p>
            ) : (
              <div className="space-y-3">
                {estado.turnosActivos.map((t, i) => (
                  <div key={i} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <div className="font-medium">{t.cajeroNombre}</div>
                      <div className="text-xs text-muted mt-0.5">
                        Hace {minutos(t.inicio)} · {t.cantidadVentas} ventas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">${fmt(t.totalTurno)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {estado?.cajerosSinTurno?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted mb-1">Sin turno abierto:</p>
                <div className="flex flex-wrap gap-1.5">
                  {estado.cajerosSinTurno.map(n => (
                    <span key={n} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Habitaciones ocupadas ahora */}
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-red-400">🔴</span>
              Habitaciones ocupadas ({estado?.habitacionesOcupadas?.length ?? 0})
            </h2>
            {estado?.habitacionesOcupadas?.length === 0 ? (
              <p className="text-muted text-sm">Ninguna habitación ocupada</p>
            ) : (
              <div className="space-y-2">
                {estado.habitacionesOcupadas.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    h.vencida ? 'border-red-500/40 bg-red-900/20' : 'border-border'
                  }`}>
                    <div>
                      <span className="font-bold">Hab. {h.numero}</span>
                      <span className="text-xs text-muted ml-2">{h.tipo}</span>
                    </div>
                    <div className="text-right">
                      {h.salidaEstimada ? (
                        <span className={`text-xs font-medium ${h.vencida ? 'text-red-400' : 'text-muted'}`}>
                          {h.vencida ? '⚠ ' : ''}Sale {salidaLabel(h.salidaEstimada)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Sin horario</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estado habitaciones (conteo por estado) */}
        {metricas?.habitacionesPorEstado && (
          <div className="card">
            <h2 className="font-semibold mb-3">Estado general de habitaciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: 'libre',         label: 'Libres',       color: 'text-green-400' },
                { key: 'ocupado',       label: 'Ocupadas',     color: 'text-red-400' },
                { key: 'aseo',          label: 'En Aseo',      color: 'text-orange-400' },
                { key: 'mantenimiento', label: 'Mantención',   color: 'text-yellow-400' },
                { key: 'deshabilitada', label: 'Deshabilitadas',color: 'text-gray-500' },
              ].map(({ key, label, color }) => (
                <div key={key} className="text-center">
                  <div className={`text-3xl font-bold ${color}`}>
                    {metricas.habitacionesPorEstado[key] ?? 0}
                  </div>
                  <div className="text-muted text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        <div className="card">
          <h2 className="font-semibold mb-3">Histórico total</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted text-xs mb-1">VENTAS TOTALES</div>
              <div className="text-2xl font-bold">{metricas?.ventasTotal}</div>
            </div>
            <div>
              <div className="text-muted text-xs mb-1">RECAUDADO TOTAL</div>
              <div className="text-2xl font-bold text-green-400">${fmt(metricas?.totalGeneral)}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
