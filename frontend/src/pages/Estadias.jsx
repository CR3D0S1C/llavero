import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getEstadiasActivas, agregarCargo, checkoutEstadia } from '../services/api'
import { toast } from '../utils/toast'

const METODOS_PAGO = ['efectivo', 'debito', 'credito', 'transferencia']

const fmtPeso = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`
const fmtFecha = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '—'
const noches = (a, b) => a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) : 0

const CARGO_INIT = { tipo: 'libre', descripcion: '', cantidad: 1, precioUnitario: '' }

export default function Estadias() {
  const [estadias, setEstadias] = useState([])
  const [loading, setLoading] = useState(true)

  const [cargoModal, setCargoModal] = useState(null) // ventaId
  const [cargo, setCargo] = useState(CARGO_INIT)
  const [guardandoCargo, setGuardandoCargo] = useState(false)

  const [checkoutModal, setCheckoutModal] = useState(null) // estadia obj
  const [checkout, setCheckout] = useState({ metodoPago: '', montoPagado: '', codigoTransaccion: '', tipoDte: 'boleta', observacion: '' })
  const [guardandoCheckout, setGuardandoCheckout] = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const r = await getEstadiasActivas()
      setEstadias(r.data)
    } catch {
      toast.error('Error al cargar estadías activas')
    } finally {
      setLoading(false)
    }
  }

  const abrirCargo = (ventaId) => {
    setCargo(CARGO_INIT)
    setCargoModal(ventaId)
  }

  const handleAgregarCargo = async (e) => {
    e.preventDefault()
    if (!cargo.descripcion.trim()) { toast.error('La descripción es requerida'); return }
    if (!cargo.precioUnitario || Number(cargo.precioUnitario) <= 0) { toast.error('El precio debe ser mayor a 0'); return }
    setGuardandoCargo(true)
    try {
      await agregarCargo(cargoModal, {
        tipo: cargo.tipo,
        descripcion: cargo.descripcion.trim(),
        cantidad: Number(cargo.cantidad),
        precioUnitario: Number(cargo.precioUnitario),
      })
      toast.success('Cargo agregado')
      setCargoModal(null)
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar cargo')
    } finally {
      setGuardandoCargo(false)
    }
  }

  const abrirCheckout = (estadia) => {
    setCheckout({ metodoPago: '', montoPagado: '', codigoTransaccion: '', tipoDte: 'boleta', observacion: '' })
    setCheckoutModal(estadia)
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!checkout.metodoPago) { toast.error('Selecciona un método de pago'); return }
    setGuardandoCheckout(true)
    try {
      await checkoutEstadia(checkoutModal.id, {
        metodoPago: checkout.metodoPago,
        montoPagado: checkout.metodoPago === 'efectivo' ? Number(checkout.montoPagado) : null,
        codigoTransaccion: checkout.codigoTransaccion || null,
        tipoDte: checkout.tipoDte,
        observacion: checkout.observacion || null,
      })
      toast.success(`Check-out realizado — Hab. ${checkoutModal.habitacionNumero}`)
      setCheckoutModal(null)
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar check-out')
    } finally {
      setGuardandoCheckout(false)
    }
  }

  const vuelto = checkoutModal && checkout.metodoPago === 'efectivo' && checkout.montoPagado
    ? Number(checkout.montoPagado) - Number(checkoutModal.total)
    : null

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🏠 Estadías Activas
              {estadias.length > 0 && (
                <span className="text-sm bg-accent text-white font-bold px-2 py-0.5 rounded-full">
                  {estadias.length}
                </span>
              )}
            </h1>
            <p className="text-muted text-sm mt-1">Huéspedes con estadía en curso</p>
          </div>
          <button onClick={cargar} className="btn-ghost text-sm py-1.5 px-3">↻ Actualizar</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="card animate-pulse h-36" />)}
          </div>
        ) : estadias.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-5xl mb-4">🏨</div>
            <p className="text-muted text-lg">No hay estadías activas en este momento</p>
            <p className="text-muted text-sm mt-1">Las estadías aparecen aquí cuando se hace check-in desde una reserva confirmada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {estadias.map(e => (
              <EstadiaCard
                key={e.id}
                estadia={e}
                onAgregarCargo={() => abrirCargo(e.id)}
                onCheckout={() => abrirCheckout(e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal agregar cargo */}
      {cargoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">+ Agregar cargo</h2>
              <button onClick={() => setCargoModal(null)} className="text-muted hover:text-white text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleAgregarCargo} className="space-y-4">
              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Descripción *</label>
                <input
                  type="text"
                  placeholder="Ej: Desayuno, minibar, lavandería..."
                  value={cargo.descripcion}
                  onChange={e => setCargo(c => ({ ...c, descripcion: e.target.value }))}
                  className="input w-full"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={cargo.cantidad}
                    onChange={e => setCargo(c => ({ ...c, cantidad: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Precio unit. *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={cargo.precioUnitario}
                    onChange={e => setCargo(c => ({ ...c, precioUnitario: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              {cargo.precioUnitario && cargo.cantidad && (
                <p className="text-sm text-accent font-medium">
                  Total: {fmtPeso(Number(cargo.precioUnitario) * Number(cargo.cantidad))}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={guardandoCargo} className="btn-primary flex-1 disabled:opacity-50">
                  {guardandoCargo ? 'Agregando...' : 'Agregar cargo'}
                </button>
                <button type="button" onClick={() => setCargoModal(null)} className="btn-ghost px-4">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal check-out */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                🏁 Check-out — Hab. {checkoutModal.habitacionNumero}
              </h2>
              <button onClick={() => setCheckoutModal(null)} className="text-muted hover:text-white text-xl leading-none">×</button>
            </div>

            {/* Resumen de cargos */}
            <div className="bg-white/5 rounded-xl p-4 mb-5">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Detalle de la estadía</p>
              <div className="space-y-2">
                {checkoutModal.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      {item.cantidad > 1 && <span className="text-muted mr-1">{item.cantidad}×</span>}
                      {item.descripcion}
                    </span>
                    <span className="font-medium">{fmtPeso(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-accent">{fmtPeso(checkoutModal.total)}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Método de pago */}
              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Método de pago *</label>
                <div className="grid grid-cols-2 gap-2">
                  {METODOS_PAGO.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCheckout(c => ({ ...c, metodoPago: m }))}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                        checkout.metodoPago === m
                          ? 'bg-accent text-white'
                          : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      {m === 'efectivo' ? '💵 Efectivo'
                       : m === 'debito' ? '💳 Débito'
                       : m === 'credito' ? '💳 Crédito'
                       : '🏦 Transferencia'}
                    </button>
                  ))}
                </div>
              </div>

              {checkout.metodoPago === 'efectivo' && (
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Monto recibido</label>
                  <input
                    type="number"
                    placeholder={String(checkoutModal.total)}
                    value={checkout.montoPagado}
                    onChange={e => setCheckout(c => ({ ...c, montoPagado: e.target.value }))}
                    className="input w-full"
                  />
                  {vuelto !== null && (
                    <p className={`mt-1.5 text-sm font-medium ${vuelto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {vuelto >= 0 ? `Vuelto: ${fmtPeso(vuelto)}` : `Falta: ${fmtPeso(Math.abs(vuelto))}`}
                    </p>
                  )}
                </div>
              )}

              {(checkout.metodoPago === 'debito' || checkout.metodoPago === 'credito' || checkout.metodoPago === 'transferencia') && (
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">
                    Código de transacción <span className="normal-case text-gray-600">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="N° de operación..."
                    value={checkout.codigoTransaccion}
                    onChange={e => setCheckout(c => ({ ...c, codigoTransaccion: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Tipo documento</label>
                <div className="flex gap-2">
                  {['boleta', 'factura'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCheckout(c => ({ ...c, tipoDte: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        checkout.tipoDte === t ? 'bg-accent text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {t === 'boleta' ? '🧾 Boleta' : '📄 Factura'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">
                  Observación <span className="normal-case text-gray-600">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Notas internas..."
                  value={checkout.observacion}
                  onChange={e => setCheckout(c => ({ ...c, observacion: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={guardandoCheckout} className="btn-primary flex-1 disabled:opacity-50">
                  {guardandoCheckout ? 'Procesando...' : '🏁 Confirmar check-out'}
                </button>
                <button type="button" onClick={() => setCheckoutModal(null)} className="btn-ghost px-4">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EstadiaCard({ estadia: e, onAgregarCargo, onCheckout }) {
  const [expanded, setExpanded] = useState(false)
  const n = noches(e.fechaEntrada, e.fechaSalida)
  const diasRestantes = e.fechaSalida
    ? Math.ceil((new Date(e.fechaSalida + 'T12:00:00') - new Date()) / 86400000)
    : null

  return (
    <div className="card hover:border-border/80 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <p className="font-semibold text-base">{e.huespedNombre || 'Huésped'}</p>
              </div>
              <p className="text-muted text-sm">{e.huespedEmail || ''}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-accent">{fmtPeso(e.total)}</p>
              <p className="text-xs text-muted">{e.items?.length || 0} cargo{e.items?.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Habitación</p>
              <p className="font-medium">N° {e.habitacionNumero}</p>
              <p className="text-xs text-muted">{e.habitacionTipo}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Check-in</p>
              <p className="font-medium">{fmtFecha(e.fechaEntrada)}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Check-out</p>
              <p className="font-medium">{fmtFecha(e.fechaSalida)}</p>
              {diasRestantes !== null && (
                <p className={`text-xs ${diasRestantes <= 0 ? 'text-red-400' : diasRestantes === 1 ? 'text-yellow-400' : 'text-muted'}`}>
                  {diasRestantes <= 0 ? 'Vence hoy' : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Estadía</p>
              <p className="font-medium">{n} {n === 1 ? 'noche' : 'noches'}</p>
            </div>
          </div>

          {/* Items expandibles */}
          {e.items?.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(x => !x)}
                className="text-xs text-muted hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                {expanded ? '▲' : '▼'} Ver detalle de cargos
              </button>
              {expanded && (
                <div className="mt-2 space-y-1 pl-2 border-l-2 border-border">
                  {e.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-400">
                      <span>
                        {item.cantidad > 1 && <span className="text-gray-600 mr-1">{item.cantidad}×</span>}
                        {item.descripcion}
                      </span>
                      <span>{fmtPeso(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex md:flex-col gap-2 shrink-0">
          <button
            onClick={onCheckout}
            className="btn-primary text-sm py-1.5 px-4"
          >
            🏁 Check-out
          </button>
          <button
            onClick={onAgregarCargo}
            className="btn-ghost text-sm py-1.5 px-4"
          >
            + Cargo
          </button>
        </div>
      </div>
    </div>
  )
}
