import { Link } from 'react-router-dom'

const HERO_IMG  = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80'
const ABOUT_IMG = 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'

const ROOMS_PREVIEW = [
  {
    img:    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
    tipo:   'Habitación Doble',
    tag:    'Más solicitada',
    desc:   'Espaciosa habitación con cama matrimonial, baño privado y vista al jardín interior lleno de luz natural.',
    precio: 35000,
  },
  {
    img:    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80',
    tipo:   'Habitación Individual',
    tag:    'Ideal para viajeros',
    desc:   'Diseño cálido y funcional con todo lo necesario para disfrutar la experiencia serenense en soledad.',
    precio: 22000,
  },
]

const AMENIDADES = [
  { icon: '📶', label: 'WiFi de alta velocidad' },
  { icon: '☕', label: 'Desayuno continental' },
  { icon: '🅿️', label: 'Estacionamiento privado' },
  { icon: '🌿', label: 'Jardín y terraza' },
  { icon: '❄️', label: 'Climatización' },
  { icon: '🔑', label: 'Acceso 24 horas' },
]

const FadeUp = ({ children, delay = 0, style = {} }) => (
  <div style={{ animation: `fadeUp .9s ${delay}ms cubic-bezier(.16,1,.3,1) both`, ...style }}>
    {children}
  </div>
)

