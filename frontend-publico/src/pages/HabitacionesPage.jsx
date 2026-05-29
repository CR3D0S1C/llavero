import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../api'

const ESTADO_CONFIG = {
  disponible:    { label: 'Disponible',    bg: 'rgba(28,74,90,0.9)',   color: '#fff' },
  ocupado:       { label: 'Ocupado',       bg: 'rgba(181,83,62,0.9)',  color: '#fff' },
  reservado:     { label: 'Reservado',     bg: 'rgba(201,148,58,0.9)', color: '#fff' },
  no_disponible: { label: 'No disponible', bg: 'rgba(30,30,30,0.7)',   color: 'rgba(255,255,255,0.7)' },
}

const TIPO_FALLBACK = {
  'Habitación Individual':        '/uploads/habitaciones/hostal-doble-cama-01.webp',
  'Habitación Doble Matrimonial': '/uploads/habitaciones/hostal-doble-cama-01.webp',
  'Habitación Queen':             '/uploads/habitaciones/hostal-doble-cama-02.webp',
  'Habitación Triple':            '/uploads/habitaciones/hostal-doble-cama-01.webp',
  'Habitación Familiar':          '/uploads/habitaciones/hostal-sala-cuadros.webp',
  'Dormitorio Compartido':        '/uploads/habitaciones/hostal-sala-cuadros.webp',
}
const FALLBACK_DEFAULT = '/uploads/habitaciones/hostal-doble-cama-01.webp'

const C = {
  teal: '#1C4A5A', cream: '#F5EFE6', sand: '#E8D5B7',
  gold: '#C9943A', warm: '#6B6057', line: '#DDD0C0', charcoal: '#1E1E1E',
}

