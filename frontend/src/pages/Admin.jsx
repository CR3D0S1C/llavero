import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getMetricas, getTurnosHoy } from '../services/api'

export default function Admin() {
  const [metricas, setMetricas] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMetricas(), getTurnosHoy()]).then(([m, t]) => {
      setMetricas(m.data)
      setTurnos(t.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen bg-bg"><Navbar /><div className="p-6 text-muted">Cargando...</div></div>

  const estadoColor = {
    libre: 'text-green-400', ocupado: 'text-red-400',
    mantenimiento: 'text-yellow-400', deshabilitada: 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-muted text-xs mb-1">VENTAS HOY</div>
            <div className="text-2xl font-bold">{metricas?.ventasHoy}</div>
            <div className="text-green-400 font-semibold">${metricas?.totalHoy?.toLocaleString('es-CL')}</div>
          </div>
          <div className="card text-center">
            <div className="text-muted text-xs mb-1">ESTA SEMANA</div>
            <div className="text-2xl font-bold">{metricas?.ventasSemana}</div>
            <div className="text-green-400 font-semibold">${metricas?.totalSemana?.toLocaleString('es-CL')}</div>
          </div>
          <div className="card text-center">
            <div className="text-muted text-xs mb-1">TOTAL HISTÓRICO</div>
            <div className="text-2xl font-bold">{metricas?.ventasTotal}</div>
            <div className="text-green-400 font-semibold">${metricas?.totalGeneral?.toLocaleString('es-CL')}</div>
          </div>
        </div>

        {/* Estado habitaciones */}
        {metricas?.habitacionesPorEstado && (
          <div className="card mb-6">
            <h2 className="font-semibold mb-3">Estado de Habitaciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(metricas.habitacionesPorEstado).map(([estado, count]) => (
                <div key={estado} className="text-center">
                  <div className={`text-3xl font-bold ${estadoColor[estado]}`}>{count}</div>
                  <div className="text-muted text-xs capitalize mt-1">{estado}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Turnos de hoy */}
        <div className="card">
          <h2 className="font-semibold mb-4">Turnos de Hoy</h2>
          {turnos.length === 0 ? (
            <p className="text-muted text-sm">No hay turnos registrados hoy</p>
          ) : (
            <div className="space-y-3">
              {turnos.map(t => (
                <div key={t.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{t.cajero}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${t.cerrado ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                        {t.cerrado ? 'Cerrado' : 'Activo'}
                      </span>
                    </div>
                    <span className="font-bold text-green-400">${Number(t.totalTurno).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Inicio: {new Date(t.inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    {t.fin && ` · Fin: ${new Date(t.fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
