import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getResumenTurno, cerrarTurno } from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'

// Denominaciones del peso chileno con colores inspirados en los billetes reales
const DENOMINACIONES = [
  { key: 'b20000', valor: 20000, label: '$20.000', sublabel: 'billete', accent: 'from-orange-500/15 to-orange-700/10 border-orange-700/40', text: 'text-orange-300' },
  { key: 'b10000', valor: 10000, label: '$10.000', sublabel: 'billete', accent: 'from-indigo-500/15 to-indigo-700/10 border-indigo-700/40', text: 'text-indigo-300' },
  { key: 'b5000',  valor: 5000,  label: '$5.000',  sublabel: 'billete', accent: 'from-rose-500/15 to-rose-700/10 border-rose-700/40',    text: 'text-rose-300' },
  { key: 'b2000',  valor: 2000,  label: '$2.000',  sublabel: 'billete', accent: 'from-violet-500/15 to-violet-700/10 border-violet-700/40', text: 'text-violet-300' },
  { key: 'b1000',  valor: 1000,  label: '$1.000',  sublabel: 'billete', accent: 'from-emerald-500/15 to-emerald-700/10 border-emerald-700/40', text: 'text-emerald-300' },
  { key: 'm500',   valor: 500,   label: '$500',    sublabel: 'moneda',  accent: 'from-amber-500/10 to-amber-700/5 border-amber-700/30',  text: 'text-amber-300' },
  { key: 'm100',   valor: 100,   label: '$100',    sublabel: 'moneda',  accent: 'from-yellow-500/10 to-yellow-700/5 border-yellow-700/30', text: 'text-yellow-300' },
  { key: 'm50',    valor: 50,    label: '$50',     sublabel: 'moneda',  accent: 'from-zinc-500/10 to-zinc-700/5 border-zinc-600/30',     text: 'text-zinc-300' },
  { key: 'm10',    valor: 10,    label: '$10',     sublabel: 'moneda',  accent: 'from-stone-500/10 to-stone-700/5 border-stone-600/30',  text: 'text-stone-300' },
]

const PAGOS_CFG = [
  { key: 'efectivo',       label: 'Efectivo',        hint: 'Dinero en caja',         icon: '💵', ring: 'focus:border-emerald-500 focus:ring-emerald-500/20', dot: 'bg-emerald-500' },
  { key: 'transferencia',  label: 'Transferencia',   hint: 'Recibidas hoy',          icon: '🏦', ring: 'focus:border-blue-500 focus:ring-blue-500/20',       dot: 'bg-blue-500' },
  { key: 'tarjetaDebito',  label: 'Tarjeta Débito',  hint: 'POS / Webpay',           icon: '💳', ring: 'focus:border-cyan-500 focus:ring-cyan-500/20',       dot: 'bg-cyan-500' },
  { key: 'tarjetaCredito', label: 'Tarjeta Crédito', hint: 'POS / Webpay',           icon: '💎', ring: 'focus:border-violet-500 focus:ring-violet-500/20',   dot: 'bg-violet-500' },
  { key: 'otro',           label: 'Otro',            hint: 'Vales, fiado, etc.',     icon: '📋', ring: 'focus:border-gray-500 focus:ring-gray-500/20',       dot: 'bg-gray-500' },
]

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')

const initialConteo = DENOMINACIONES.reduce((a, d) => ({ ...a, [d.key]: '' }), {})
const initialPagos = PAGOS_CFG.reduce((a, p) => ({ ...a, [p.key]: '' }), {})

