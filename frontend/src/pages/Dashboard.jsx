import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import ModalLiberar from '../components/ModalLiberar'
import { getHabitaciones, getMetricas } from '../services/api'
import { useSesion } from '../context/SesionContext'

export default function Dashboard() {
  const [habitaciones, setHabitaciones] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [habitacionALiberar, setHabitacionALiberar] = useState(null)
  const { sesion } = useSesion()
  const navigate = useNavigate()

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000)
    return () => clearInterval(interval)
  }, [])

  const cargar = async () => {
    try {
      const hRes = await getHabitaciones()
      setHabitaciones(hRes.data)
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
