import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import {
  getProductos, ingresoStock, ajustarStock,
  getMovimientosProducto, getMovimientosRecientes
} from '../services/api'
import { toast } from '../utils/toast'
import { useModalClose } from '../hooks/useModalClose'

const FILTROS = [
  { value: 'todos',     label: 'Todos' },
  { value: 'bajo',      label: 'Bajo mínimo' },
  { value: 'sin_stock', label: 'Sin stock' },
  { value: 'sin_track', label: 'Sin trackear' },
]

const TIPO_CONFIG = {
  entrada:    { label: 'Ingreso',    icon: '↑', color: 'text-green-400 bg-green-500/10 border-green-700/40' },
  salida:     { label: 'Venta',      icon: '↓', color: 'text-red-400 bg-red-500/10 border-red-700/40' },
  ajuste:     { label: 'Ajuste',     icon: '⟲', color: 'text-blue-400 bg-blue-500/10 border-blue-700/40' },
  devolucion: { label: 'Devolución', icon: '↩', color: 'text-purple-400 bg-purple-500/10 border-purple-700/40' },
}

function statusOf(p) {
  if (p.stock == null) return { tag: 'sin_track', label: 'Sin trackear', cls: 'text-gray-500 bg-gray-700/30' }
  if (p.stock === 0)   return { tag: 'sin_stock', label: 'Sin stock',    cls: 'text-red-400 bg-red-900/40' }
  if (p.stock <= (p.stockMinimo || 0))
                       return { tag: 'bajo',      label: 'Bajo mínimo',  cls: 'text-yellow-400 bg-yellow-900/40' }
  return                       { tag: 'ok',       label: 'En stock',     cls: 'text-green-400 bg-green-900/40' }
}

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [movs, setMovs] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { tipo: 'ingreso'|'ajuste', producto }

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const [p, m] = await Promise.all([getProductos(), getMovimientosRecientes()])
      setProductos(p.data)
      setMovs(m.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtrados = useMemo(() => productos.filter(p => {
    const st = statusOf(p)
    if (filtro !== 'todos' && st.tag !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!p.nombre.toLowerCase().includes(q) &&
          !(p.codigoBarras || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [productos, filtro, busqueda])

  const conteos = useMemo(() => ({
    todos:     productos.length,
    bajo:      productos.filter(p => statusOf(p).tag === 'bajo').length,
    sin_stock: productos.filter(p => statusOf(p).tag === 'sin_stock').length,
    sin_track: productos.filter(p => statusOf(p).tag === 'sin_track').length,
  }), [productos])

  const valorInventario = useMemo(() =>
    productos.reduce((s, p) => s + (p.stock || 0) * Number(p.costo || p.precio || 0), 0)
  , [productos])

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-6 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Minimarket</p>
            <h1 className="text-3xl font-bold mt-1">Inventario</h1>
          </div>
          <div className="text-right text-xs text-muted">
            <p>Valor estimado del inventario</p>
            <p className="text-xl font-bold text-accent tabular-nums">
              ${valorInventario.toLocaleString('es-CL')}
            </p>
          </div>
        </header>

        {/* Búsqueda y filtros */}
        <div className="card mb-4 space-y-3">
          <input
            className="input"
            placeholder="🔍  Buscar por nombre o código de barras..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {FILTROS.map(f => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  filtro === f.value
                    ? 'bg-accent text-white border-transparent'
                    : 'border-border text-muted hover:text-gray-200'
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-xs opacity-70">({conteos[f.value]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de productos */}
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-12 text-muted">
            No hay productos que coincidan con el filtro
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
            {filtrados.map(p => {
              const st = statusOf(p)
              const valor = (p.stock || 0) * Number(p.costo || p.precio || 0)
              return (
                <div key={p.id} className="card hover:border-accent/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0">{p.icono || '📦'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{p.nombre}</h3>
                          <p className="text-xs text-muted">{p.categoria}</p>
                          {p.codigoBarras && (
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              📷 {p.codigoBarras}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="border border-border/60 rounded-lg py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted">Stock</p>
                          <p className={`text-2xl font-bold tabular-nums ${st.cls.split(' ')[0]}`}>
                            {p.stock != null ? p.stock : '—'}
                          </p>
                        </div>
                        <div className="border border-border/60 rounded-lg py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted">Mínimo</p>
                          <p className="text-2xl font-bold tabular-nums text-gray-400">
                            {p.stockMinimo || 0}
                          </p>
                        </div>
                        <div className="border border-border/60 rounded-lg py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted">Valor</p>
                          <p className="text-lg font-bold tabular-nums text-gray-300">
                            ${Math.round(valor).toLocaleString('es-CL')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setModal({ tipo: 'ingreso', producto: p })}
                          className="flex-1 text-xs py-1.5 rounded-lg border border-green-700/60 text-green-400 hover:bg-green-900/30 font-medium"
                        >
                          + Ingreso
                        </button>
                        <button
                          onClick={() => setModal({ tipo: 'ajuste', producto: p })}
                          className="flex-1 text-xs py-1.5 rounded-lg border border-blue-700/60 text-blue-400 hover:bg-blue-900/30 font-medium"
                        >
                          ⟲ Ajustar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Movimientos recientes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Movimientos recientes</h2>
          {movs.length === 0 ? (
            <p className="text-muted text-sm">Aún no hay movimientos de stock</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="pb-2 pr-3">Producto</th>
                    <th className="pb-2 pr-3">Tipo</th>
                    <th className="pb-2 pr-3 text-right">Cant.</th>
                    <th className="pb-2 pr-3 text-right">Stock</th>
                    <th className="pb-2 pr-3">Motivo</th>
                    <th className="pb-2 pr-3">Usuario</th>
                    <th className="pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {movs.slice(0, 50).map(m => {
                    const cfg = TIPO_CONFIG[m.tipo] || TIPO_CONFIG.ajuste
                    return (
                      <tr key={m.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                        <td className="py-2 pr-3 font-medium truncate max-w-[200px]">{m.productoNombre}</td>
                        <td className="py-2 pr-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums font-mono">{m.cantidad}</td>
                        <td className="py-2 pr-3 text-right tabular-nums font-mono text-muted">
                          {m.stockAnterior} → <span className="text-white">{m.stockNuevo}</span>
                        </td>
                        <td className="py-2 pr-3 text-muted truncate max-w-[200px]">{m.motivo}</td>
                        <td className="py-2 pr-3 text-muted">{m.usuarioNombre}</td>
                        <td className="py-2 text-muted text-xs whitespace-nowrap">{m.fecha} {m.hora}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ModalStock
          tipo={modal.tipo}
          producto={modal.producto}
          onCerrar={() => setModal(null)}
          onExito={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}

function ModalStock({ tipo, producto, onCerrar, onExito }) {
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  useModalClose(onCerrar, !loading)

  const esIngreso = tipo === 'ingreso'
  const stockActual = producto.stock != null ? producto.stock : 0

  const enviar = async () => {
    const num = parseInt(cantidad, 10)
    if (isNaN(num) || num < 0) {
      toast.warning('Ingresa una cantidad válida')
      return
    }
    if (esIngreso && num === 0) {
      toast.warning('El ingreso debe ser mayor a 0')
      return
    }
    setLoading(true)
    try {
      if (esIngreso) {
        await ingresoStock(producto.id, { cantidad: num, motivo: motivo.trim() || null })
        toast.success(`+${num} unidades de ${producto.nombre}`)
      } else {
        await ajustarStock(producto.id, { stockNuevo: num, motivo: motivo.trim() || null })
        toast.success(`Stock de ${producto.nombre} ajustado a ${num}`)
      }
      onExito()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    } finally { setLoading(false) }
  }

  const stockResultante = esIngreso
    ? stockActual + (parseInt(cantidad, 10) || 0)
    : (parseInt(cantidad, 10) || 0)

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onCerrar}>
      <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">
            {esIngreso ? '+ Ingreso de stock' : '⟲ Ajuste de inventario'}
          </h2>
          <p className="text-muted text-sm mt-1">{producto.nombre}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border border-border rounded-lg py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted">Actual</p>
              <p className="text-xl font-bold tabular-nums">{stockActual}</p>
            </div>
            <div className="border border-border rounded-lg py-2 flex items-center justify-center text-2xl text-muted">
              {esIngreso ? '+' : '='}
            </div>
            <div className={`border rounded-lg py-2 ${esIngreso ? 'border-green-700/40 bg-green-500/5' : 'border-blue-700/40 bg-blue-500/5'}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted">
                {esIngreso ? 'Sumar' : 'Nuevo'}
              </p>
              <p className={`text-xl font-bold tabular-nums ${esIngreso ? 'text-green-400' : 'text-blue-400'}`}>
                {cantidad || 0}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">
              {esIngreso ? 'Cantidad a sumar' : 'Stock contado en bodega'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="input text-center text-2xl font-bold tabular-nums"
              placeholder="0"
              value={cantidad}
              onChange={e => setCantidad(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
            />
            <p className="text-xs text-muted mt-1.5 text-center">
              Stock final: <span className="text-white font-mono font-bold">{stockResultante}</span>
            </p>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Motivo (opcional)</label>
            <input
              className="input"
              placeholder={esIngreso ? 'Ej: Compra a proveedor X' : 'Ej: Conteo físico mensual'}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <button onClick={onCerrar} disabled={loading} className="btn-ghost">Cancelar</button>
          <button onClick={enviar} disabled={loading || !cantidad} className="btn-primary">
            {loading ? 'Guardando...' : esIngreso ? 'Registrar ingreso' : 'Aplicar ajuste'}
          </button>
        </div>
      </div>
    </div>
  )
}
