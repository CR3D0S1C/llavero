import { useState } from 'react'
import Navbar from '../components/Navbar'
import { getReporte } from '../services/api'

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')
const fmtFecha = (s) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

const METODOS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  otro: 'Otro',
}

const hoy = () => {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
const primerDiaMes = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
const primerDiaMesAnterior = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}
const ultimoDiaMesAnterior = () => {
  const d = new Date()
  d.setDate(0)
  return d.toISOString().slice(0, 10)
}
const haceSiete = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0, 10)
}

function exportarCSV(ventas, desde, hasta) {
  const cols = ['Fecha', 'Hora', 'Cajero', 'Habitación', 'Tipo', 'Método Pago', 'Total']
  const filas = ventas.map(v => [
    fmtFecha(v.fecha),
    v.hora ? v.hora.slice(0, 5) : '—',
    v.cajero || '—',
    v.habitacionNumero || '—',
    v.habitacionTipo || (v.tipoVenta === 'minimarket' ? 'Minimarket' : '—'),
    METODOS[v.metodoPago] || v.metodoPago || '—',
    v.total,
  ])
  const csv = [cols, ...filas]
    .map(r => r.map(c => `"${c}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_${desde}_${hasta}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reporte() {
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoy)
  const [tipo, setTipo] = useState('todos')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const buscar = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await getReporte(desde, hasta, tipo)
      setData(r.data)
    } catch {
      setError('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const atajo = (d, h) => { setDesde(d); setHasta(h) }

  const metodoColor = (m) => ({
    efectivo: 'text-green-400',
    transferencia: 'text-blue-400',
    debito: 'text-purple-400',
    credito: 'text-orange-400',
    otro: 'text-gray-400',
  }[m] || 'text-gray-400')

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Administración</p>
          <h1 className="text-2xl font-bold mt-1">Reporte de Ventas</h1>
          <p className="text-muted text-sm mt-0.5">Filtrar por período y tipo de venta</p>
        </div>

        {/* Filtros */}
        <div className="card space-y-4">
          {/* Atajos de fecha */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => atajo(hoy(), hoy())} className="btn-ghost text-xs py-1 px-3">Hoy</button>
            <button onClick={() => atajo(haceSiete(), hoy())} className="btn-ghost text-xs py-1 px-3">Últimos 7 días</button>
            <button onClick={() => atajo(primerDiaMes(), hoy())} className="btn-ghost text-xs py-1 px-3">Este mes</button>
            <button onClick={() => atajo(primerDiaMesAnterior(), ultimoDiaMesAnterior())} className="btn-ghost text-xs py-1 px-3">Mes anterior</button>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={e => setDesde(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={e => setHasta(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Tipo de venta</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="input w-full">
                <option value="todos">Todos</option>
                <option value="hostal">Hostal</option>
                <option value="minimarket">Minimarket</option>
              </select>
            </div>
          </div>

          <button onClick={buscar} disabled={loading} className="btn-primary w-full sm:w-auto">
            {loading ? 'Cargando…' : 'Generar reporte'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {data && (
          <>
            {/* Tarjetas resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Total general</p>
                <p className="text-2xl font-bold text-green-400">${fmt(data.totalGeneral)}</p>
                <p className="text-xs text-muted mt-1">{data.totalTransacciones} transacciones</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Hostal</p>
                <p className="text-2xl font-bold text-accent">${fmt(data.totalHostal)}</p>
                <p className="text-xs text-muted mt-1">{data.cantHostal} estadías</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Minimarket</p>
                <p className="text-2xl font-bold text-purple-400">${fmt(data.totalMinimarket)}</p>
                <p className="text-xs text-muted mt-1">{data.cantMinimarket} ventas</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted uppercase tracking-wide mb-2">Por método de pago</p>
                <div className="space-y-1">
                  {Object.entries(data.porMetodoPago).map(([m, total]) =>
                    Number(total) > 0 ? (
                      <div key={m} className="flex justify-between text-xs">
                        <span className={metodoColor(m)}>{METODOS[m] || m}</span>
                        <span className="text-gray-300">${fmt(total)}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de ventas */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-semibold">Detalle de transacciones</h2>
                  <p className="text-xs text-muted mt-0.5">{fmtFecha(data.desde)} al {fmtFecha(data.hasta)}</p>
                </div>
                {data.ventas.length > 0 && (
                  <button
                    onClick={() => exportarCSV(data.ventas, data.desde, data.hasta)}
                    className="btn-ghost text-xs py-1 px-3"
                  >
                    ↓ CSV
                  </button>
                )}
              </div>

              {data.ventas.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">Sin ventas en este período</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted border-b border-border">
                        <th className="pb-2 pr-3">Fecha</th>
                        <th className="pb-2 pr-3">Hora</th>
                        <th className="pb-2 pr-3">Cajero</th>
                        <th className="pb-2 pr-3">Habitación</th>
                        <th className="pb-2 pr-3">Tipo</th>
                        <th className="pb-2 pr-3">Método</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ventas.map(v => (
                        <tr key={v.id} className="border-b border-border/30 hover:bg-white/2">
                          <td className="py-2 pr-3 text-muted">{fmtFecha(v.fecha)}</td>
                          <td className="py-2 pr-3 text-muted">{v.hora ? v.hora.slice(0, 5) : '—'}</td>
                          <td className="py-2 pr-3">{v.cajero || '—'}</td>
                          <td className="py-2 pr-3 font-medium">
                            {v.habitacionNumero ? `Hab. ${v.habitacionNumero}` : '—'}
                          </td>
                          <td className="py-2 pr-3">
                            {v.habitacionTipo || (v.tipoVenta === 'minimarket'
                              ? <span className="text-purple-400">Minimarket</span>
                              : '—')}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`text-xs font-medium ${metodoColor(v.metodoPago)}`}>
                              {METODOS[v.metodoPago] || v.metodoPago || '—'}
                            </span>
                          </td>
                          <td className="py-2 text-right font-medium text-green-400">
                            ${fmt(v.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td colSpan={6} className="pt-3 text-sm font-semibold text-right pr-3">Total</td>
                        <td className="pt-3 text-right font-bold text-green-400 text-base">
                          ${fmt(data.totalGeneral)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
