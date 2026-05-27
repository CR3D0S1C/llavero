import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../api'

const ESTADO_CONFIG = {
  disponible:    { label: 'Disponible',    bg: 'rgba(28,74,90,0.9)',   color: '#fff' },
  ocupado:       { label: 'Ocupado',       bg: 'rgba(181,83,62,0.9)',  color: '#fff' },
  reservado:     { label: 'Reservado',     bg: 'rgba(201,148,58,0.9)', color: '#fff' },
  no_disponible: { label: 'No disponible', bg: 'rgba(30,30,30,0.7)',   color: 'rgba(255,255,255,0.7)' },
}

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
]

function HabitacionCard({ hab, index }) {
  const portada = hab.fotos?.find(f => f.esPortada) || hab.fotos?.[0]
  const imgSrc = portada?.url || FALLBACK_IMGS[index % FALLBACK_IMGS.length]
  const estado = ESTADO_CONFIG[hab.estadoPublico] || ESTADO_CONFIG.no_disponible
  const precioDesde = hab.precios?.length
    ? Math.min(...hab.precios.map(p => Number(p.precio)))
    : null
  const disponible = hab.estadoPublico !== 'no_disponible'

  return (
    <div className="group flex flex-col" style={{ background: '#fff' }}>
      {/* Imagen */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={imgSrc}
          alt={hab.tipoLabel}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(28,74,90,0.15)' }}
        />
        {/* Estado badge */}
        <span
          className="absolute top-4 right-4"
          style={{
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '5px 12px',
            background: estado.bg,
            color: estado.color,
            backdropFilter: 'blur(4px)',
          }}
        >
          {estado.label}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heading text-teal" style={{ fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.1 }}>
              {hab.tipoLabel}
            </h3>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#6B6057', marginTop: '4px' }}>
              Hab. {hab.numero} · Baño {hab.bano}
            </p>
          </div>
          {precioDesde && (
            <div className="text-right">
              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6057' }}>desde</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#1C4A5A' }}>
                ${precioDesde.toLocaleString('es-CL')}
              </p>
              <p style={{ fontSize: '10px', color: '#6B6057' }}>por noche</p>
            </div>
          )}
        </div>

        {hab.descripcionWeb && (
          <p style={{ fontSize: '0.875rem', color: '#6B6057', lineHeight: 1.7, fontWeight: 300, marginBottom: '1rem' }}
            className="line-clamp-2">
            {hab.descripcionWeb}
          </p>
        )}

        {hab.amenidades && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {hab.amenidades.split(',').slice(0, 4).map(a => (
              <span
                key={a}
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  padding: '4px 10px',
                  border: '1px solid #DDD0C0',
                  color: '#6B6057',
                }}
              >
                {a.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <div style={{ borderTop: '1px solid #DDD0C0', marginBottom: '1.25rem' }} />
          <Link
            to={`/habitaciones/${hab.id}`}
            className="block text-center transition-all"
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '12px',
              background: disponible ? '#1C4A5A' : '#E8D5B7',
              color: disponible ? '#fff' : '#6B6057',
              pointerEvents: disponible ? 'auto' : 'none',
            }}
            onMouseEnter={e => disponible && (e.currentTarget.style.background = '#1E1E1E')}
            onMouseLeave={e => disponible && (e.currentTarget.style.background = '#1C4A5A')}
          >
            {disponible ? 'Ver y reservar' : 'No disponible'}
          </Link>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff' }} className="animate-pulse">
      <div style={{ aspectRatio: '4/3', background: '#E8D5B7' }} />
      <div className="p-6 space-y-3">
        <div style={{ height: '24px', background: '#E8D5B7', width: '60%' }} />
        <div style={{ height: '14px', background: '#E8D5B7', width: '40%' }} />
        <div style={{ height: '14px', background: '#E8D5B7', width: '80%' }} />
        <div style={{ height: '42px', background: '#E8D5B7', marginTop: '1rem' }} />
      </div>
    </div>
  )
}

export default function HabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getHabitaciones()
      .then(r => setHabitaciones(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="bg-teal py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
            Hostal Mi Maravilla
          </p>
          <h1 className="font-heading text-white" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, lineHeight: 1.1 }}>
            Nuestras habitaciones
          </h1>
          <div style={{ width: '40px', height: '1px', background: '#C9943A', marginTop: '1.5rem' }} />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : habitaciones.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-heading text-teal mb-4" style={{ fontSize: '2rem', fontWeight: 300 }}>
              Sin habitaciones disponibles
            </p>
            <p style={{ color: '#6B6057', fontWeight: 300 }}>
              Por favor vuelve a intentarlo más tarde.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habitaciones.map((hab, i) => (
              <HabitacionCard key={hab.id} hab={hab} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
