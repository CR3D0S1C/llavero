import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getReservas, crearReservaAdmin, confirmarReserva, completarReserva, cancelarReservaAdmin, checkinReserva, getHabitaciones } from '../services/api'
import { toast } from '../utils/toast'

const TABS = [
  { key: 'pendiente',  label: 'Pendientes',  color: 'text-yellow-400', dot: 'bg-yellow-400' },
  { key: 'confirmada', label: 'Confirmadas', color: 'text-blue-400',   dot: 'bg-blue-400'   },
  { key: 'historial',  label: 'Historial',   color: 'text-gray-400',   dot: 'bg-gray-500'   },
]

const ESTADO_LABEL = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-600/30' },
  confirmada: { label: 'Confirmada', cls: 'bg-blue-500/10 text-blue-400 border-blue-600/30'       },
  cancelada:  { label: 'Cancelada',  cls: 'bg-red-500/10 text-red-400 border-red-600/30'          },
  completada: { label: 'Completada', cls: 'bg-green-500/10 text-green-400 border-green-600/30'    },
}

const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
const noches = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

const FORM_INIT = {
  habitacionId: '',
  fechaEntrada: '',
  fechaSalida: '',
  nombreHuesped: '',
  emailHuesped: '',
  telefonoHuesped: '',
  notas: '',
}

