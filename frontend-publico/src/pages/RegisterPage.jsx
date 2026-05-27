import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicApi } from '../api'
import { useAuth } from '../context/AuthContext'

const SIDE_IMG = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await publicApi.register(form)
      login(r.data)
      navigate('/habitaciones')
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear la cuenta. Intenta con otro email.')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex" style={{ background: '#F5EFE6' }}>

      {/* ── Lado imagen ── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src={SIDE_IMG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'rgba(30,30,30,0.6)' }} />
        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9943A', marginBottom: '1.25rem' }}>
            Regístrate gratis
          </p>
          <p className="font-heading text-white mb-4" style={{ fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.15 }}>
            Tu estadía perfecta<br /><em>comienza aquí</em>
          </p>
          <div style={{ width: '40px', height: '1px', background: '#C9943A', marginBottom: '1.5rem' }} />
          <div className="space-y-2">
            {[
              'Reserva en segundos, confirma al instante',
              'Gestiona y cancela tus estadías',
              'Notificaciones por email',
            ].map((item, i) => (
              <p key={i} style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300, fontSize: '0.875rem' }}>
                — {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
        <div style={{ width: '100%', maxWidth: '380px' }}>

          <Link
            to="/"
            className="font-heading text-teal block mb-12"
            style={{ fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.04em' }}
          >
            Hostal Mi Maravilla
          </Link>

          <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9943A', marginBottom: '1rem' }}>
            Primera vez aquí
          </p>
          <h1 className="font-heading text-teal mb-2" style={{ fontSize: '2.75rem', fontWeight: 300, lineHeight: 1.05 }}>
            Crear cuenta
          </h1>
          <p style={{ color: '#6B6057', fontWeight: 300, fontSize: '0.875rem', marginBottom: '2.5rem' }}>
            Regístrate para reservar habitaciones en segundos
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6057', display: 'block', marginBottom: '8px' }}>
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Juan Pérez"
                className="input-line"
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6057', display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="tu@email.com"
                className="input-line"
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6057', display: 'block', marginBottom: '8px' }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
                placeholder="Mínimo 6 caracteres"
                className="input-line"
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6057', display: 'block', marginBottom: '8px' }}>
                Teléfono <span style={{ color: '#DDD0C0' }}>(opcional)</span>
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="+56 9 1234 5678"
                className="input-line"
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#B5533E', lineHeight: 1.5 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full transition-all"
              style={{
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '16px',
                marginTop: '0.5rem',
                background: loading ? '#DDD0C0' : '#1C4A5A',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1E1E1E' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1C4A5A' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p style={{ fontSize: '13px', color: '#6B6057', marginTop: '2rem', fontWeight: 300 }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              style={{ color: '#1C4A5A', borderBottom: '1px solid #1C4A5A', paddingBottom: '1px' }}
              onMouseEnter={e => { e.target.style.color = '#C9943A'; e.target.style.borderBottomColor = '#C9943A' }}
              onMouseLeave={e => { e.target.style.color = '#1C4A5A'; e.target.style.borderBottomColor = '#1C4A5A' }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
