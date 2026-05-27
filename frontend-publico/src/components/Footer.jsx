import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#1C4A5A', color: 'rgba(255,255,255,0.6)' }}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">

          {/* Brand */}
          <div>
            <p className="font-heading text-white mb-3" style={{ fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.04em' }}>
              Hostal Mi Maravilla
            </p>
            <div className="w-8 h-px mb-4" style={{ background: '#C9943A' }} />
            <p className="text-sm leading-relaxed" style={{ fontWeight: 300, maxWidth: '240px' }}>
              Un refugio boutique en el corazón de La Serena, a pasos de la playa y el centro histórico colonial.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white mb-5" style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Navegación
            </p>
            <div className="space-y-3">
              {[
                { to: '/', label: 'Inicio' },
                { to: '/habitaciones', label: 'Habitaciones' },
                { to: '/registro', label: 'Crear cuenta' },
                { to: '/login', label: 'Iniciar sesión' },
                { to: '/mis-reservas', label: 'Mis reservas' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-sm transition-colors"
                  style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.9)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-white mb-5" style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Contacto
            </p>
            <div className="space-y-3 text-sm" style={{ fontWeight: 300 }}>
              <p>La Serena, Región de Coquimbo<br />Chile</p>
              <p>
                <a
                  href="mailto:hostalmimaravilla@gmail.com"
                  style={{ color: '#C9943A' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#C9943A'}
                >
                  hostalmimaravilla@gmail.com
                </a>
              </p>
              <p>Reservas disponibles 24/7 online</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}
          className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p style={{ fontSize: '11px', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} Hostal Mi Maravilla · Todos los derechos reservados
          </p>
          <p style={{ fontSize: '11px', letterSpacing: '0.1em' }}>
            La Serena · Chile
          </p>
        </div>
      </div>
    </footer>
  )
}
