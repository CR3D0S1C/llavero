import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getTurnoActivo, cerrarTurno } from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'

export default function CierreTurno() {
  const [turno, setTurno] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cerrando, setCerrando] = useState(false)
  const { sesion, logout } = useSesion()
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await getTurnoActivo()
      if (res.data.sin_turno) { setTurno(null) } else { setTurno(res.data) }
    } catch (e) {
      setTurno(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCerrar = async () => {
    if (!confirm('¿Cerrar turno? Deberás iniciar sesión nuevamente para seguir operando.')) return
    setCerrando(true)
    try {
      await cerrarTurno()
      toast.success('Turno cerrado correctamente')
      logout()
      navigate('/')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al cerrar turno')
      setCerrando(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-bg"><Navbar /><div className="p-6 text-muted">Cargando...</div></div>

  if (!turno) return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="card text-center py-12">
          <p className="text-muted">No hay turno activo</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Ir al Dashboard</button>
        </div>
      </div>
    </div>
  )

  const ventasPorHabitacion = {}
  const ventasPorProducto = {}
  const ventasLibres = []

  turno.ventas?.forEach(v => {
    v.items?.forEach(item => {
      if (item.tipo === 'habitacion') {
        const clave = v.habitacionTipo || 'Habitación'
        ventasPorHabitacion[clave] = (ventasPorHabitacion[clave] || 0) + Number(item.subtotal)
      } else if (item.tipo === 'producto') {
        if (!ventasPorProducto[item.descripcion]) ventasPorProducto[item.descripcion] = { cantidad: 0, total: 0 }
        ventasPorProducto[item.descripcion].cantidad += item.cantidad
        ventasPorProducto[item.descripcion].total += Number(item.subtotal)
      } else if (item.tipo === 'libre') {
        ventasLibres.push({ desc: item.descripcion, monto: Number(item.subtotal) })
      }
    })
  })

  const duracion = turno.inicio
    ? Math.round((Date.now() - new Date(turno.inicio).getTime()) / 60000)
    : 0

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Cierre de Turno</h1>

        {/* Resumen general */}
        <div className="card mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted text-sm">Cajero</p>
              <p className="font-semibold">{turno.cajero}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Duración</p>
              <p className="font-semibold">{Math.floor(duracion / 60)}h {duracion % 60}m</p>
            </div>
            <div>
              <p className="text-muted text-sm">Ventas realizadas</p>
              <p className="font-semibold">{turno.ventas?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Total turno</p>
              <p className="font-bold text-2xl text-green-400">${Number(turno.totalTurno).toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>

        {/* Por habitación */}
        {Object.keys(ventasPorHabitacion).length > 0 && (
          <div className="card mb-4">
            <h2 className="font-semibold mb-3">Por tipo de habitación</h2>
            {Object.entries(ventasPorHabitacion).map(([tipo, total]) => (
              <div key={tipo} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                <span>{tipo}</span>
                <span className="font-semibold">${total.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Productos */}
        {Object.keys(ventasPorProducto).length > 0 && (
          <div className="card mb-4">
            <h2 className="font-semibold mb-3">Productos vendidos</h2>
            {Object.entries(ventasPorProducto).map(([nombre, data]) => (
              <div key={nombre} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                <span>{nombre} <span className="text-muted">x{data.cantidad}</span></span>
                <span className="font-semibold">${data.total.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ítems libres */}
        {ventasLibres.length > 0 && (
          <div className="card mb-4">
            <h2 className="font-semibold mb-3 text-yellow-400">Ítems libres</h2>
            {ventasLibres.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                <span>{item.desc}</span>
                <span className="font-semibold">${item.monto.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleCerrar}
          disabled={cerrando}
          className="btn-danger w-full py-3 text-base mt-2"
        >
          {cerrando ? 'Cerrando...' : '🔒 Cerrar Turno y Salir'}
        </button>
      </div>
    </div>
  )
}
