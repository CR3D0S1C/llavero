import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicApi } from '../api'
import { useAuth } from '../context/AuthContext'

const SIDE_IMG = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await publicApi.login(form)
      login(r.data)
      navigate('/')
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
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
        <div className="absolute inset-0" style={{ background: 'rgba(28,74,90,0.65)' }} />
        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <p className="font-heading text-white mb-4" style={{ fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.15 }}>
            "Cada estadía es<br /><em>un recuerdo que dura"</em>
          </p>
          <div style={{ width: '40px', height: '1px', background: '#C9943A', marginBottom: '1.25rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300, fontSize: '0.875rem' }}>
            Hostal Mi Maravilla · La Serena, Chile
          </p>
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
            Bienvenido de vuelta
          </p>
          <h1 className="font-heading text-teal mb-2" style={{ fontSize: '2.75rem', fontWeight: 300, lineHeight: 1.05 }}>
            Iniciar sesión
          </h1>
          <p style={{ color: '#6B6057', fontWeight: 300, fontSize: '0.875rem', marginBottom: '2.5rem' }}>
            Accede para ver y gestionar tus reservas
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
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
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ fontSize: '13px', color: '#6B6057', marginTop: '2rem', fontWeight: 300 }}>
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              style={{ color: '#1C4A5A', borderBottom: '1px solid #1C4A5A', paddingBottom: '1px' }}
              onMouseEnter={e => { e.target.style.color = '#C9943A'; e.target.style.borderBottomColor = '#C9943A' }}
              onMouseLeave={e => { e.target.style.color = '#1C4A5A'; e.target.style.borderBottomColor = '#1C4A5A' }}
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