/* Responsive grid sin depender de Tailwind breakpoints */
const gridStyle = (cols = 2, gap = '1.5rem', min = '340px') => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))`,
  gap,
})

const containerStyle = { maxWidth: '1152px', margin: '0 auto' }

export default function HomePage() {
  return (
    <div>

      {/* ── Hero ── */}
      <section
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', height: '100svh', minHeight: '620px' }}
      >
        <img
          src={HERO_IMG}
          alt="La Serena, Chile"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 1.8s ease both' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.5) 55%,rgba(0,0,0,.78) 100%)' }} />

        <div style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: '0 1.5rem', maxWidth: '56rem' }}>
          <FadeUp delay={250}>
            <p style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '2rem' }}>
              La Serena · IV Región · Chile
            </p>
          </FadeUp>

          <FadeUp delay={450}>
            <h1 className="font-heading" style={{ fontSize: 'clamp(3.2rem,8vw,6.5rem)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', marginBottom: '2rem', color: '#fff' }}>
              Un refugio en el<br />
              <em style={{ fontStyle: 'italic' }}>corazón del norte</em>
            </h1>
          </FadeUp>

          <FadeUp delay={700}>
            <div style={{ width: '48px', height: '1px', background: 'rgba(255,255,255,0.3)', margin: '0 auto 2rem' }} />
          </FadeUp>

          <FadeUp delay={800}>
            <p style={{ fontSize: '1.05rem', fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
              A pasos de la playa, el centro histórico colonial y los mejores sabores de la región.
            </p>
          </FadeUp>

          <FadeUp delay={950}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              <Link
                to="/habitaciones"
                style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 32px', background: '#fff', color: '#1C4A5A', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5EFE6'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Ver habitaciones
              </Link>
              <Link
                to="/registro"
                style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', backdropFilter: 'blur(4px)', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
              >
                Reservar ahora
              </Link>
            </div>
          </FadeUp>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 1s 2.2s ease both' }}>
          <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.25)' }} />
          <p style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Explorar</p>
        </div>
      </section>

      {/* ── Trust band ── */}
      <div style={{ background: '#1C4A5A', padding: '1rem 0' }}>
        <div style={{ ...containerStyle, padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {['12 habitaciones únicas', 'A 200m de la playa', 'Reserva confirmada al instante', 'Atención personalizada'].map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span style={{ margin: '0 1.5rem', color: 'rgba(255,255,255,0.15)' }}>·</span>}
                <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Habitaciones destacadas ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9943A', marginBottom: '1.25rem' }}>
              Nuestros espacios
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, lineHeight: 1.1, color: '#1C4A5A' }}>
              Habitaciones que<br /><em>invitan a quedarse</em>
            </h2>
          </div>

          <div style={gridStyle(2, '1.5rem', '340px')}>
            {ROOMS_PREVIEW.map((room, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.querySelector('img').style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.querySelector('img').style.transform = 'scale(1)'}
              >
                <img
                  src={room.img}
                  alt={room.tipo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9943A', marginBottom: '0.5rem' }}>
                    {room.tag}
                  </p>
                  <h3 className="font-heading" style={{ fontSize: '1.875rem', fontWeight: 300, color: '#fff', marginBottom: '0.5rem' }}>
                    {room.tipo}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {room.desc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
                      Desde{' '}
                      <strong style={{ color: '#fff', fontWeight: 500 }}>${room.precio.toLocaleString('es-CL')}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}> / noche</span>
                    </p>
                    <Link
                      to="/habitaciones"
                      style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '2px', textDecoration: 'none', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderBottomColor = '#fff' }}
                      onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.75)'; e.target.style.borderBottomColor = 'rgba(255,255,255,0.3)' }}
                    >
                      Ver más →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              to="/habitaciones"
              style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 32px', border: '1px solid #1C4A5A', color: '#1C4A5A', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1C4A5A'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1C4A5A' }}
            >
              Ver todas las habitaciones
            </Link>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ ...containerStyle, padding: '0 1.5rem' }}>
        <div style={{ borderTop: '1px solid #DDD0C0' }} />
      </div>

      {/* ── Sobre nosotros ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={{ ...containerStyle, ...gridStyle(2, '4rem', '320px'), alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9943A', marginBottom: '1.5rem' }}>
              Nuestra historia
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2.2rem,4.5vw,3.25rem)', fontWeight: 300, lineHeight: 1.15, color: '#1C4A5A', marginBottom: '1.25rem' }}>
              Hospitalidad con<br /><em>alma serenense</em>
            </h2>
            <div style={{ width: '40px', height: '1px', background: '#C9943A', marginBottom: '2rem' }} />
            <div style={{ color: '#6B6057', fontWeight: 300, lineHeight: 1.85, fontSize: '0.9375rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>
                Fundado en el corazón de La Serena, Hostal Mi Maravilla nació de un sueño familiar: ofrecer a cada viajero un lugar donde sentirse en casa, rodeados de la calidez del norte chico.
              </p>
              <p>
                Nuestra casa colonial fue restaurada con cuidado, conservando los detalles arquitectónicos originales e integrando todas las comodidades modernas para que tu estadía sea perfecta.
              </p>
              <p className="font-heading" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: '#1C4A5A', lineHeight: 1.5 }}>
                "El mejor punto de partida para explorar los valles, playas y observatorios de la región."
              </p>
            </div>
            <Link
              to="/habitaciones"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1C4A5A', borderBottom: '1px solid #1C4A5A', paddingBottom: '2px', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C9943A'; e.currentTarget.style.borderBottomColor = '#C9943A' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#1C4A5A'; e.currentTarget.style.borderBottomColor = '#1C4A5A' }}
            >
              Conoce nuestras habitaciones →
            </Link>
          </div>

          <div style={{ position: 'relative' }}>
            <img
              src={ABOUT_IMG}
              alt="Interior de Hostal Mi Maravilla"
              style={{ width: '100%', objectFit: 'cover', aspectRatio: '3/4', maxHeight: '500px' }}
            />
            <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', width: '120px', height: '120px', border: '1px solid #C9943A', zIndex: -1 }} />
          </div>
        </div>
      </section>

      {/* ── Amenidades ── */}
      <section style={{ padding: '5rem 1.5rem', background: '#E8D5B7' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6057', marginBottom: '1rem' }}>
              Servicios incluidos
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: '#1C4A5A' }}>
              Todo lo que necesitas
            </h2>
          </div>
          <div style={gridStyle(3, '0.75rem', '200px')}>
            {AMENIDADES.map((a, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'rgba(245,239,230,0.55)', transition: 'background 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,239,230,0.9)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,239,230,0.55)'}
              >
                <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                <span style={{ fontSize: '0.875rem', color: '#6B6057', fontWeight: 400 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '7rem 1.5rem', textAlign: 'center', background: '#1E1E1E' }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '1.75rem' }}>
            Disponibilidad en tiempo real
          </p>
          <h2 className="font-heading" style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: '1.5rem' }}>
            ¿Cuándo nos<br /><em>visitas?</em>
          </h2>
          <div style={{ width: '40px', height: '1px', background: '#C9943A', margin: '0 auto 2rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 300, lineHeight: 1.8, marginBottom: '2.5rem' }}>
            Elige tus fechas, confirma tu habitación y recibe un email de confirmación al instante. Sin intermediarios, mejor precio garantizado.
          </p>
          <Link
            to="/habitaciones"
            style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '16px 40px', background: '#fff', color: '#1E1E1E', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5EFE6'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Reservar directamente →
          </Link>
        </div>
      </section>

    </div>
  )
}