export default function CierreTurno() {
  const [paso, setPaso] = useState(1)
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagos, setPagos] = useState(initialPagos)
  const [conteo, setConteo] = useState(initialConteo)
  const [observacion, setObservacion] = useState('')
  const [pin, setPin] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { logout } = useSesion()
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await getResumenTurno()
      setResumen(res.data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'No hay turno activo')
      setResumen(null)
    } finally { setLoading(false) }
  }

  // Cálculos derivados
  const totalDeclarado = useMemo(() =>
    Object.values(pagos).reduce((s, v) => s + (Number(v) || 0), 0)
  , [pagos])

  const efectivoDeclarado = Number(pagos.efectivo) || 0

  const totalConteoEfectivo = useMemo(() =>
    DENOMINACIONES.reduce((s, d) => s + d.valor * (Number(conteo[d.key]) || 0), 0)
  , [conteo])

  const totalSistema = resumen?.totalSistema || 0
  const diferencia = totalDeclarado - totalSistema
  const efectivoDiff = totalConteoEfectivo - efectivoDeclarado

  const horas = resumen ? Math.floor(resumen.duracionMinutos / 60) : 0
  const minutos = resumen ? resumen.duracionMinutos % 60 : 0

  const setPago = (key, val) => setPagos(p => ({ ...p, [key]: val.replace(/[^0-9]/g, '') }))
  const setConteoKey = (key, val) => setConteo(c => ({ ...c, [key]: val.replace(/[^0-9]/g, '') }))

  const requiereObs = diferencia !== 0
  const puedeFirmar = pin.length === 4 && (!requiereObs || observacion.trim().length > 0)

  const enviar = async () => {
    setEnviando(true)
    try {
      const payload = {
        ...Object.fromEntries(PAGOS_CFG.map(p => [p.key, Number(pagos[p.key]) || 0])),
        ...Object.fromEntries(DENOMINACIONES.map(d => [d.key, Number(conteo[d.key]) || 0])),
        observacion: observacion.trim() || null,
        pin,
      }
      await cerrarTurno(payload)
      toast.success('Turno cerrado y arqueo registrado')
      logout()
      navigate('/')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al cerrar turno')
      setEnviando(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="p-6 text-muted">Cargando arqueo...</div>
    </div>
  )

  if (!resumen) return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="card text-center py-12">
          <p className="text-muted">No hay turno activo para cerrar</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Ir al Dashboard</button>
        </div>
      </div>
    </div>
  )

  const pasos = ['Resumen', 'Desglose y Conteo', 'Firma']

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Encabezado documento */}
        <header className="mb-6">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Cierre de Turno</p>
              <h1 className="text-3xl font-bold mt-1">Arqueo de Caja</h1>
            </div>
            <div className="text-right text-xs text-muted">
              <p>Cajero · <span className="text-gray-300 font-medium">{resumen.cajeroNombre}</span></p>
              <p>Inicio · <span className="text-gray-300 font-medium font-mono">{new Date(resumen.inicio).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span></p>
            </div>
          </div>
        </header>

        {/* Stepper */}
        <Stepper paso={paso} pasos={pasos} setPaso={setPaso} />

        {/* Paso 1 — Resumen */}
        {paso === 1 && (
          <section className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total recaudado"   value={`$${fmt(totalSistema)}`} highlight />
              <Stat label="Ventas"            value={resumen.cantidadVentas} />
              <Stat label="Boletas"           value={resumen.cantidadBoletas} />
              <Stat label="Facturas"          value={resumen.cantidadFacturas} />
              <Stat label="Mov. habitaciones" value={resumen.movimientosHabitaciones} />
              <Stat label="Limpiezas"         value={resumen.limpiezasRealizadas} />
              <Stat label="Duración"          value={`${horas}h ${minutos}m`} />
              <Stat label="Promedio venta"    value={`$${fmt(resumen.cantidadVentas ? Math.round(totalSistema / resumen.cantidadVentas) : 0)}`} />
            </div>

            {/* Habitaciones vendidas */}
            {resumen.habitacionesTop?.length > 0 && (
              <DocCard title="Habitaciones vendidas">
                {resumen.habitacionesTop.map(h => (
                  <DocRow key={h.tipo}
                    left={h.tipo}
                    center={`× ${h.cantidad}`}
                    right={`$${fmt(h.total)}`}
                  />
                ))}
              </DocCard>
            )}

            {/* Productos top */}
            {resumen.productosTop?.length > 0 && (
              <DocCard title="Productos vendidos">
                {resumen.productosTop.map(p => (
                  <DocRow key={p.nombre}
                    left={p.nombre}
                    center={`× ${p.cantidad}`}
                    right={`$${fmt(p.total)}`}
                  />
                ))}
              </DocCard>
            )}

            <div className="flex justify-end">
              <button onClick={() => setPaso(2)} className="btn-primary px-6">
                Continuar al desglose →
              </button>
            </div>
          </section>
        )}

        {/* Paso 2 — Desglose y Conteo */}
        {paso === 2 && (
          <section className="space-y-4 animate-fade-in">
            {/* Desglose por método de pago */}
            <DocCard title="Desglose por método de pago" subtitle="Declara cuánto recibiste en cada uno">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {PAGOS_CFG.map(p => (
                  <PaymentInput key={p.key} cfg={p}
                    value={pagos[p.key]}
                    onChange={v => setPago(p.key, v)}
                  />
                ))}
              </div>

              <DiffBar
                className="mt-5"
                label="Total declarado"
                value={totalDeclarado}
                refLabel="Total sistema"
                refValue={totalSistema}
                diff={diferencia}
              />
            </DocCard>

            {/* Conteo de efectivo */}
            <DocCard
              title="Conteo de efectivo"
              subtitle="Contar billetes y monedas de la caja"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
                {DENOMINACIONES.map(d => (
                  <Denominacion key={d.key} d={d}
                    cantidad={conteo[d.key]}
                    onChange={v => setConteoKey(d.key, v)}
                  />
                ))}
              </div>

              <DiffBar
                className="mt-5"
                label="Total contado"
                value={totalConteoEfectivo}
                refLabel="Efectivo declarado"
                refValue={efectivoDeclarado}
                diff={efectivoDiff}
                neutral
              />
            </DocCard>

            <div className="flex justify-between">
              <button onClick={() => setPaso(1)} className="btn-ghost">← Volver</button>
              <button onClick={() => setPaso(3)} className="btn-primary px-6">
                Continuar a la firma →
              </button>
            </div>
          </section>
        )}

        {/* Paso 3 — Firma */}
        {paso === 3 && (
          <section className="space-y-4 animate-fade-in">
            {/* Resumen final */}
            <DocCard title="Confirmar arqueo">
              <dl className="divide-y divide-border/50 mt-2 font-mono text-sm">
                <FinalRow label="Total del sistema" value={`$${fmt(totalSistema)}`} />
                <FinalRow label="Total declarado"   value={`$${fmt(totalDeclarado)}`} />
                <FinalRow label="Total contado en efectivo" value={`$${fmt(totalConteoEfectivo)}`} muted />
                <FinalRow label="Diferencia"
                  value={`${diferencia >= 0 ? '+' : ''}$${fmt(diferencia)}`}
                  highlight={diferencia !== 0}
                  color={diferencia === 0 ? 'text-green-400' : Math.abs(diferencia) < 1000 ? 'text-amber-400' : 'text-red-400'}
                />
              </dl>
            </DocCard>

            {/* Observación */}
            <DocCard
              title={requiereObs ? 'Observación (obligatoria)' : 'Observación'}
              subtitle={requiereObs
                ? 'Hay una diferencia entre lo declarado y el sistema. Explica brevemente.'
                : 'Opcional. Cualquier nota para el jefe.'}
            >
              <textarea
                className="input mt-2 min-h-[90px] resize-none font-sans"
                placeholder={requiereObs
                  ? 'Ej: Faltaron $500 al cierre, posible vuelto mal entregado.'
                  : 'Sin novedades.'}
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
              />
            </DocCard>

            {/* PIN */}
            <DocCard title="Firma del cajero" subtitle="Confirma con tu PIN para cerrar el turno">
              <PinPad pin={pin} setPin={setPin} />
            </DocCard>

            <div className="sticky bottom-4 z-30">
              <div className="card border-accent/40 bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3 shadow-2xl">
                <button onClick={() => setPaso(2)} className="btn-ghost shrink-0" disabled={enviando}>
                  ← Volver
                </button>
                <div className="text-xs text-muted hidden sm:block flex-1 text-center">
                  {!puedeFirmar
                    ? requiereObs && observacion.trim().length === 0
                      ? 'Falta la observación obligatoria'
                      : 'Ingresa tu PIN de 4 dígitos'
                    : 'Listo para cerrar'}
                </div>
                <button
                  onClick={enviar}
                  disabled={!puedeFirmar || enviando}
                  className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {enviando ? 'Cerrando...' : '🔒 Firmar y Cerrar'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/* ────────── Subcomponentes ────────── */

function Stepper({ paso, pasos, setPaso }) {
  return (
    <div className="card mb-5 py-4">
      <div className="flex items-center gap-2 sm:gap-4">
        {pasos.map((label, i) => {
          const n = i + 1
          const activo = paso === n
          const completado = paso > n
          return (
            <button
              key={label}
              onClick={() => n < paso && setPaso(n)}
              disabled={n > paso}
              className="flex items-center gap-2 flex-1 group disabled:cursor-not-allowed"
            >
              <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                activo ? 'border-accent bg-accent text-white scale-110'
                : completado ? 'border-accent/60 bg-accent/15 text-accent'
                : 'border-border text-muted'
              }`}>
                {completado ? '✓' : n}
              </div>
              <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                activo ? 'text-white' : completado ? 'text-gray-300' : 'text-muted'
              }`}>{label}</span>
              {i < pasos.length - 1 && (
                <div className={`h-px flex-1 hidden sm:block transition-colors ${
                  completado ? 'bg-accent/40' : 'bg-border'
                }`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight = false }) {
  return (
    <div className={`card py-3 ${highlight ? 'bg-gradient-to-br from-accent/15 to-card border-accent/40' : ''}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-bold tabular-nums ${highlight ? 'text-accent text-xl' : 'text-lg text-gray-100'}`}>
        {value}
      </p>
    </div>
  )
}

function DocCard({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="border-b border-border/60 pb-3 mb-3">
        <h2 className="font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function DocRow({ left, center, right }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm border-b border-border/30 last:border-0">
      <span className="text-gray-300 truncate flex-1">{left}</span>
      <span className="text-muted font-mono text-xs shrink-0">{center}</span>
      <span className="text-green-400 font-semibold font-mono tabular-nums shrink-0 w-24 text-right">{right}</span>
    </div>
  )
}

function PaymentInput({ cfg, value, onChange }) {
  return (
    <label className="block group">
      <span className="flex items-center gap-2 text-xs text-muted mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span>{cfg.label}</span>
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">$</span>
        <input
          inputMode="numeric"
          className={`input pl-7 pr-3 tabular-nums text-right ${cfg.ring} font-mono`}
          placeholder="0"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      <p className="text-[10px] text-muted/70 mt-1">{cfg.hint}</p>
    </label>
  )
}

function Denominacion({ d, cantidad, onChange }) {
  const subtotal = d.valor * (Number(cantidad) || 0)
  return (
    <div className={`bg-gradient-to-br ${d.accent} border rounded-lg p-2.5 transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className={`font-bold font-mono ${d.text}`}>{d.label}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted">{d.sublabel}</p>
        </div>
        <input
          inputMode="numeric"
          className="bg-black/30 border border-border/60 rounded-md w-16 px-2 py-1 text-right tabular-nums text-base font-bold focus:outline-none focus:border-accent transition-colors"
          placeholder="0"
          value={cantidad}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      <div className="text-right text-xs font-mono tabular-nums text-gray-400 border-t border-border/30 pt-1">
        = ${fmt(subtotal)}
      </div>
    </div>
  )
}

function DiffBar({ label, value, refLabel, refValue, diff, neutral = false, className = '' }) {
  const status = diff === 0
    ? { color: 'text-green-400', bg: 'bg-green-500/10 border-green-700/40', text: 'Cuadra exacto' }
    : Math.abs(diff) < 1000
    ? { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-700/40', text: diff > 0 ? `Sobran $${fmt(diff)}` : `Faltan $${fmt(-diff)}` }
    : { color: 'text-red-400',   bg: 'bg-red-500/10 border-red-700/40',     text: diff > 0 ? `Sobran $${fmt(diff)}` : `Faltan $${fmt(-diff)}` }

  return (
    <div className={`border rounded-lg p-3 ${neutral ? 'bg-card/50 border-border' : status.bg} ${className}`}>
      <div className="grid grid-cols-3 gap-3 items-center text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
          <p className="font-bold tabular-nums text-base mt-0.5">${fmt(value)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted">{refLabel}</p>
          <p className="font-mono tabular-nums text-base mt-0.5 text-gray-400">${fmt(refValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted">Diferencia</p>
          <p className={`font-bold tabular-nums text-base mt-0.5 ${neutral ? (diff === 0 ? 'text-green-400' : 'text-amber-400') : status.color}`}>
            {diff === 0 ? '$0' : (diff > 0 ? '+' : '−') + '$' + fmt(Math.abs(diff))}
          </p>
        </div>
      </div>
      {!neutral && (
        <p className={`text-center text-xs mt-2 font-medium ${status.color}`}>
          {status.text}
        </p>
      )}
    </div>
  )
}

function FinalRow({ label, value, color, highlight, muted }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${highlight ? 'font-bold' : ''}`}>
      <span className={muted ? 'text-muted' : 'text-gray-300'}>{label}</span>
      <span className={`tabular-nums ${color || 'text-white'} ${muted ? 'text-sm' : 'text-base'}`}>
        {value}
      </span>
    </div>
  )
}

function PinPad({ pin, setPin }) {
  const presionar = (d) => setPin(p => p.length < 4 ? p + d : p)
  const borrar = () => setPin(p => p.slice(0, -1))
  const teclas = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="max-w-xs mx-auto mt-2">
      <div className="flex justify-center gap-3 mb-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
            pin.length > i ? 'border-accent bg-accent/15 text-accent scale-105' : 'border-border'
          }`}>
            {pin.length > i ? '●' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {teclas.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => t === '⌫' ? borrar() : t !== '' ? presionar(t) : null}
            disabled={t === ''}
            className={`h-12 rounded-xl text-lg font-bold transition-all select-none active:scale-95 ${
              t === '' ? 'opacity-0 pointer-events-none'
              : t === '⌫' ? 'border border-border hover:border-red-500 hover:text-red-400 text-muted'
              : 'border border-border hover:border-accent hover:bg-accent/10 text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
