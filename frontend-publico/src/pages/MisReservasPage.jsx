import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { bookingApi } from '../api'
import { useAuth } from '../context/AuthContext'

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente de confirmación', bg: '#FFF8EC', border: '#C9943A', text: '#C9943A' },
  confirmada: { label: 'Confirmada',                 bg: '#EEF4F6', border: '#1C4A5A', text: '#1C4A5A' },
  cancelada:  { label: 'Cancelada',                  bg: '#F5EFE6', border: '#DDD0C0', text: '#6B6057' },
  completada: { label: 'Completada',                 bg: '#F5EFE6', border: '#6B6057', text: '#6B6057' },
}

const formatDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
  day: 'numeric', month: 'long', year: 'numeric'
})

const calcNoches = (entrada, salida) => {
  const d1 = new Date(entrada), d2 = new Date(salida)
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
  return diff === 1 ? '1 noche' : `${diff} noches`
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
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return
    setCancelando(id)
    try {
      await bookingApi.cancelarReserva(id)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r))
    } finally {
      setCancelando(null)
    }
  }

  return (
    <div style={{ background: '#F5EFE6', minHeight: '100vh' }}>

      {/* Header */}
      <div className="bg-teal py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>
            Hostal Mi Maravilla
          </p>
          <h1 className="font-heading text-white" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300 }}>
            Mis reservas
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 300, marginTop: '0.5rem' }}>
            Hola, {huesped?.nombre?.split(' ')[0]}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse" style={{ background: '#fff', padding: '1.5rem' }}>
                <div style={{ height: '20px', background: '#E8D5B7', width: '45%', marginBottom: '1rem' }} />
                <div style={{ height: '14px', background: '#E8D5B7', width: '65%' }} />
              </div>
            ))}
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
              style={{ border: '1px solid #DDD0C0' }}
            >
              <span style={{ fontSize: '1.75rem' }}>🛏️</span>
            </div>
            <h2 className="font-heading text-teal mb-3" style={{ fontSize: '1.875rem', fontWeight: 300 }}>
              Aún no tienes reservas
            </h2>
            <p style={{ color: '#6B6057', fontWeight: 300, marginBottom: '2rem' }}>
              Explora nuestras habitaciones y haz tu primera reserva
            </p>
            <Link
              to="/habitaciones"
              className="inline-block transition-all"
              style={{
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '14px 32px',
                background: '#1C4A5A',
                color: '#fff',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E1E1E'}
              onMouseLeave={e => e.currentTarget.style.background = '#1C4A5A'}
            >
              Ver habitaciones
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map(r => {
              const cfg = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.cancelada
              const cancelable = r.estado === 'pendiente' || r.estado === 'confirmada'
              return (
                <div
                  key={r.id}
                  style={{ background: '#fff', border: '1px solid #DDD0C0' }}
                >
                  {/* Barra de estado */}
                  <div style={{
                    height: '3px',
                    background: cfg.border,
                    opacity: r.estado === 'cancelada' ? 0.3 : 1,
                  }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="font-heading text-teal mb-1" style={{ fontSize: '1.375rem', fontWeight: 400 }}>
                          {r.habitacionTipo}
                        </h3>
                        <p style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#6B6057' }}>
                          Habitación {r.habitacionNumero}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          padding: '5px 12px',
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          color: cfg.text,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6057', marginBottom: '4px' }}>Llegada</p>
                        <p style={{ fontSize: '0.9375rem', color: '#1E1E1E', fontWeight: 400 }}>{formatDate(r.fechaEntrada)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6057', marginBottom: '4px' }}>Salida</p>
                        <p style={{ fontSize: '0.9375rem', color: '#1E1E1E', fontWeight: 400 }}>{formatDate(r.fechaSalida)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6057', marginBottom: '4px' }}>Duración</p>
                        <p style={{ fontSize: '0.9375rem', color: '#1E1E1E', fontWeight: 400 }}>{calcNoches(r.fechaEntrada, r.fechaSalida)}</p>
                      </div>
                    </div>

                    {r.notas && (
                      <p style={{ fontSize: '0.8125rem', color: '#6B6057', fontStyle: 'italic', fontWeight: 300, marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid #DDD0C0' }}>
                        {r.notas}
                      </p>
                    )}

                    {cancelable && (
                      <div style={{ borderTop: '1px solid #E8D5B7', marginTop: '1rem', paddingTop: '1rem' }}>
                        <button
                          onClick={() => handleCancelar(r.id)}
                          disabled={cancelando === r.id}
                          style={{
                            fontSize: '11px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: '#B5533E',
                            background: 'none',
                            border: 'none',
                            cursor: cancelando === r.id ? 'not-allowed' : 'pointer',
                            opacity: cancelando === r.id ? 0.5 : 1,
                            borderBottom: '1px solid #B5533E',
                            paddingBottom: '1px',
                          }}
                        >
                          {cancelando === r.id ? 'Cancelando...' : 'Cancelar esta reserva'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {reservas.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              to="/habitaciones"
              style={{
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#1C4A5A',
                borderBottom: '1px solid #1C4A5A',
                paddingBottom: '2px',
              }}
              onMouseEnter={e => { e.target.style.color = '#C9943A'; e.target.style.borderBottomColor = '#C9943A' }}
              onMouseLeave={e => { e.target.style.color = '#1C4A5A'; e.target.style.borderBottomColor = '#1C4A5A' }}
            >
              Hacer otra reserva →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
