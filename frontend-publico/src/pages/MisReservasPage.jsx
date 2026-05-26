import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingApi } from '../api'
import { useAuth } from '../context/AuthContext'

const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-gray-100 text-gray-500',
  completada: 'bg-blue-100 text-blue-700',
}

const ESTADO_LABEL = {
  pendiente: 'Pendiente confirmación',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
}

export default function MisReservasPage() {
  const { huesped } = useAuth()
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(null)

  useEffect(() => {
    if (!huesped) { navigate('/login'); return }
    bookingApi.misReservas()
      .then(r => setReservas(r.data))
      .finally(() => setLoading(false))
  }, [huesped])

  const handleCancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    setCancelando(id)
    try {
      await bookingApi.cancelarReserva(id)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r))
    } finally {
      setCancelando(null)
    }
  }

  const formatDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis reservas</h1>
      <p className="text-sm text-gray-400 mb-8">Hola, {huesped?.nombre}</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="border border-gray-100 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🛏️</p>
          <p className="text-gray-400 mb-4">No tienes reservas aún</p>
          <button
            onClick={() => navigate('/habitaciones')}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            Ver habitaciones
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.habitacionTipo}</h3>
                  <p className="text-sm text-gray-400">Habitación {r.habitacionNumero}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_BADGE[r.estado]}`}>
                  {ESTADO_LABEL[r.estado]}
                </span>
              </div>

              <div className="flex gap-6 text-sm text-gray-600 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Entrada</p>
                  <p className="font-medium">{formatDate(r.fechaEntrada)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Salida</p>
                  <p className="font-medium">{formatDate(r.fechaSalida)}</p>
                </div>
              </div>

              {r.notas && (
                <p className="text-xs text-gray-400 mb-3 italic">"{r.notas}"</p>
              )}

              {(r.estado === 'pendiente' || r.estado === 'confirmada') && (
                <button
                  onClick={() => handleCancelar(r.id)}
                  disabled={cancelando === r.id}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelando === r.id ? 'Cancelando...' : 'Cancelar reserva'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
