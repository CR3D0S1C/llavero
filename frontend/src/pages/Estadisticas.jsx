import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getEstadisticas } from '../services/api'

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

function BarraHorizontal({ valor, max, color = 'bg-accent' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-white/5 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted w-8 text-right">{pct}%</span>
    </div>
  )
}

function BarraVertical({ valor, max, label, sublabel, color = 'bg-accent/70' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs text-muted text-center leading-tight">{sublabel}</span>
      <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
        <div
          className={`w-full rounded-t-sm ${color}`}
          style={{ height: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </div>
  )
}

export default function Estadisticas() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getEstadisticas()
      .then(r => setData(r.data))
      .catch(() => setError('Error al cargar estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="p-6 text-muted">Cargando estadísticas...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="p-6 text-red-400">{error}</div>
    </div>
  )

  const { meses, porTipo, porDiaSemana, comparativo } = data

  const maxIngresosMes = Math.max(...meses.map(m => Number(m.ingresos || 0)), 1)
  const maxVentasDia = Math.max(...porDiaSemana.map(d => d.ventas), 1)
  const maxIngresosT = Math.max(...porTipo.map(t => Number(t.total || 0)), 1)

  const variacionPos = comparativo.variacionPct >= 0

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Análisis</p>
          <h1 className="text-2xl font-bold mt-1">Estadísticas de Ocupación</h1>
          <p className="text-muted text-sm mt-0.5">Últimos 6 meses — ventas de hostal</p>
        </div>

        {/* Comparativo mes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-xs text-muted uppercase tracking-wide mb-2">{cap(comparativo.labelMesActual)}</p>
            <p className="text-3xl font-bold text-green-400">${fmt(comparativo.ingresosMesActual)}</p>
            <p className="text-muted text-sm mt-1">{comparativo.ventasMesActual} estadías</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted uppercase tracking-wide mb-2">{cap(comparativo.labelMesAnterior)}</p>
            <p className="text-3xl font-bold text-gray-400">${fmt(comparativo.ingresosMesAnterior)}</p>
            <p className="text-muted text-sm mt-1">{comparativo.ventasMesAnterior} estadías</p>
          </div>
          <div className={`card border ${variacionPos ? 'border-green-700/40 bg-green-950/20' : 'border-red-700/40 bg-red-950/20'}`}>
            <p className="text-xs text-muted uppercase tracking-wide mb-2">Variación</p>
            <p className={`text-3xl font-bold ${variacionPos ? 'text-green-400' : 'text-red-400'}`}>
              {variacionPos ? '▲' : '▼'} {Math.abs(comparativo.variacionPct).toFixed(1)}%
            </p>
            <p className="text-muted text-sm mt-1">vs mes anterior</p>
          </div>
        </div>

        {/* Ocupación por mes — barras verticales */}
        <div className="card">
          <h2 className="font-semibold mb-1">Ingresos por mes</h2>
          <p className="text-xs text-muted mb-4">Ventas de habitaciones (últimos 6 meses)</p>
          <div className="flex gap-2 items-end" style={{ height: '120px' }}>
            {meses.map((m, i) => (
              <BarraVertical
                key={i}
                valor={Number(m.ingresos)}
                max={maxIngresosMes}
                label={cap(m.mes).slice(0, 3)}
                sublabel={`$${fmt(m.ingresos)}`}
                color={i === meses.length - 1 ? 'bg-accent' : 'bg-accent/40'}
              />
            ))}
          </div>
          {/* Tabla resumen debajo */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="pb-1.5 pr-4">Mes</th>
                  <th className="pb-1.5 pr-4 text-right">Estadías</th>
                  <th className="pb-1.5 pr-4 text-right">Ingresos</th>
                  <th className="pb-1.5 pr-4 text-right">Noches vendidas</th>
                  <th className="pb-1.5 text-right">Tasa ocupación</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-white/2">
                    <td className="py-1.5 pr-4 font-medium">{cap(m.mes)} {m.anio}</td>
                    <td className="py-1.5 pr-4 text-right text-muted">{m.ventas}</td>
                    <td className="py-1.5 pr-4 text-right text-green-400 font-medium">${fmt(m.ingresos)}</td>
                    <td className="py-1.5 pr-4 text-right text-muted">{m.nochesVendidas} / {m.capacidadTotal}</td>
                    <td className="py-1.5 text-right">
                      <span className={`font-medium ${m.tasaOcupacion >= 70 ? 'text-green-400' : m.tasaOcupacion >= 40 ? 'text-yellow-400' : 'text-muted'}`}>
                        {m.tasaOcupacion.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            * Tasa = noches vendidas / (habitaciones activas × días del mes)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Ingresos por tipo de habitación */}
          <div className="card">
            <h2 className="font-semibold mb-1">Ingresos por tipo</h2>
            <p className="text-xs text-muted mb-4">Últimos 6 meses</p>
            {porTipo.length === 0 ? (
              <p className="text-muted text-sm">Sin datos de ventas</p>
            ) : (
              <div className="space-y-3">
                {porTipo.map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate mr-2">{t.tipo}</span>
                      <span className="text-accent shrink-0">${fmt(t.total)}</span>
                    </div>
                    <BarraHorizontal valor={Number(t.total)} max={maxIngresosT} color="bg-accent/60" />
                    <p className="text-xs text-muted mt-0.5">{t.ventas} estadías</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Días de la semana */}
          <div className="card">
            <h2 className="font-semibold mb-1">Ocupación por día</h2>
            <p className="text-xs text-muted mb-4">Check-ins por día de la semana</p>
            {porDiaSemana.every(d => d.ventas === 0) ? (
              <p className="text-muted text-sm">Sin datos suficientes</p>
            ) : (
              <div className="space-y-2">
                {porDiaSemana.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-muted w-20 shrink-0">{d.dia}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-white/5 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500/70 transition-all"
                          style={{ width: `${maxVentasDia > 0 ? (d.ventas / maxVentasDia) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-6 text-right">{d.ventas}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