function HabitacionCard({ hab, index, detallePath }) {
  const portada = hab.fotos?.find(f => f.esPortada) || hab.fotos?.[0]
  const imgSrc = portada?.url || TIPO_FALLBACK[hab.tipoLabel] || FALLBACK_DEFAULT
  const estado = ESTADO_CONFIG[hab.estadoPublico] || ESTADO_CONFIG.no_disponible
  const precioDesde = hab.precios?.length
    ? Math.min(...hab.precios.map(p => Number(p.precio)))
    : null
  const disponible = hab.estadoPublico !== 'no_disponible'
  const to = detallePath || `/habitaciones/${hab.id}`

  return (
    <div className="group flex flex-col" style={{ background: '#fff' }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={imgSrc}
          alt={hab.tipoLabel}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(28,74,90,0.15)' }}
        />
        <span
          className="absolute top-4 right-4"
          style={{
            fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '5px 12px', background: estado.bg, color: estado.color,
            backdropFilter: 'blur(4px)',
          }}
        >
          {estado.label}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.1, color: C.teal }}>
              {hab.tipoLabel}
            </h3>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: C.warm, marginTop: '4px' }}>
              Hab. {hab.numero} · Baño {hab.bano}
              {hab.capacidadMax && ` · hasta ${hab.capacidadMax} pers.`}
            </p>
          </div>
          {precioDesde && (
            <div className="text-right">
              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.warm }}>desde</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 500, color: C.teal }}>
                ${precioDesde.toLocaleString('es-CL')}
              </p>
              <p style={{ fontSize: '10px', color: C.warm }}>por noche</p>
            </div>
          )}
        </div>

        {hab.descripcionWeb && (
          <p style={{ fontSize: '0.875rem', color: C.warm, lineHeight: 1.7, fontWeight: 300, marginBottom: '1rem' }}
            className="line-clamp-2">
            {hab.descripcionWeb}
          </p>
        )}

        {hab.amenidades && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {hab.amenidades.split(',').slice(0, 4).map(a => (
              <span key={a} style={{ fontSize: '10px', letterSpacing: '0.08em', padding: '4px 10px', border: `1px solid ${C.line}`, color: C.warm }}>
                {a.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <div style={{ borderTop: `1px solid ${C.line}`, marginBottom: '1.25rem' }} />
          <Link
            to={to}
            className="block text-center transition-all"
            style={{
              fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '12px',
              background: disponible ? C.teal : C.sand,
              color: disponible ? '#fff' : C.warm,
              pointerEvents: disponible ? 'auto' : 'none',
            }}
            onMouseEnter={e => disponible && (e.currentTarget.style.background = C.charcoal)}
            onMouseLeave={e => disponible && (e.currentTarget.style.background = C.teal)}
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
      <div style={{ aspectRatio: '4/3', background: C.sand }} />
      <div className="p-6 space-y-3">
        <div style={{ height: '24px', background: C.sand, width: '60%' }} />
        <div style={{ height: '14px', background: C.sand, width: '40%' }} />
        <div style={{ height: '14px', background: C.sand, width: '80%' }} />
        <div style={{ height: '42px', background: C.sand, marginTop: '1rem' }} />
      </div>
    </div>
  )
}

const PERSONAS_OPTS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function HabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [errorCarga, setErrorCarga] = useState(false)

  const [form, setForm] = useState({ fechaEntrada: '', fechaSalida: '', personas: '' })
  const [filtroActivo, setFiltroActivo] = useState(null)
  const [estacionamiento, setEstacionamiento] = useState(null)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    document.title = 'Habitaciones disponibles · Hostal Mi Maravilla'
    publicApi.getHabitaciones()
      .then(r => setHabitaciones(r.data))
      .catch(() => setErrorCarga(true))
      .finally(() => setLoading(false))
    return () => { document.title = 'Hostal Mi Maravilla · La Serena, Chile' }
  }, [])

  const handleBuscar = async () => {
    const { fechaEntrada, fechaSalida, personas } = form
    const tieneAlgo = fechaEntrada || fechaSalida || personas

    if (!tieneAlgo) return

    if (fechaEntrada && fechaSalida && fechaEntrada >= fechaSalida) return

    setBuscando(true)
    const params = {}
    if (fechaEntrada) params.fechaEntrada = fechaEntrada
    if (fechaSalida) params.fechaSalida = fechaSalida
    if (personas) params.personas = Number(personas)

    try {
      const promises = [publicApi.getHabitaciones(params)]
      const conFechas = fechaEntrada && fechaSalida && fechaEntrada < fechaSalida
      if (conFechas) promises.push(publicApi.getEstacionamiento(fechaEntrada, fechaSalida))

      const [habsRes, estacRes] = await Promise.all(promises)
      setHabitaciones(habsRes.data)
      setEstacionamiento(estacRes?.data || null)
      setFiltroActivo({ ...form })
    } finally {
      setBuscando(false)
    }
  }

  const handleLimpiar = async () => {
    setForm({ fechaEntrada: '', fechaSalida: '', personas: '' })
    setFiltroActivo(null)
    setEstacionamiento(null)
    setLoading(true)
    publicApi.getHabitaciones()
      .then(r => setHabitaciones(r.data))
      .finally(() => setLoading(false))
  }

  const fmtFecha = (str) => {
    if (!str) return ''
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }

  const linkParams = filtroActivo
    ? '?' + new URLSearchParams(
        Object.fromEntries(
          Object.entries({ fechaEntrada: filtroActivo.fechaEntrada, fechaSalida: filtroActivo.fechaSalida, personas: filtroActivo.personas })
            .filter(([, v]) => v)
        )
      ).toString()
    : ''

  const estacColor = estacionamiento
    ? estacionamiento.disponibles === 0 ? '#B5533E'
      : estacionamiento.disponibles <= 1 ? '#C9943A'
      : '#2A7D4F'
    : C.warm

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.teal, padding: '4rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
            Hostal Mi Maravilla
          </p>
          <h1 className="font-heading" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 300, lineHeight: 1.1, color: '#fff' }}>
            Nuestras habitaciones
          </h1>
          <div style={{ width: '40px', height: '1px', background: C.gold, marginTop: '1.5rem' }} />
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.line}`, padding: '1.5rem' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* Llegada */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.warm, marginBottom: '6px' }}>
                Llegada
              </label>
              <input
                type="date"
                min={hoy}
                value={form.fechaEntrada}
                onChange={e => setForm(f => ({ ...f, fechaEntrada: e.target.value, fechaSalida: f.fechaSalida && e.target.value >= f.fechaSalida ? '' : f.fechaSalida }))}
                className="input-line"
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            {/* Salida */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.warm, marginBottom: '6px' }}>
                Salida
              </label>
              <input
                type="date"
                min={form.fechaEntrada || hoy}
                value={form.fechaSalida}
                onChange={e => setForm(f => ({ ...f, fechaSalida: e.target.value }))}
                className="input-line"
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            {/* Personas */}
            <div style={{ flex: '0 0 130px' }}>
              <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.warm, marginBottom: '6px' }}>
                Personas
              </label>
              <select
                value={form.personas}
                onChange={e => setForm(f => ({ ...f, personas: e.target.value }))}
                className="input-line"
                style={{ fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <option value="">Cualquiera</option>
                {PERSONAS_OPTS.map(n => (
                  <option key={n} value={n}>{n}{n === 8 ? '+' : ''} persona{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Botón */}
            <button
              onClick={handleBuscar}
              disabled={buscando || (!form.fechaEntrada && !form.fechaSalida && !form.personas)}
              style={{
                flex: '0 0 auto',
                fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
                padding: '12px 28px',
                background: C.teal, color: '#fff', border: 'none', cursor: 'pointer',
                opacity: buscando || (!form.fechaEntrada && !form.fechaSalida && !form.personas) ? 0.5 : 1,
                transition: 'background 0.2s',
                alignSelf: 'flex-end',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.charcoal}
              onMouseLeave={e => e.currentTarget.style.background = C.teal}
            >
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Disponibilidad de estacionamiento */}
          {estacionamiento && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '16px' }}>🅿️</span>
              <span style={{ fontSize: '13px', color: estacColor, fontWeight: 500 }}>
                {estacionamiento.disponibles === 0
                  ? 'Sin estacionamientos disponibles para esas fechas'
                  : `${estacionamiento.disponibles} de ${estacionamiento.total} estacionamientos disponibles para esas fechas`
                }
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '3rem 1.5rem 8rem' }}>

        {/* Banner de filtro activo */}
        {filtroActivo && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.875rem 1.25rem', background: 'rgba(28,74,90,0.06)',
            border: `1px solid rgba(28,74,90,0.15)`, marginBottom: '2rem',
          }}>
            <p style={{ fontSize: '13px', color: C.teal, fontWeight: 500 }}>
              {habitaciones.length} habitación{habitaciones.length !== 1 ? 'es' : ''} disponible{habitaciones.length !== 1 ? 's' : ''}
              {filtroActivo.fechaEntrada && filtroActivo.fechaSalida && ` · ${fmtFecha(filtroActivo.fechaEntrada)} → ${fmtFecha(filtroActivo.fechaSalida)}`}
              {filtroActivo.personas && ` · ${filtroActivo.personas} persona${Number(filtroActivo.personas) !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={handleLimpiar}
              style={{ fontSize: '11px', letterSpacing: '0.12em', color: C.warm, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Grid */}
        {errorCarga ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <p className="font-heading" style={{ fontSize: '2rem', fontWeight: 300, color: C.teal, marginBottom: '1rem' }}>
              No pudimos cargar las habitaciones
            </p>
            <p style={{ color: C.warm, fontWeight: 300, marginBottom: '1.5rem' }}>
              Por favor intenta nuevamente o contáctanos por WhatsApp.
            </p>
            <button
              onClick={() => { setErrorCarga(false); setLoading(true); publicApi.getHabitaciones().then(r => setHabitaciones(r.data)).catch(() => setErrorCarga(true)).finally(() => setLoading(false)) }}
              style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 28px', background: C.teal, color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        ) : loading || buscando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : habitaciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <p className="font-heading" style={{ fontSize: '2rem', fontWeight: 300, color: C.teal, marginBottom: '1rem' }}>
              {filtroActivo ? 'Sin habitaciones disponibles para esos filtros' : 'Sin habitaciones disponibles'}
            </p>
            <p style={{ color: C.warm, fontWeight: 300 }}>
              {filtroActivo ? 'Intenta con otras fechas o menos personas.' : 'Por favor vuelve a intentarlo más tarde.'}
            </p>
            {filtroActivo && (
              <button
                onClick={handleLimpiar}
                style={{ marginTop: '1.5rem', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 28px', background: C.teal, color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Ver todas las habitaciones
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
            {habitaciones.map((hab, i) => (
              <HabitacionCard
                key={hab.id}
                hab={hab}
                index={i}
                detallePath={`/habitaciones/${hab.id}${linkParams}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
