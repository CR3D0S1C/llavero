import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { publicApi } from '../api'

// Fotos reales del hostal (locales, sin dependencia externa)
const HERO_IMG  = '/uploads/habitaciones/hostal-sala-cuadros.webp'
const ABOUT_IMG = '/uploads/habitaciones/hostal-doble-cama-02.webp'

const C = { teal: '#1C4A5A', gold: '#C9943A', warm: '#6B6057', cream: '#F5EFE6', sand: '#E8D5B7', line: '#DDD0C0' }

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

const gridStyle = (min = '320px', gap = '1.5rem') => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))`,
  gap,
})

const container = { maxWidth: '1152px', margin: '0 auto' }

export default function HomePage() {
  const [habitaciones, setHabitaciones] = useState([])
  const [totalHabs, setTotalHabs]       = useState(null)

  useEffect(() => {
    document.title = 'Hostal Mi Maravilla · La Serena, Chile'
    publicApi.getHabitaciones()
      .then(r => {
        setHabitaciones(r.data.slice(0, 3))
        setTotalHabs(r.data.length)
      })
      .catch(() => {})
  }, [])

  const precioMin = habitaciones.length
    ? Math.min(...habitaciones.flatMap(h => h.precios?.map(p => Number(p.precio)) || []))
    : null

  return (
    <div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', height: '100svh', minHeight: '620px' }}>
        <img
          src={HERO_IMG}
          alt="Hostal Mi Maravilla, La Serena"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 1.8s ease both' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,.55) 55%,rgba(0,0,0,.8) 100%)' }} />

        <div style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: '0 1.5rem', maxWidth: '56rem' }}>
          <FadeUp delay={250}>
            <p style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '2rem' }}>
              La Serena · IV Región · Chile
            </p>
          </FadeUp>
          <FadeUp delay={450}>
            <h1 className="font-heading" style={{ fontSize: 'clamp(3.2rem,8vw,6.5rem)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', marginBottom: '2rem', color: '#fff' }}>
              Un refugio en el<br /><em style={{ fontStyle: 'italic' }}>corazón del norte</em>
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
              {/* CORREGIDO: va a /habitaciones, no a /registro */}
              <Link
                to="/habitaciones"
                style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 32px', background: '#fff', color: C.teal, fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = C.cream}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Ver disponibilidad
              </Link>
              <a
                href="#ubicacion"
                style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', backdropFilter: 'blur(4px)', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
              >
                Cómo llegar
              </a>
            </div>
          </FadeUp>
        </div>

        <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 1s 2.2s ease both' }}>
          <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.25)' }} />
          <p style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Explorar</p>
        </div>
      </section>

      {/* ── Trust band ── */}
      <div style={{ background: C.teal, padding: '1rem 0' }}>
        <div style={{ ...container, padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {[
              totalHabs ? `${totalHabs} habitaciones` : 'Habitaciones acogedoras',
              'A 200m de la playa',
              'Reserva instantánea online',
              'Atención personalizada',
            ].map((item, i) => (
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

      {/* ── Habitaciones destacadas (desde API) ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={container}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: '1.25rem' }}>
              Nuestros espacios
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, lineHeight: 1.1, color: C.teal }}>
              Habitaciones que<br /><em>invitan a quedarse</em>
            </h2>
            {precioMin && (
              <p style={{ marginTop: '1rem', color: C.warm, fontWeight: 300, fontSize: '0.9375rem' }}>
                Desde <strong style={{ color: C.teal }}>${precioMin.toLocaleString('es-CL')}</strong> por noche
              </p>
            )}
          </div>

          {habitaciones.length === 0 ? (
            <div style={gridStyle('320px')}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: C.sand, aspectRatio: '4/3', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <div style={gridStyle('300px')}>
              {habitaciones.map((hab) => {
                const portada = hab.fotos?.find(f => f.esPortada) || hab.fotos?.[0]
                const precio  = hab.precios?.length ? Math.min(...hab.precios.map(p => Number(p.precio))) : null
                return (
                  <Link key={hab.id} to={`/habitaciones/${hab.id}`} style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', aspectRatio: '4/3' }}
                    onMouseEnter={e => e.currentTarget.querySelector('img').style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.querySelector('img').style.transform = 'scale(1)'}
                  >
                    <img
                      src={portada?.url || '/uploads/habitaciones/hostal-doble-cama-01.webp'}
                      alt={hab.tipoLabel}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 50%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem' }}>
                      <h3 className="font-heading" style={{ fontSize: '1.625rem', fontWeight: 300, color: '#fff', marginBottom: '0.25rem' }}>
                        {hab.tipoLabel}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '0.75rem' }}>
                        Hab. {hab.numero}{hab.capacidadMax ? ` · hasta ${hab.capacidadMax} pers.` : ''}
                      </p>
                      {precio && (
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                          Desde <strong style={{ color: '#fff', fontWeight: 500 }}>${precio.toLocaleString('es-CL')}</strong>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}> / noche</span>
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              to="/habitaciones"
              style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 32px', border: `1px solid ${C.teal}`, color: C.teal, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.teal }}
            >
              Ver todas las habitaciones
            </Link>
          </div>
        </div>
      </section>

      <div style={{ ...container, padding: '0 1.5rem' }}>
        <div style={{ borderTop: `1px solid ${C.line}` }} />
      </div>

      {/* ── Sobre nosotros ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={{ ...container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: '1.5rem' }}>
              Nuestra historia
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2.2rem,4.5vw,3.25rem)', fontWeight: 300, lineHeight: 1.15, color: C.teal, marginBottom: '1.25rem' }}>
              Hospitalidad con<br /><em>alma serenense</em>
            </h2>
            <div style={{ width: '40px', height: '1px', background: C.gold, marginBottom: '2rem' }} />
            <div style={{ color: C.warm, fontWeight: 300, lineHeight: 1.85, fontSize: '0.9375rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>
                Fundado en el corazón de La Serena, Hostal Mi Maravilla nació de un sueño familiar: ofrecer a cada viajero un lugar donde sentirse en casa, rodeados de la calidez del norte chico.
              </p>
              <p>
                Nuestra casa colonial fue restaurada con cuidado, conservando los detalles arquitectónicos originales e integrando todas las comodidades modernas para que tu estadía sea perfecta.
              </p>
              <p className="font-heading" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: C.teal, lineHeight: 1.5 }}>
                "El mejor punto de partida para explorar los valles, playas y observatorios de la región."
              </p>
            </div>
            <Link
              to="/habitaciones"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.teal, borderBottom: `1px solid ${C.teal}`, paddingBottom: '2px', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderBottomColor = C.gold }}
              onMouseLeave={e => { e.currentTarget.style.color = C.teal; e.currentTarget.style.borderBottomColor = C.teal }}
            >
              Conoce nuestras habitaciones →
            </Link>
          </div>

          <div style={{ position: 'relative' }}>
            <img
              src={ABOUT_IMG}
              alt="Interior de Hostal Mi Maravilla"
              loading="lazy"
              style={{ width: '100%', objectFit: 'cover', aspectRatio: '3/4', maxHeight: '500px' }}
            />
            <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', width: '120px', height: '120px', border: `1px solid ${C.gold}`, zIndex: -1 }} />
          </div>
        </div>
      </section>

      {/* ── Amenidades ── */}
      <section style={{ padding: '5rem 1.5rem', background: C.sand }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.warm, marginBottom: '1rem' }}>
              Servicios incluidos
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: C.teal }}>
              Todo lo que necesitas
            </h2>
          </div>
          <div style={gridStyle('200px', '0.75rem')}>
            {AMENIDADES.map((a, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'rgba(245,239,230,0.55)', transition: 'background 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,239,230,0.9)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,239,230,0.55)'}
              >
                <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                <span style={{ fontSize: '0.875rem', color: C.warm, fontWeight: 400 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Política de cancelación ── */}
      <section style={{ padding: '4rem 1.5rem', background: '#fff', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: '1rem' }}>
            Reserva con confianza
          </p>
          <h2 className="font-heading" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.5rem)', fontWeight: 300, color: C.teal, marginBottom: '2rem' }}>
            Política de cancelación
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', textAlign: 'left' }}>
            {[
              { icono: '✅', titulo: 'Cancelación gratuita', desc: 'Cancela hasta 48 horas antes de tu llegada sin costo.' },
              { icono: '💳', titulo: 'Pago flexible', desc: 'Paga con transferencia bancaria al confirmar tu reserva.' },
              { icono: '📧', titulo: 'Confirmación inmediata', desc: 'Recibes un email de confirmación al instante con todos los detalles.' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '1.5rem', border: `1px solid ${C.line}` }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.icono}</div>
                <p style={{ fontWeight: 600, color: C.teal, marginBottom: '0.5rem', fontSize: '0.9375rem' }}>{item.titulo}</p>
                <p style={{ fontSize: '0.875rem', color: C.warm, lineHeight: 1.65, fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ubicación ── */}
      <section id="ubicacion" style={{ padding: '5rem 1.5rem', background: C.cream }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: '1rem' }}>
              Encuéntranos
            </p>
            <h2 className="font-heading" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: C.teal }}>
              Cómo llegar
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { icon: '📍', titulo: 'Dirección', desc: 'Vicuña 461, La Serena, Región de Coquimbo' },
                { icon: '🏖️', titulo: 'A 200m de la playa', desc: 'Caminando hasta la playa de La Serena en pocos minutos.' },
                { icon: '🏛️', titulo: 'Centro histórico', desc: 'A pasos de la Iglesia Catedral y la calle comercial.' },
                { icon: '✈️', titulo: 'Desde el aeropuerto', desc: 'El Aeropuerto La Florida está a 10 minutos en taxi.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: C.teal, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{item.titulo}</p>
                    <p style={{ fontSize: '0.875rem', color: C.warm, fontWeight: 300, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
              <a
                href={`https://wa.me/56950455726?text=${encodeURIComponent('Hola! Quisiera consultar disponibilidad en Hostal Mi Maravilla.')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', padding: '12px 20px', background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="20" height="20" viewBox="0 0 32 32" fill="white"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.5L4 29l7.697-1.805A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm-3.5 8c-.28 0-.735.105-1.12.525C10.995 12.945 10 14.04 10 15.5c0 1.47 1.02 2.89 1.16 3.09.14.195 2.015 3.08 4.88 4.32 2.865 1.24 2.865.825 3.38.775.515-.05 1.66-.68 1.895-1.335.235-.655.235-1.215.165-1.335-.07-.12-.26-.19-.545-.335-.285-.145-1.66-.82-1.915-.915-.255-.095-.44-.145-.625.145-.185.285-.715.915-.875 1.1-.16.185-.32.21-.595.07-.285-.145-1.195-.44-2.275-1.405-.84-.75-1.41-1.675-1.575-1.96-.165-.285-.018-.44.125-.58.128-.127.285-.335.428-.5.14-.165.188-.285.283-.475.094-.19.047-.355-.024-.5-.07-.145-.625-1.51-.86-2.07C13.085 11.14 12.78 11 12.5 11z"/></svg>
                Consultar por WhatsApp
              </a>
            </div>

            {/* Mapa embed */}
            <div style={{ borderRadius: 0, overflow: 'hidden', border: `1px solid ${C.line}` }}>
              <iframe
                title="Ubicación Hostal Mi Maravilla"
                src="https://maps.google.com/maps?q=Vicu%C3%B1a+461+La+Serena+Chile&z=16&output=embed"
                width="100%"
                height="320"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ padding: '7rem 1.5rem', textAlign: 'center', background: '#1E1E1E' }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '1.75rem' }}>
            Disponibilidad en tiempo real
          </p>
          <h2 className="font-heading" style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: '1.5rem' }}>
            ¿Cuándo nos<br /><em>visitas?</em>
          </h2>
          <div style={{ width: '40px', height: '1px', background: C.gold, margin: '0 auto 1.5rem' }} />
          {precioMin && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300, marginBottom: '0.75rem', fontSize: '1rem' }}>
              Desde <strong style={{ color: '#fff', fontWeight: 400 }}>${precioMin.toLocaleString('es-CL')}</strong> por noche
            </p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 300, lineHeight: 1.8, marginBottom: '2.5rem' }}>
            Elige tus fechas, confirma tu habitación y recibe un email al instante. Sin intermediarios, mejor precio garantizado.
          </p>
          <Link
            to="/habitaciones"
            style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '16px 40px', background: '#fff', color: '#1E1E1E', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.cream}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Ver habitaciones disponibles →
          </Link>
        </div>
      </section>

    </div>
  )
}
