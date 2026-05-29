import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { toast } from '../utils/toast'

// Instancia separada para no interferir con la sesión del admin
const aseoApi = axios.create({ baseURL: '/api' })
aseoApi.interceptors.request.use(config => {
  const s = sessionStorage.getItem('llavero_aseo_sesion')
  if (s) {
    const { token } = JSON.parse(s)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const TIPO_LABEL = { completo: 'Aseo completo', general: 'Aseo general' }
const TIPO_COLOR = { completo: 'bg-orange-500/15 text-orange-400', general: 'bg-blue-500/15 text-blue-400' }
const ESTADO_HAB = {
  aseo:          '🧹 En aseo',
  ocupado:       '🛏️ Ocupada',
  libre:         '✓ Libre',
  mantenimiento: '🔧 Mantención',
}

const POLL_MS = 30_000

function tiempoDesde(isoStr) {
  if (!isoStr) return null
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000)
  if (diff < 1)  return 'recién'
  if (diff < 60) return `${diff} min`
  const h = Math.floor(diff / 60), m = diff % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function Aseo() {
  const [sesion, setSesion]       = useState(() => {
    const s = sessionStorage.getItem('llavero_aseo_sesion')
    return s ? JSON.parse(s) : null
  })
  const [loginForm, setLoginForm] = useState({ nombre: '', pin: '' })
  const [loginError, setLoginError] = useState('')
  const [loginCargando, setLoginCargando] = useState(false)
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando]   = useState(false)
  const [accion, setAccion]       = useState(null) // id en proceso
  const pinRef = useRef(null)

  const cargar = useCallback(async () => {
    if (!sesion) return
    try {
      const r = await aseoApi.get('/aseo/mis-asignaciones')
      setAsignaciones(r.data)
    } catch (e) {
      if (e.response?.status === 401) {
        sessionStorage.removeItem('llavero_aseo_sesion')
        setSesion(null)
      }
    }
  }, [sesion])

  useEffect(() => {
    if (!sesion) return
    cargar()
    const id = setInterval(cargar, POLL_MS)
    return () => clearInterval(id)
  }, [sesion, cargar])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.nombre || !loginForm.pin) return
    setLoginCargando(true)
    setLoginError('')
    try {
      const r = await axios.post('/api/auth/login', loginForm)
      const data = r.data
      if (data.rol !== 'aseo') {
        setLoginError('Esta pantalla es solo para personal de aseo')
        return
      }
      sessionStorage.setItem('llavero_aseo_sesion', JSON.stringify(data))
      setSesion(data)
    } catch {
      setLoginError('Nombre o PIN incorrecto')
      setLoginForm(f => ({ ...f, pin: '' }))
      setTimeout(() => pinRef.current?.focus(), 50)
    } finally {
      setLoginCargando(false)
    }
  }

  const handleIniciar = async (id) => {
    setAccion(id)
    try {
      await aseoApi.put(`/aseo/asignaciones/${id}/iniciar`)
      toast.success('Marcada como en proceso')
      await cargar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    } finally {
      setAccion(null)
    }
  }

  const handleCompletar = async (id, numero) => {
    setAccion(id)
    try {
      await aseoApi.put(`/aseo/asignaciones/${id}/completar`)
      toast.success(`Hab. ${numero} marcada como lista ✓`)
      await cargar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    } finally {
      setAccion(null)
    }
  }

  const salir = () => {
    sessionStorage.removeItem('llavero_aseo_sesion')
    setSesion(null)
    setAsignaciones([])
  }

  // ── Pantalla de login ──
  if (!sesion) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="card w-full max-w-sm">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">🧹</div>
            <h1 className="text-xl font-bold">Personal de Aseo</h1>
            <p className="text-muted text-sm mt-1">Ingresa tus credenciales</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-sm text-muted mb-1">Tu nombre</label>
              <input
                className="input w-full"
                placeholder="Ej: María González"
                value={loginForm.nombre}
                onChange={e => setLoginForm(f => ({ ...f, nombre: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">PIN</label>
              <input
                ref={pinRef}
                className="input w-full text-center text-xl tracking-[0.4em] font-mono"
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="••••"
                value={loginForm.pin}
                onChange={e => setLoginForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              type="submit"
              disabled={!loginForm.nombre || !loginForm.pin || loginCargando}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loginCargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Vista de la mucama ──
  const pendientes   = asignaciones.filter(a => a.estado !== 'completado')
  const completadas  = asignaciones.filter(a => a.estado === 'completado')

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">
            {sesion.nombre?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold leading-tight">{sesion.nombre}</p>
            <p className="text-muted text-xs">
              {pendientes.length === 0
                ? '¡Todo listo!'
                : `${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="btn-ghost text-sm">↺</button>
          <button
            onClick={salir}
            className="text-xs text-muted hover:text-white px-3 py-1.5 border border-border rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Sin asignaciones */}
        {asignaciones.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">✨</div>
            <p className="font-semibold">Sin asignaciones para hoy</p>
            <p className="text-muted text-sm mt-1">El jefe aún no te asignó habitaciones</p>
          </div>
        )}

        {/* Pendientes */}
        {pendientes.map(a => (
          <div
            key={a.id}
            className={`card ${a.estado === 'en_proceso' ? 'border-blue-600/50' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: a.color }} />
              <div className="flex-1 min-w-0">
                {/* Encabezado */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-lg">Hab. {a.numero}</span>
                  <span className="text-xs text-muted">{a.tipoLabel}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[a.tipoAseo]}`}>
                    {TIPO_LABEL[a.tipoAseo]}
                  </span>
                </div>

                {/* Estado habitación */}
                <p className="text-xs text-muted mb-1">{ESTADO_HAB[a.estadoHabitacion] || a.estadoHabitacion}</p>

                {/* Notas */}
                {a.notas && (
                  <p className="text-xs text-yellow-400/80 italic mb-2">📌 {a.notas}</p>
                )}

                {/* Tiempo en proceso */}
                {a.estado === 'en_proceso' && a.iniciadoAt && (
                  <p className="text-xs text-blue-400 mb-2">
                    En proceso hace {tiempoDesde(a.iniciadoAt)}
                  </p>
                )}

                {/* Botones */}
                <div className="flex gap-2 mt-2">
                  {a.estado === 'pendiente' && (
                    <button
                      onClick={() => handleIniciar(a.id)}
                      disabled={accion === a.id}
                      className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {accion === a.id ? '...' : '▶ Iniciar'}
                    </button>
                  )}
                  {(a.estado === 'en_proceso' || a.estado === 'pendiente') && (
                    <button
                      onClick={() => handleCompletar(a.id, a.numero)}
                      disabled={accion === a.id}
                      className="text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {accion === a.id ? '...' : '✓ Lista'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Completadas del día */}
        {completadas.length > 0 && (
          <div className="card">
            <p className="text-xs uppercase tracking-wider text-muted mb-3">
              Completadas hoy ({completadas.length})
            </p>
            <div className="space-y-2">
              {completadas.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-sm opacity-60">
                  <span className="text-green-400">✓</span>
                  <span>Hab. {a.numero}</span>
                  <span className="text-muted text-xs">— {TIPO_LABEL[a.tipoAseo]}</span>
                  {a.completadoAt && (
                    <span className="text-muted text-xs ml-auto">
                      {new Date(a.completadoAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
