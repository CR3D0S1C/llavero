import { useState, useMemo } from 'react'
import { useModalClose } from '../hooks/useModalClose'

const METODOS = [
  { id: 'efectivo',      label: 'Efectivo',      icono: '💵', color: 'green' },
  { id: 'transferencia', label: 'Transferencia', icono: '🏦', color: 'blue' },
  { id: 'debito',        label: 'Débito',        icono: '💳', color: 'cyan' },
  { id: 'credito',       label: 'Crédito',       icono: '💳', color: 'purple' },
  { id: 'otro',          label: 'Otro',          icono: '📋', color: 'gray' },
]

function validarRut(rut) {
  if (!rut) return false
  const cleaned = rut.replace(/[.\-]/g, '').toUpperCase()
  if (cleaned.length < 2) return false
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  let suma = 0
  let multiplo = 2
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const dvEsperado = 11 - (suma % 11)
  const dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado)
  return dvCalc === dv
}

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')

export default function ModalDTE({ total, onConfirmar, onCancelar }) {
  // paso: 'tipo' → 'pago' → ('receptor' si factura) → confirmar
  const [paso, setPaso] = useState('tipo')
  const [tipo, setTipo] = useState(null)
  const [metodo, setMetodo] = useState(null)
  const [montoPagado, setMontoPagado] = useState('')
  const [codigoTransaccion, setCodigoTransaccion] = useState('')
  const [receptor, setReceptor] = useState({
    rut: '', razon: '', giro: '', direccion: '', comuna: '', ciudad: '', email: ''
  })
  const [rutError, setRutError] = useState(false)

  useModalClose(onCancelar)

  const vuelto = useMemo(() => {
    if (metodo !== 'efectivo' || !montoPagado) return null
    const v = Number(montoPagado) - Number(total)
    return v >= 0 ? v : null
  }, [metodo, montoPagado, total])

  const faltante = useMemo(() => {
    if (metodo !== 'efectivo' || !montoPagado) return null
    const v = Number(total) - Number(montoPagado)
    return v > 0 ? v : null
  }, [metodo, montoPagado, total])

  const handleRutBlur = () => {
    setRutError(receptor.rut.length > 0 && !validarRut(receptor.rut))
  }

  const seleccionarTipo = (t) => {
    setTipo(t)
    setPaso('pago')
  }

  const seleccionarMetodo = (m) => {
    setMetodo(m)
    setMontoPagado('')
    setCodigoTransaccion('')
  }

  const continuarDesdePago = () => {
    if (!metodo) return
    if (metodo === 'efectivo') {
      if (!montoPagado || Number(montoPagado) < Number(total)) return
    }
    if (tipo === 'factura') {
      setPaso('receptor')
    } else {
      confirmarFinal()
    }
  }

  const confirmarFinal = () => {
    if (tipo === 'factura') {
      if (!validarRut(receptor.rut)) { setRutError(true); return }
      if (!receptor.razon || !receptor.giro || !receptor.direccion) return
    }
    const pago = {
      metodoPago: metodo,
      montoPagado: metodo === 'efectivo' ? Number(montoPagado) : null,
      codigoTransaccion: metodo !== 'efectivo' ? codigoTransaccion.trim() || null : null,
    }
    onConfirmar(tipo, tipo === 'factura' ? receptor : null, pago)
  }

  const cuotaSugerencias = useMemo(() => {
    const t = Number(total)
    if (!t) return []
    const techo = Math.ceil(t / 1000) * 1000
    const opts = new Set([techo, techo + 1000, techo + 2000, techo + 5000, techo + 10000])
    if (t === techo) opts.delete(techo)
    return [...opts].filter(v => v > t && v <= t * 5).slice(0, 5)
  }, [total])

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div className="modal-panel w-full max-w-lg" onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {paso === 'tipo' && 'Documento Tributario'}
              {paso === 'pago' && 'Método de Pago'}
              {paso === 'receptor' && 'Datos del Receptor'}
            </h2>
            <p className="text-muted text-xs mt-0.5">
              Total: <span className="text-green-400 font-bold">${fmt(total)}</span>
              {tipo && <span> · {tipo === 'boleta' ? 'Boleta' : 'Factura'}</span>}
              {metodo && <span> · {METODOS.find(m => m.id === metodo)?.label}</span>}
            </p>
          </div>
          <button onClick={onCancelar} className="text-muted hover:text-white text-lg">✕</button>
        </div>

        {/* CONTENIDO */}
        <div className="p-5">

          {/* PASO 1: tipo de documento */}
          {paso === 'tipo' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => seleccionarTipo('boleta')}
                className="p-6 border-2 border-border hover:border-blue-500 rounded-xl text-center transition-all group"
              >
                <div className="text-4xl mb-3">🧾</div>
                <div className="font-bold text-lg group-hover:text-blue-400">Boleta</div>
                <div className="text-muted text-sm mt-1">Sin datos del receptor</div>
              </button>
              <button
                onClick={() => seleccionarTipo('factura')}
                className="p-6 border-2 border-border hover:border-purple-500 rounded-xl text-center transition-all group"
              >
                <div className="text-4xl mb-3">📄</div>
                <div className="font-bold text-lg group-hover:text-purple-400">Factura</div>
                <div className="text-muted text-sm mt-1">Con datos de empresa</div>
              </button>
            </div>
          )}

          {/* PASO 2: método de pago */}
          {paso === 'pago' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-2 block uppercase tracking-wider">¿Cómo paga?</label>
                <div className="grid grid-cols-5 gap-2">
                  {METODOS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => seleccionarMetodo(m.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        metodo === m.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border hover:border-gray-500 text-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{m.icono}</div>
                      <div className="text-[10px] font-semibold leading-tight">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Efectivo: monto + vuelto */}
              {metodo === 'efectivo' && (
                <div className="bg-green-900/15 border border-green-500/30 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted mb-1 block">Monto recibido</label>
                    <input
                      className="input text-2xl font-bold tabular-nums text-right"
                      type="number"
                      step="100"
                      min={total}
                      placeholder={`${total}`}
                      value={montoPagado}
                      onChange={e => setMontoPagado(e.target.value)}
                      autoFocus
                    />
                    {cuotaSugerencias.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cuotaSugerencias.map(v => (
                          <button
                            key={v}
                            onClick={() => setMontoPagado(String(v))}
                            className="text-xs px-2 py-1 rounded border border-border hover:border-accent text-gray-300 hover:text-accent transition-colors"
                          >
                            ${fmt(v)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                    <span className="text-sm text-muted">Vuelto a entregar</span>
                    {faltante ? (
                      <span className="text-red-400 font-bold tabular-nums">
                        Falta ${fmt(faltante)}
                      </span>
                    ) : vuelto !== null ? (
                      <span className={`text-2xl font-bold tabular-nums ${vuelto > 0 ? 'text-green-400' : 'text-muted'}`}>
                        ${fmt(vuelto)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </div>
              )}

              {/* No efectivo: código transacción */}
              {metodo && metodo !== 'efectivo' && (
                <div className="bg-blue-900/15 border border-blue-500/30 rounded-xl p-4">
                  <label className="text-xs text-muted mb-1 block">
                    Código de transacción / autorización
                    <span className="text-gray-500 ml-1">(opcional pero recomendado)</span>
                  </label>
                  <input
                    className="input font-mono"
                    placeholder="Ej: 123456 o número de operación"
                    value={codigoTransaccion}
                    onChange={e => setCodigoTransaccion(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted mt-2">
                    Mira el voucher de la máquina o el comprobante de la transferencia y copia el número de referencia.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: receptor factura */}
          {paso === 'receptor' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">RUT *</label>
                <input
                  className={`input ${rutError ? 'border-red-500' : ''}`}
                  placeholder="76.123.456-7"
                  value={receptor.rut}
                  onChange={e => { setReceptor(p => ({ ...p, rut: e.target.value })); setRutError(false) }}
                  onBlur={handleRutBlur}
                  autoFocus
                />
                {rutError && <p className="text-red-400 text-xs mt-1">RUT inválido</p>}
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Razón Social *</label>
                <input className="input" placeholder="Empresa SpA" value={receptor.razon}
                  onChange={e => setReceptor(p => ({ ...p, razon: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Giro *</label>
                <input className="input" placeholder="Servicios empresariales" value={receptor.giro}
                  onChange={e => setReceptor(p => ({ ...p, giro: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Dirección *</label>
                <input className="input" placeholder="Av. Ejemplo 123" value={receptor.direccion}
                  onChange={e => setReceptor(p => ({ ...p, direccion: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Comuna</label>
                  <input className="input" placeholder="Providencia" value={receptor.comuna}
                    onChange={e => setReceptor(p => ({ ...p, comuna: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Ciudad</label>
                  <input className="input" placeholder="Santiago" value={receptor.ciudad}
                    onChange={e => setReceptor(p => ({ ...p, ciudad: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Email</label>
                <input className="input" type="email" placeholder="contacto@empresa.cl" value={receptor.email}
                  onChange={e => setReceptor(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-border flex justify-between gap-3">
          <button
            onClick={() => {
              if (paso === 'tipo') { onCancelar(); return }
              if (paso === 'pago') { setPaso('tipo'); return }
              if (paso === 'receptor') { setPaso('pago'); return }
            }}
            className="btn-ghost text-sm"
          >
            {paso === 'tipo' ? 'Cancelar' : '← Volver'}
          </button>

          {paso === 'pago' && (
            <button
              onClick={continuarDesdePago}
              disabled={!metodo || (metodo === 'efectivo' && (!montoPagado || Number(montoPagado) < Number(total)))}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tipo === 'factura' ? 'Datos del receptor →' : 'Confirmar venta'}
            </button>
          )}

          {paso === 'receptor' && (
            <button onClick={confirmarFinal} className="btn-primary">
              Confirmar Factura
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
