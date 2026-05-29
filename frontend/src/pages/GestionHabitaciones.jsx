import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ModalConfirmar from '../components/ModalConfirmar'
import { getHabitaciones, cambiarEstadoJefe, getHabitacionLog, eliminarHabitacion } from '../services/api'
import { toast } from '../utils/toast'

const ESTADOS = [
  { value: 'todas',        label: 'Todas',        color: 'bg-gray-700 text-white' },
  { value: 'libre',        label: 'Libre',        color: 'bg-green-900/60 text-green-300' },
  { value: 'ocupado',      label: 'Ocupada',      color: 'bg-red-900/60 text-red-300' },
  { value: 'reservado',    label: 'Reservada',    color: 'bg-blue-900/60 text-blue-300' },
  { value: 'aseo',         label: 'En Aseo',      color: 'bg-orange-900/60 text-orange-300' },
  { value: 'mantenimiento',label: 'Mantención',   color: 'bg-yellow-900/60 text-yellow-300' },
  { value: 'deshabilitada',label: 'Deshabilitada',color: 'bg-gray-800 text-gray-400' },
]

const estadoDot = {
  libre:        'bg-green-500',
  ocupado:      'bg-red-500',
  reservado:    'bg-blue-500',
  aseo:         'bg-orange-500',
  mantenimiento:'bg-yellow-500',
  deshabilitada:'bg-gray-500',
}

const estadoLabel = {
  libre:        'Libre',
  ocupado:      'Ocupada',
  reservado:    'Reservada',
  aseo:         'En Aseo',
  mantenimiento:'Mantención',
  deshabilitada:'Deshabilitada',
}

// Transiciones rápidas disponibles para el jefe según el estado actual
const acciones = {
  libre:         [{ estado: 'mantenimiento', label: 'Mantención', color: 'text-yellow-400 border-yellow-700 hover:bg-yellow-900/30' },
                  { estado: 'deshabilitada', label: 'Deshabilitar', color: 'text-gray-400 border-gray-600 hover:bg-gray-700/30' }],
  ocupado:       [{ estado: 'aseo', label: '→ Aseo', color: 'text-orange-400 border-orange-700 hover:bg-orange-900/30' }],
  reservado:     [{ estado: 'libre', label: 'Liberar', color: 'text-green-400 border-green-700 hover:bg-green-900/30' }],
  aseo:          [{ estado: 'libre',  label: 'Liberar', color: 'text-green-400 border-green-700 hover:bg-green-900/30' }],
  mantenimiento: [{ estado: 'libre',  label: 'Liberar', color: 'text-green-400 border-green-700 hover:bg-green-900/30' },
                  { estado: 'deshabilitada', label: 'Deshabilitar', color: 'text-gray-400 border-gray-600 hover:bg-gray-700/30' }],
  deshabilitada: [{ estado: 'libre',  label: 'Habilitar', color: 'text-blue-400 border-blue-700 hover:bg-blue-900/30' }],
}

