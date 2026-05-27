import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import ModalLiberar from '../components/ModalLiberar'
import { getHabitaciones, getMetricas, getReservasProximas } from '../services/api'
import { useSesion } from '../context/SesionContext'

export default function Dashboard() {
  const [habitaciones, setHabitaciones] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [habitacionALiberar, setHabitacionALiberar] = useState(null)
  const [ahora, setAhora] = useState(new Date())
  const [proximas, setProximas] = useState([])
  const { sesion } = useSesion()
  const navigate = useNavigate()

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    cargar()
    const interval = setInterval(cargar, 30000)
    const reloj = setInterval(() => setAhora(new Date()), 30000)
    return () => { clearInterval(interval); clearInterval(reloj) }
  }, [])

  const cargar = async () => {
    try {
      const [hRes, pRes] = await Promise.allSettled([
        getHabitaciones(),
        getReservasProximas(),
      ])
      if (hRes.status === 'fulfilled') setHabitaciones(hRes.value.data)
      if (pRes.status === 'fulfilled') setProximas(pRes.value.data)
      if (sesion?.rol === 'jefe') {
        const mRes = await getMetricas()
        setMetricas(mRes.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const libres = habitaciones.filter(h => h.estado === 'libre').length
  const ocupadas = habitaciones.filter(h => h.estado === 'ocupado').length
  const mant = habitaciones.filter(h => h.estado === 'mantenimiento').length

  const alertas10min = habitaciones.filter(h => {
    if (h.estado !== 'ocupado' || !h.salidaEstimada) return false
    const ms = new Date(h.salidaEstimada) - ahora
    return ms > 0 && ms <= 600000
  })

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted text-sm">Bienvenido, {sesion?.nombre}</p>
          </div>
          <button onClick={() => navigate('/nueva-venta')} className="btn-primary">
            + Nueva Venta
          </button>
        </div>

        {/* Banner de alerta 10 min */}
        {alertas10min.length > 0 && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 animate-pulse">
            <span className="text-red-400 text-lg">⚠️</span>
            <span className="text-red-300 text-sm font-medium">
              {alertas10min.length === 1
                ? `Hab. ${alertas10min[0].numero} — menos de 10 minutos para la salida`
                : `${alertas10min.length} habitaciones con menos de 10 min: ${alertas10min.map(h => h.numero).join(', ')}`
              }
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-400">{libres}</div>
            <div className="text-muted text-sm mt-1">Habitaciones libres</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-red-400">{ocupadas}</div>
            <div className="text-muted text-sm mt-1">Ocupadas</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-yellow-400">{mant}</div>
            <div className="text-muted text-sm mt-1">En mantención</div>
          </div>
          {metricas && (
            <div className="card text-center">
              <div className="text-2xl font-bold text-accent">
                ${metricas.totalHoy?.toLocaleString('es-CL')}
              </div>
              <div className="text-muted text-sm mt-1">Ventas hoy</div>
            </div>
          )}
        </div>

        {/* Widget reservas próximas */}
        {proximas.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                📅 Reservas próximas
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                  {proximas.length}
                </span>
              </h2>
              {sesion?.rol === 'jefe' && (
                <button
                  onClick={() => navigate('/reservas')}
                  className="text-xs text-accent hover:underline"
                >
                  Ver todas →
                </button>
              )}
            </div>
            <div className="space-y-2">
              {proximas.map(r => {
                const hoy = new Date().toISOString().slice(0, 10)
                const esHoy = r.fechaEntrada === hoy
                const esSalida = r.fechaSalida === hoy
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-border/50"
                  >
                    <span className="text-lg shrink-0">
                      {esSalida ? '🚪' : '🛎️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.huespedNombre}</p>
                      <p className="text-xs text-muted truncate">
                        Hab. {r.habitacionNumero} · {r.habitacionTipo}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${esSalida ? 'text-red-400' : esHoy ? 'text-green-400' : 'text-blue-400'}`}>
                        {esSalida ? 'Sale hoy' : esHoy ? 'Llega hoy' : 'Mañana'}
                      </p>
                      <p className={`text-xs px-2 py-0.5 rounded-full border mt-0.5 inline-block ${
                        r.estado === 'pendiente'
                          ? 'text-yellow-400 border-yellow-600/30 bg-yellow-500/10'
                          : 'text-blue-400 border-blue-600/30 bg-blue-500/10'
                      }`}>
                        {r.estado}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Grid habitaciones */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Estado de Habitaciones</h2>
          {loading ? (
            <p className="text-muted">Cargando...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {habitaciones.map(h => (
                <RoomCard
                  key={h.id}
                  habitacion={h}
                  onClick={h.estado === 'libre' ? () => navigate('/nueva-venta') : null}
                  onLiberar={setHabitacionALiberar}
                />
              ))}
            </div>
          )}
        </div>

        {/* Métricas jefe */}
        {metricas && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="card">
              <div className="text-muted text-sm">Esta semana</div>
              <div className="text-2xl font-bold mt-1">${metricas.totalSemana?.toLocaleString('es-CL')}</div>
              <div className="text-muted text-xs mt-1">{metricas.ventasSemana} ventas</div>
            </div>
            <div className="card">
              <div className="text-muted text-sm">Total histórico</div>
              <div className="text-2xl font-bold mt-1">${metricas.totalGeneral?.toLocaleString('es-CL')}</div>
              <div className="text-muted text-xs mt-1">{metricas.ventasTotal} ventas</div>
            </div>
            <div className="card">
              <div className="text-muted text-sm">Ventas hoy</div>
              <div className="text-2xl font-bold mt-1">{metricas.ventasHoy}</div>
            </div>
          </div>
        )}
      </div>

      {habitacionALiberar && (
        <ModalLiberar
          habitacion={habitacionALiberar}
          onExito={() => { setHabitacionALiberar(null); cargar() }}
          onCancelar={() => setHabitacionALiberar(null)}
        />
      )}
    </div>
  )
}