export default function Reservas() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendiente')
  const [accionando, setAccionando] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [habitaciones, setHabitaciones] = useState([])
  const [form, setForm] = useState(FORM_INIT)
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState('')

  const [checkinReservaData, setCheckinReservaData] = useState(null)
  const [checkinando, setCheckinando] = useState(false)

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (showModal && habitaciones.length === 0) {
      getHabitaciones().then(r => setHabitaciones(r.data)).catch(() => {})
    }
  }, [showModal])

  const cargar = async () => {
    try {
      const r = await getReservas()
      setReservas(r.data)
    } catch {
      toast.error('Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = () => {
    setForm(FORM_INIT)
    setFormError('')
    setShowModal(true)
  }

  const handleCrear = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.habitacionId) { setFormError('Selecciona una habitación'); return }
    if (!form.fechaEntrada || !form.fechaSalida) { setFormError('Las fechas son requeridas'); return }
    if (!form.nombreHuesped.trim()) { setFormError('El nombre del huésped es requerido'); return }
    setGuardando(true)
    try {
      await crearReservaAdmin({
        habitacionId: form.habitacionId,
        fechaEntrada: form.fechaEntrada,
        fechaSalida: form.fechaSalida,
        nombreHuesped: form.nombreHuesped,
        emailHuesped: form.emailHuesped || null,
        telefonoHuesped: form.telefonoHuesped || null,
        notas: form.notas || null,
      })
      toast.success('Reserva creada y confirmada')
      setShowModal(false)
      await cargar()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear la reserva')
    } finally {
      setGuardando(false)
    }
  }

  const accion = async (fn, id, msg) => {
    setAccionando(id)
    try {
      await fn(id)
      toast.success(msg)
      await cargar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al procesar')
    } finally {
      setAccionando(null)
    }
  }

  const handleCheckin = async () => {
    if (!checkinReservaData) return
    setCheckinando(true)
    try {
      await checkinReserva(checkinReservaData.id)
      toast.success(`Check-in realizado — Hab. ${checkinReservaData.habitacionNumero} ocupada`)
      setCheckinReservaData(null)
      await cargar()
      navigate('/estadias')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al realizar check-in')
    } finally {
      setCheckinando(false)
    }
  }

  const historial = ['cancelada', 'completada']
  const filtradas = tab === 'historial'
    ? reservas.filter(r => historial.includes(r.estado))
    : reservas.filter(r => r.estado === tab)

  const pendienteCount = reservas.filter(r => r.estado === 'pendiente').length

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📅 Reservas Online
              {pendienteCount > 0 && (
                <span className="text-sm bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full">
                  {pendienteCount} nueva{pendienteCount !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
            <p className="text-muted text-sm mt-1">Gestión de reservas del sitio público</p>
          </div>
          <div className="flex gap-2">
            <button onClick={abrirModal} className="btn-primary text-sm py-1.5 px-4">
              + Nueva reserva
            </button>
            <button onClick={cargar} className="btn-ghost text-sm py-1.5 px-3">
              ↻ Actualizar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                tab === t.key
                  ? `${t.color} border-b-2 border-current -mb-px`
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.key !== 'historial' && (
                <span className={`w-2 h-2 rounded-full ${t.dot}`} />
              )}
              {t.label}
              {t.key !== 'historial' && (
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                  {t.key === 'historial' ? '' : reservas.filter(r => r.estado === t.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card animate-pulse h-28" />
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-3">
              {tab === 'pendiente' ? '✅' : tab === 'confirmada' ? '📋' : '🗂️'}
            </div>
            <p className="text-muted">
              {tab === 'pendiente' ? 'No hay reservas pendientes de confirmación'
               : tab === 'confirmada' ? 'No hay reservas confirmadas activas'
               : 'El historial está vacío'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(r => (
              <ReservaCard
                key={r.id}
                reserva={r}
                accionando={accionando}
                onConfirmar={() => accion(confirmarReserva, r.id, 'Reserva confirmada')}
                onCompletar={() => accion(completarReserva, r.id, 'Reserva marcada como completada')}
                onCheckin={() => setCheckinReservaData(r)}
                onCancelar={() => {
                  if (window.confirm(`¿Cancelar la reserva de ${r.huespedNombre}?`))
                    accion(cancelarReservaAdmin, r.id, 'Reserva cancelada')
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Check-in */}
      {checkinReservaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">🛎️ Confirmar Check-in</h2>
              <button onClick={() => setCheckinReservaData(null)} className="text-muted hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-4 space-y-2">
                <p className="text-base font-semibold">{checkinReservaData.huespedNombre}</p>
                <p className="text-sm text-muted">{checkinReservaData.huespedEmail}</p>
                <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Habitación</p>
                    <p className="font-medium">N° {checkinReservaData.habitacionNumero}</p>
                    <p className="text-xs text-muted">{checkinReservaData.habitacionTipo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Noches</p>
                    <p className="font-medium">{noches(checkinReservaData.fechaEntrada, checkinReservaData.fechaSalida)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Total est.</p>
                    <p className="font-medium text-accent">
                      {checkinReservaData.montoEstimado
                        ? `$${Number(checkinReservaData.montoEstimado).toLocaleString('es-CL')}`
                        : '—'}
                    </p>
                  </div>
                </div>
                {checkinReservaData.notas && (
                  <p className="text-xs text-muted italic border-l-2 border-border pl-2 mt-2">{checkinReservaData.notas}</p>
                )}
              </div>
              <p className="text-sm text-muted">
                Se creará una estadía activa. El cobro se registra al hacer check-out.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCheckin}
                disabled={checkinando}
                className="flex-1 py-2.5 rounded-lg font-medium bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50"
              >
                {checkinando ? 'Procesando...' : '🛎️ Iniciar estadía'}
              </button>
              <button onClick={() => setCheckinReservaData(null)} className="btn-ghost px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva reserva */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Nueva reserva</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              {/* Habitación */}
              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Habitación *</label>
                <select
                  value={form.habitacionId}
                  onChange={e => setForm(f => ({ ...f, habitacionId: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Seleccionar habitación...</option>
                  {habitaciones.map(h => (
                    <option key={h.id} value={h.id}>
                      N° {h.numero} — {h.tipoLabel || 'Sin tipo'} ({h.estado})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Check-in *</label>
                  <input
                    type="date"
                    value={form.fechaEntrada}
                    onChange={e => setForm(f => ({ ...f, fechaEntrada: e.target.value, fechaSalida: '' }))}
                    className="input w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Check-out *</label>
                  <input
                    type="date"
                    value={form.fechaSalida}
                    onChange={e => setForm(f => ({ ...f, fechaSalida: e.target.value }))}
                    className="input w-full"
                    min={form.fechaEntrada || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Huésped */}
              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Nombre del huésped *</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={form.nombreHuesped}
                  onChange={e => setForm(f => ({ ...f, nombreHuesped: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Email <span className="normal-case text-gray-600">(opcional)</span></label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.emailHuesped}
                    onChange={e => setForm(f => ({ ...f, emailHuesped: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Teléfono <span className="normal-case text-gray-600">(opcional)</span></label>
                  <input
                    type="tel"
                    placeholder="+56 9 ..."
                    value={form.telefonoHuesped}
                    onChange={e => setForm(f => ({ ...f, telefonoHuesped: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Notas <span className="normal-case text-gray-600">(opcional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Hora de llegada, solicitudes especiales..."
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className="input w-full resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-sm">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={guardando} className="btn-primary flex-1 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Crear reserva confirmada'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost px-4">
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

function ReservaCard({ reserva: r, accionando, onConfirmar, onCompletar, onCheckin, onCancelar }) {
  const cfg = ESTADO_LABEL[r.estado] || ESTADO_LABEL.cancelada
  const n = noches(r.fechaEntrada, r.fechaSalida)
  const busy = accionando === r.id
  const hoy = new Date().toISOString().slice(0, 10)
  const llegaHoy = r.estado === 'confirmada' && r.fechaEntrada === hoy

  return (
    <div className={`card hover:border-border/80 transition-colors ${llegaHoy ? 'border-green-600/50 bg-green-950/20' : ''}`}>
      {llegaHoy && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-green-900/30 rounded-lg border border-green-700/40 -mx-1">
          <span className="text-green-400 text-sm">🛎️</span>
          <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">Llega hoy — Check-in pendiente</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-start gap-4">

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-base">{r.huespedNombre}</p>
              <p className="text-muted text-sm">{r.huespedEmail}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Habitación</p>
              <p className="font-medium">N° {r.habitacionNumero}</p>
              <p className="text-muted text-xs">{r.habitacionTipo}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Check-in</p>
              <p className="font-medium">{fmt(r.fechaEntrada)}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Check-out</p>
              <p className="font-medium">{fmt(r.fechaSalida)}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide mb-0.5">Estadía</p>
              <p className="font-medium">{n} {n === 1 ? 'noche' : 'noches'}</p>
              {r.montoEstimado && (
                <p className="text-accent text-xs">${Number(r.montoEstimado).toLocaleString('es-CL')}</p>
              )}
            </div>
          </div>

          {r.notas && (
            <p className="mt-3 text-sm text-muted italic border-l-2 border-border pl-3">
              {r.notas}
            </p>
          )}

          <p className="mt-2 text-xs text-gray-600">
            Recibida {new Date(r.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Acciones */}
        {(r.estado === 'pendiente' || r.estado === 'confirmada') && (
          <div className="flex md:flex-col gap-2 shrink-0">
            {r.estado === 'pendiente' && (
              <button
                onClick={onConfirmar}
                disabled={busy}
                className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
              >
                {busy ? '...' : '✓ Confirmar'}
              </button>
            )}
            {r.estado === 'confirmada' && llegaHoy && (
              <button
                onClick={onCheckin}
                disabled={busy}
                className="text-sm py-1.5 px-4 rounded-lg font-medium disabled:opacity-50 bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                {busy ? '...' : '🛎️ Check-in'}
              </button>
            )}
            {r.estado === 'confirmada' && !llegaHoy && (
              <button
                onClick={onCompletar}
                disabled={busy}
                className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
              >
                {busy ? '...' : '✓ Completar'}
              </button>
            )}
            <button
              onClick={onCancelar}
              disabled={busy}
              className="btn-ghost text-sm py-1.5 px-4 text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