export default function GestionHabitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [logs, setLogs] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(null) // id de hab en proceso
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const [hRes, lRes] = await Promise.all([getHabitaciones(), getHabitacionLog()])
      setHabitaciones(hRes.data)
      setLogs(lRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const [confirmar, setConfirmar] = useState(null)

  const cambiar = (habitacion, nuevoEstado) => {
    setConfirmar({
      titulo: `¿Cambiar Hab. ${habitacion.numero} a ${estadoLabel[nuevoEstado]}?`,
      textoBtn: 'Sí, cambiar',
      variante: 'normal',
      accion: async () => {
        setProcesando(habitacion.id)
        try {
          await cambiarEstadoJefe(habitacion.id, nuevoEstado)
          toast.success(`${habitacion.numero} → ${estadoLabel[nuevoEstado]}`)
          await cargar()
        } catch (e) {
          toast.error(e.response?.data?.error || 'Error al cambiar estado')
        } finally { setProcesando(null) }
      }
    })
  }

  const eliminar = (habitacion) => {
    setConfirmar({
      titulo: `¿Eliminar la habitación ${habitacion.numero}?`,
      mensaje: 'Quedará inactiva y no aparecerá en el sistema.',
      textoBtn: 'Eliminar',
      accion: async () => {
        setProcesando(habitacion.id)
        try {
          await eliminarHabitacion(habitacion.id)
          toast.success(`${habitacion.numero} eliminada`)
          await cargar()
        } catch (e) {
          toast.error(e.response?.data?.error || 'Error al eliminar')
        } finally { setProcesando(null) }
      }
    })
  }

  const conteo = (estado) => habitaciones.filter(h => estado === 'todas' || h.estado === estado).length

  const filtradas = filtro === 'todas'
    ? habitaciones
    : habitaciones.filter(h => h.estado === filtro)

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      {confirmar && (
        <ModalConfirmar
          titulo={confirmar.titulo}
          mensaje={confirmar.mensaje}
          textoBtn={confirmar.textoBtn}
          variante={confirmar.variante}
          onConfirmar={() => { setConfirmar(null); confirmar.accion() }}
          onCancelar={() => setConfirmar(null)}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Operación diaria</p>
            <h1 className="text-2xl font-bold mt-1">Gestión de Habitaciones</h1>
          </div>
          <button onClick={() => navigate('/habitaciones')} className="btn-ghost text-sm">
            🛏️ Configurar habitaciones
          </button>
        </div>

        {/* Filtros con conteo */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              onClick={() => setFiltro(e.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                filtro === e.value
                  ? e.color + ' border-transparent'
                  : 'border-border text-muted hover:text-gray-200'
              }`}
            >
              {e.label}
              <span className="ml-1.5 text-xs opacity-70">({conteo(e.value)})</span>
            </button>
          ))}
        </div>

        {/* Grilla de habitaciones */}
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {filtradas.map(h => (
              <div key={h.id} className="card">
                {/* Header tarjeta */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{h.numero}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${estadoDot[h.estado]}`} />
                    <span className="text-xs font-medium text-muted">{estadoLabel[h.estado]}</span>
                  </div>
                </div>

                <p className="text-sm text-muted">{h.tipoLabel}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {h.bano === 'Privado' ? '🚿 Baño privado' : '🚿 Baño compartido'}
                </p>
                {h.nota && (
                  <p className="text-xs text-yellow-500/80 mt-1 truncate">📝 {h.nota}</p>
                )}

                {/* Botones de acción directa */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(acciones[h.estado] || []).map(a => (
                    <button
                      key={a.estado}
                      onClick={() => cambiar(h, a.estado)}
                      disabled={procesando === h.id}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium disabled:opacity-40 ${a.color}`}
                    >
                      {procesando === h.id ? '...' : a.label}
                    </button>
                  ))}
                  {h.estado !== 'ocupado' && (
                    <button
                      onClick={() => eliminar(h)}
                      disabled={procesando === h.id}
                      className="text-xs px-2 py-1 rounded-lg border border-red-900/60 text-red-500/70 hover:text-red-400 hover:border-red-700 hover:bg-red-900/20 transition-colors ml-auto"
                      title="Eliminar habitación"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtradas.length === 0 && (
              <p className="text-muted col-span-3 text-center py-8">
                No hay habitaciones en estado "{estadoLabel[filtro] || filtro}"
              </p>
            )}
          </div>
        )}

        {/* Log de cambios */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Registro de cambios</h2>
          {logs.length === 0 ? (
            <p className="text-muted text-sm">Aún no hay cambios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="pb-2 pr-4">Habitación</th>
                    <th className="pb-2 pr-4">Cambio</th>
                    <th className="pb-2 pr-4">Quién</th>
                    <th className="pb-2">Cuándo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-white/2">
                      <td className="py-2 pr-4 font-medium">
                        {l.habitacionNumero}
                        <span className="text-xs text-muted ml-1">{l.habitacionTipo}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-muted">{estadoLabel[l.estadoAnterior] || l.estadoAnterior}</span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className="text-white">{estadoLabel[l.estadoNuevo] || l.estadoNuevo}</span>
                      </td>
                      <td className="py-2 pr-4 text-muted">{l.usuarioNombre}</td>
                      <td className="py-2 text-muted text-xs">{l.fecha} {l.hora}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
