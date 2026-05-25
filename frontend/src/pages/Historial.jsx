import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ComprobanteVenta from '../components/ComprobanteVenta'
import { getVentas, anularVenta } from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'

const FILTROS = [
  { label: 'Mi turno', value: 'turno' },
  { label: 'Hoy', value: 'hoy' },
  { label: 'Semana', value: 'semana' },
  { label: 'Todo', value: 'todo' },
]

const METODO_BADGE = {
  efectivo:      { label: 'Efectivo',      icono: '💵', clase: 'bg-green-900/40 text-green-300' },
  transferencia: { label: 'Transferencia', icono: '🏦', clase: 'bg-blue-900/40 text-blue-300' },
  debito:        { label: 'Débito',        icono: '💳', clase: 'bg-cyan-900/40 text-cyan-300' },
  credito:       { label: 'Crédito',       icono: '💳', clase: 'bg-purple-900/40 text-purple-300' },
  otro:          { label: 'Otro',          icono: '📋', clase: 'bg-gray-700/40 text-gray-300' },
}

export default function Historial() {
  const [ventas, setVentas] = useState([])
  const [filtro, setFiltro] = useState('turno')
  const [loading, setLoading] = useState(true)
  const { sesion } = useSesion()

  useEffect(() => { cargar() }, [filtro])

  const cargar = async () => {
    setLoading(true)
    try {
      const params = filtro === 'turno' ? { turno: sesion?.turnoId } : { periodo: filtro }
      const res = await getVentas(params)
      setVentas(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const [anulando, setAnulando] = useState(null)
  const [claveAnul, setClaveAnul] = useState('')
  const [imprimiendo, setImprimiendo] = useState(null)

  const anular = async (id) => {
    try {
      await anularVenta(id, claveAnul)
      setVentas(prev => prev.filter(v => v.id !== id))
      setAnulando(null)
      setClaveAnul('')
      toast.success('Venta anulada')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Clave incorrecta')
      setClaveAnul('')
    }
  }

  const totalFiltrado = ventas.reduce((s, v) => s + Number(v.total), 0)

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Historial de Ventas</h1>
          <div className="text-sm text-muted">Total: <span className="text-green-400 font-bold">${totalFiltrado.toLocaleString('es-CL')}</span></div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {(sesion?.rol === 'jefe' ? FILTROS : FILTROS.slice(0, 1)).map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtro === f.value ? 'bg-accent text-white' : 'border border-border text-muted hover:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : ventas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted">No hay ventas en este período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ventas.map(v => (
              <div key={v.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold">{v.habitacionNumero} — {v.habitacionTipo}</span>
                      <span className={`badge-${v.tipoDte}`}>{v.tipoDte}</span>
                      {v.dteEstado && <span className={`badge-${v.dteEstado}`}>{v.dteEstado}</span>}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {v.fecha} {v.hora?.slice(0,5)} · {v.cajero}
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {v.items?.map((item, i) => (
                        <div key={i} className="text-sm text-gray-400 flex items-center gap-2">
                          {item.esLibre && <span className="text-xs bg-yellow-900/40 text-yellow-400 px-1 rounded">LIBRE</span>}
                          <span>{item.descripcion}</span>
                          {item.cantidad > 1 && <span className="text-xs text-muted">x{item.cantidad}</span>}
                          <span className="ml-auto text-green-400">${Number(item.subtotal).toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                    {v.tipoDte === 'factura' && v.receptorRut && (
                      <div className="text-xs text-purple-400 mt-2">
                        📄 {v.receptorRazon} · {v.receptorRut}
                      </div>
                    )}
                    {v.metodoPago && (
                      <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${METODO_BADGE[v.metodoPago]?.clase || 'bg-gray-700/40 text-gray-300'}`}>
                          {METODO_BADGE[v.metodoPago]?.icono} {METODO_BADGE[v.metodoPago]?.label || v.metodoPago}
                        </span>
                        {v.metodoPago === 'efectivo' && v.montoPagado != null && (
                          <span className="text-muted">
                            Recibió ${Number(v.montoPagado).toLocaleString('es-CL')}
                            {Number(v.vuelto) > 0 && <> · Vuelto ${Number(v.vuelto).toLocaleString('es-CL')}</>}
                          </span>
                        )}
                        {v.metodoPago !== 'efectivo' && v.codigoTransaccion && (
                          <span className="text-muted font-mono">Ref: {v.codigoTransaccion}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-green-400">${Number(v.total).toLocaleString('es-CL')}</div>
                    {anulando === v.id ? (
                      <div className="flex items-center gap-1 mt-2">
                        <input
                          className="input py-0.5 px-2 text-xs w-20 text-center tracking-widest"
                          type="password"
                          maxLength={4}
                          placeholder="Clave"
                          value={claveAnul}
                          onChange={e => setClaveAnul(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && anular(v.id)}
                          autoFocus
                        />
                        <button onClick={() => anular(v.id)} className="text-xs text-red-400 hover:text-red-300">OK</button>
                        <button onClick={() => { setAnulando(null); setClaveAnul('') }} className="text-xs text-muted hover:text-gray-300">✕</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1 mt-2">
                        <button
                          onClick={() => setImprimiendo(v)}
                          className="text-muted hover:text-white text-xs"
                          title="Reimprimir comprobante"
                        >
                          🖨 Imprimir
                        </button>
                        <button
                          onClick={() => { setAnulando(v.id); setClaveAnul('') }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Anular
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {imprimiendo && (
        <ComprobanteVenta
          venta={imprimiendo}
          onCerrar={() => setImprimiendo(null)}
          onContinuar={() => setImprimiendo(null)}
        />
      )}
    </div>
  )
}
