import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { publicApi, bookingApi } from '../api'
import { useAuth } from '../context/AuthContext'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'

const C = {
  teal: '#1C4A5A',
  cream: '#F5EFE6',
  sand: '#E8D5B7',
  gold: '#C9943A',
  warm: '#6B6057',
  line: '#DDD0C0',
  charcoal: '#1E1E1E',
  terracotta: '#B5533E',
}

const diffDays = (a, b) => {
  if (!a || !b) return 0
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

export default function HabitacionDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { huesped } = useAuth()
  const [searchParams] = useSearchParams()

  const paramFechaEntrada = searchParams.get('fechaEntrada') || ''
  const paramFechaSalida  = searchParams.get('fechaSalida')  || ''
  const paramPersonas     = searchParams.get('personas')     || ''

  const [hab, setHab] = useState(null)
  const [fotoActual, setFotoActual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState(null)

  const [fechaEntrada, setFechaEntrada] = useState(paramFechaEntrada)
  const [fechaSalida, setFechaSalida] = useState(paramFechaSalida)
  const [notas, setNotas] = useState('')
  const [conEstacionamiento, setConEstacionamiento] = useState(false)
  const [estacionamiento, setEstacionamiento] = useState(null)
  const [disponible, setDisponible] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [reservando, setReservando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [exitoEmail, setExitoEmail] = useState('')

  const [guestNombre, setGuestNombre] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestTelefono, setGuestTelefono] = useState('')

  useEffect(() => {
    publicApi.getHabitacion(id)
      .then(r => {
        setHab(r.data)
        const portadaIdx = r.data.fotos?.findIndex(f => f.esPortada)
        if (portadaIdx > 0) setFotoActual(portadaIdx)
        if (r.data.precios?.length > 0) setTarifaSeleccionada(0)
      })
      .catch(() => navigate('/habitaciones'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (fechaEntrada && fechaSalida && fechaEntrada < fechaSalida) {
      setVerificando(true)
      setDisponible(null)
      setEstacionamiento(null)
      Promise.all([
        publicApi.verificarDisponibilidad(id, fechaEntrada, fechaSalida),
        publicApi.getEstacionamiento(fechaEntrada, fechaSalida),
      ]).then(([dispRes, estacRes]) => {
        setDisponible(dispRes.data.disponible)
        setEstacionamiento(estacRes.data)
      }).finally(() => setVerificando(false))
    } else {
      setDisponible(null)
      setEstacionamiento(null)
      setConEstacionamiento(false)
    }
  }, [fechaEntrada, fechaSalida])

  const noches = useMemo(() => diffDays(fechaEntrada, fechaSalida), [fechaEntrada, fechaSalida])

  const precioTotal = useMemo(() => {
    if (!hab?.precios?.length || tarifaSeleccionada === null || !noches) return null
    const tarifa = hab.precios[tarifaSeleccionada]
    return Number(tarifa.precio) * noches
  }, [hab, tarifaSeleccionada, noches])

  const handleReservar = async () => {
    setReservando(true)
    setError('')
    try {
      const tarifa = tarifaSeleccionada !== null ? hab.precios[tarifaSeleccionada] : null
      const notaFinal = [
        tarifa ? `Tarifa seleccionada: ${tarifa.duracion} · ${tarifa.personas} persona(s)` : '',
        notas,
      ].filter(Boolean).join(' — ')

      if (huesped) {
        await bookingApi.crearReserva({
          habitacionId: id,
          fechaEntrada,
          fechaSalida,
          notas: notaFinal || null,
          personas: paramPersonas ? parseInt(paramPersonas) : null,
          conEstacionamiento,
          montoEstimado: precioTotal ?? null,
        })
        setExitoEmail(huesped.email)
      } else {
        await publicApi.crearReservaInvitado({
          nombre: guestNombre.trim(),
          email: guestEmail.trim(),
          telefono: guestTelefono.trim() || null,
          habitacionId: id,
          fechaEntrada,
          fechaSalida,
          notas: notaFinal || null,
          personas: paramPersonas ? parseInt(paramPersonas) : null,
          conEstacionamiento,
          montoEstimado: precioTotal ?? null,
        })
        setExitoEmail(guestEmail.trim())
      }
      setExito(true)
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear la reserva')
    } finally {
      setReservando(false)
    }
  }

  const hoy = new Date().toISOString().split('T')[0]
  const guestValido = !huesped ? (guestNombre.trim().length > 0 && guestEmail.includes('@')) : true
  const canBook = fechaEntrada && fechaSalida && disponible === true && !reservando && guestValido

  if (loading) return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div className="animate-pulse space-y-4">
        <div style={{ height: '440px', background: C.sand, borderRadius: '0' }} />
        <div style={{ height: '28px', background: C.sand, width: '40%' }} />
        <div style={{ height: '16px', background: C.sand, width: '65%' }} />
      </div>
    </div>
  )

  if (!hab) return null

  const portadaSrc = hab.fotos?.[fotoActual]?.url || FALLBACK_IMG
  const precioMin = hab.precios?.length
    ? Math.min(...hab.precios.map(p => Number(p.precio)))
    : null

  return (
    <div style={{ backgroundColor: C.cream, width: '100%' }}>

      {/* ── Carrusel hero ── */}
      <div style={{ width: '100%', aspectRatio: '21/9', maxHeight: '520px', overflow: 'hidden', position: 'relative', minHeight: '260px' }}>
        {/* Imagen con fade */}
        <div key={fotoActual} style={{ width: '100%', height: '100%', animation: 'fadeIn 0.4s ease both' }}>
          <img
            src={hab.fotos?.[fotoActual]?.url || FALLBACK_IMG}
            alt={hab.tipoLabel}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />

        {/* Flecha izquierda */}
        {hab.fotos?.length > 1 && (
          <button
            onClick={() => setFotoActual(i => (i - 1 + hab.fotos.length) % hab.fotos.length)}
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
              fontSize: '1.5rem', cursor: 'pointer', transition: 'background 0.2s',
              lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
          >
            ‹
          </button>
        )}

        {/* Flecha derecha */}
        {hab.fotos?.length > 1 && (
          <button
            onClick={() => setFotoActual(i => (i + 1) % hab.fotos.length)}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
              fontSize: '1.5rem', cursor: 'pointer', transition: 'background 0.2s',
              lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
          >
            ›
          </button>
        )}

        {/* Info + contador */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem 2.5rem' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: '0.5rem' }}>
                Hab. {hab.numero} · Baño {hab.bano}
              </p>
              <h1 className="font-heading" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: '#fff', lineHeight: 1.1 }}>
                {hab.tipoLabel}
              </h1>
            </div>
            {/* Contador de fotos */}
            {hab.fotos?.length > 1 && (
              <span style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.7)',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                padding: '4px 10px', letterSpacing: '0.06em',
              }}>
                {fotoActual + 1} / {hab.fotos.length}
              </span>
            )}
          </div>
        </div>

        {/* Puntos indicadores */}
        {hab.fotos?.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '6px', alignItems: 'center',
          }}>
            {hab.fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setFotoActual(i)}
                style={{
                  width: i === fotoActual ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === fotoActual ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: 'none', padding: 0, cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: '1.5rem', left: '1.5rem',
            fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: '8px 16px', cursor: 'pointer',
          }}
        >
          ← Habitaciones
        </button>
      </div>

      {/* ── Thumbnails ── */}
      {hab.fotos?.length > 1 && (
        <div style={{ background: C.charcoal, padding: '0.75rem 0' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {hab.fotos.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setFotoActual(i)}
                style={{
                  flexShrink: 0, width: '80px', height: '56px', overflow: 'hidden',
                  border: i === fotoActual ? `2px solid ${C.gold}` : '2px solid transparent',
                  opacity: i === fotoActual ? 1 : 0.5,
                  transition: 'all 0.2s', cursor: 'pointer', padding: 0,
                }}
              >
                <img src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Contenido principal ── */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>

          {/* ── Columna izquierda: info + tarifas ── */}
          <div>
            {/* Precio desde */}
            {precioMin && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 600, color: C.teal }}>${precioMin.toLocaleString('es-CL')}</span>
                <span style={{ color: C.warm, fontSize: '0.875rem' }}>/ por tarifa</span>
              </div>
            )}

            {/* Descripción */}
            {hab.descripcionWeb && (
              <p style={{ color: C.warm, fontWeight: 300, lineHeight: 1.85, fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                {hab.descripcionWeb}
              </p>
            )}

            {/* Amenidades */}
            {hab.amenidades && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '2rem' }}>
                {hab.amenidades.split(',').map(a => (
                  <span key={a} style={{
                    fontSize: '11px', letterSpacing: '0.06em',
                    padding: '5px 12px',
                    border: `1px solid ${C.line}`, color: C.warm,
                  }}>
                    {a.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* ── Selector de tarifas ── */}
            {hab.precios?.length > 0 && (
              <div>
                <div style={{ borderTop: `1px solid ${C.line}`, marginBottom: '1.5rem' }} />
                <p style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.teal, marginBottom: '1rem' }}>
                  Elige tu tarifa
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hab.precios.map((p, i) => {
                    const seleccionada = tarifaSeleccionada === i
                    return (
                      <button
                        key={i}
                        onClick={() => setTarifaSeleccionada(i)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          border: seleccionada ? `2px solid ${C.teal}` : `1px solid ${C.line}`,
                          background: seleccionada ? 'rgba(28,74,90,0.06)' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {/* Radio visual */}
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                            border: seleccionada ? `5px solid ${C.teal}` : `2px solid ${C.line}`,
                            transition: 'all 0.15s',
                          }} />
                          <div>
                            <p style={{ fontSize: '0.9375rem', fontWeight: seleccionada ? 500 : 400, color: C.charcoal }}>
                              {p.duracion}
                            </p>
                            <p style={{ fontSize: '12px', color: C.warm, marginTop: '2px' }}>
                              {p.personas} persona{p.personas !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: seleccionada ? C.teal : C.charcoal }}>
                            ${Number(p.precio).toLocaleString('es-CL')}
                          </p>
                          <p style={{ fontSize: '11px', color: C.warm }}>por noche</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Columna derecha: formulario de reserva ── */}
          <div>
            <div style={{
              border: `1px solid ${C.line}`,
              background: '#fff',
              position: 'sticky', top: '88px',
            }}>
              {/* Header del card */}
              <div style={{ background: C.teal, padding: '1.25rem 1.5rem' }}>
                <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
                  Solicitar reserva
                </p>
                {tarifaSeleccionada !== null && hab.precios?.[tarifaSeleccionada] && (
                  <p style={{ color: '#fff', fontWeight: 300, fontSize: '0.875rem' }}>
                    {hab.precios[tarifaSeleccionada].duracion} · {hab.precios[tarifaSeleccionada].personas} pers.
                    {' · '}
                    <strong style={{ fontWeight: 600 }}>
                      ${Number(hab.precios[tarifaSeleccionada].precio).toLocaleString('es-CL')}
                    </strong>
                    <span style={{ opacity: 0.6 }}> / noche</span>
                  </p>
                )}
              </div>

              {hab.estadoPublico === 'no_disponible' ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ color: C.warm, fontSize: '0.875rem', fontWeight: 300 }}>
                    Esta habitación no está disponible para reservas en este momento.
                  </p>
                </div>
              ) : exito ? (
                <div style={{ padding: '2rem 1.5rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1rem',
                      background: C.teal, color: '#fff', fontSize: '1.25rem',
                    }}>✓</div>
                    <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 400, color: C.teal, marginBottom: '0.5rem' }}>
                      ¡Reserva enviada!
                    </h3>
                    <p style={{ color: C.warm, fontWeight: 300, fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Enviamos los detalles a <strong>{exitoEmail}</strong>
                    </p>
                  </div>

                  {/* Datos de transferencia */}
                  <div style={{ background: '#fffbeb', border: `1px solid ${C.sand}`, borderLeft: `3px solid ${C.gold}`, padding: '1rem', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: C.charcoal, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      Depósito para confirmar tu reserva
                    </p>
                    <p style={{ fontSize: '12px', color: C.warm, lineHeight: 1.55, marginBottom: '0.75rem' }}>
                      Te contactaremos para coordinar el monto. Si prefieres hacerlo ahora:
                    </p>
                    <div style={{ fontSize: '12px', lineHeight: 2, color: C.charcoal }}>
                      <div><span style={{ color: C.warm }}>Banco:</span> <strong>Banco Santander</strong></div>
                      <div><span style={{ color: C.warm }}>Tipo:</span> <strong>Cuenta Corriente</strong></div>
                      <div><span style={{ color: C.warm }}>N° cuenta:</span> <strong>66959287</strong></div>
                      <div><span style={{ color: C.warm }}>RUT:</span> <strong>10.813.858-0</strong></div>
                      <div><span style={{ color: C.warm }}>Titular:</span> <strong>Abelardo Pedro Cruchaga Quinteros</strong></div>
                    </div>
                    <p style={{ fontSize: '11px', color: C.warm, marginTop: '0.5rem' }}>
                      Envía el comprobante a{' '}
                      <span style={{ color: C.teal, fontWeight: 500 }}>hostalmimaravilla@gmail.com</span>
                    </p>
                  </div>

                  {huesped && (
                    <button
                      onClick={() => navigate('/mis-reservas')}
                      style={{
                        fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: C.teal, background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: `1px solid ${C.teal}`, paddingBottom: '2px', display: 'block', margin: '0 auto',
                      }}
                    >
                      Ver mis reservas →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: '1.5rem' }}>

                  {/* Fechas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.warm, display: 'block', marginBottom: '8px' }}>
                        Llegada
                      </label>
                      <input
                        type="date"
                        min={hoy}
                        value={fechaEntrada}
                        onChange={e => setFechaEntrada(e.target.value)}
                        className="input-line"
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.warm, display: 'block', marginBottom: '8px' }}>
                        Salida
                      </label>
                      <input
                        type="date"
                        min={fechaEntrada || hoy}
                        value={fechaSalida}
                        onChange={e => setFechaSalida(e.target.value)}
                        className="input-line"
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  {/* Estado disponibilidad */}
                  <div style={{ minHeight: '22px', marginBottom: '1rem' }}>
                    {verificando && (
                      <p style={{ fontSize: '12px', color: C.warm }}>Verificando disponibilidad...</p>
                    )}
                    {!verificando && disponible === true && (
                      <p style={{ fontSize: '12px', color: '#2A7D4F', fontWeight: 500 }}>✓ Disponible para esas fechas</p>
                    )}
                    {!verificando && disponible === false && (
                      <p style={{ fontSize: '12px', color: C.terracotta, fontWeight: 500 }}>✗ No disponible para esas fechas</p>
                    )}
                  </div>

                  {/* Estacionamiento */}
                  {estacionamiento && disponible === true && (
                    <div style={{ marginBottom: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => estacionamiento.disponibles > 0 && setConEstacionamiento(v => !v)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem',
                          padding: '0.875rem 1rem',
                          border: conEstacionamiento ? `2px solid ${C.teal}` : `1px solid ${C.line}`,
                          background: conEstacionamiento ? 'rgba(28,74,90,0.05)' : '#fff',
                          cursor: estacionamiento.disponibles > 0 ? 'pointer' : 'not-allowed',
                          textAlign: 'left', transition: 'all 0.15s',
                          opacity: estacionamiento.disponibles === 0 ? 0.55 : 1,
                        }}
                      >
                        <div style={{
                          width: '18px', height: '18px', flexShrink: 0,
                          border: conEstacionamiento ? `5px solid ${C.teal}` : `2px solid ${C.line}`,
                          borderRadius: '3px', transition: 'all 0.15s',
                          background: conEstacionamiento ? C.teal : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {conEstacionamiento && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: conEstacionamiento ? 500 : 400, color: C.charcoal }}>
                            🅿️ Agregar estacionamiento
                          </p>
                          <p style={{ fontSize: '11px', color: estacionamiento.disponibles === 0 ? '#B5533E' : C.warm, marginTop: '2px' }}>
                            {estacionamiento.disponibles === 0
                              ? 'Sin disponibilidad para esas fechas'
                              : `${estacionamiento.disponibles} de ${estacionamiento.total} disponibles · sin costo adicional`
                            }
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Resumen precio */}
                  {noches > 0 && tarifaSeleccionada !== null && hab.precios?.[tarifaSeleccionada] && (
                    <div style={{
                      background: '#F5EFE6', border: `1px solid ${C.sand}`,
                      padding: '0.875rem 1rem', marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: C.warm }}>
                          ${Number(hab.precios[tarifaSeleccionada].precio).toLocaleString('es-CL')} × {noches} noche{noches !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '13px', color: C.charcoal, fontWeight: 500 }}>
                          ${precioTotal?.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: C.teal }}>Total estimado</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: C.teal }}>${precioTotal?.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.warm, display: 'block', marginBottom: '8px' }}>
                      Notas <span style={{ color: C.line, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                    </label>
                    <textarea
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      placeholder="Hora de llegada, solicitudes especiales..."
                      rows={2}
                      className="input-line"
                      style={{ resize: 'none', fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* Formulario de datos para reserva sin registro */}
                  {!huesped && disponible === true && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: '1.25rem', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.teal, marginBottom: '0.75rem' }}>
                          Tus datos de contacto
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.warm, display: 'block', marginBottom: '6px' }}>
                              Nombre completo *
                            </label>
                            <input
                              type="text"
                              value={guestNombre}
                              onChange={e => setGuestNombre(e.target.value)}
                              placeholder="Juan Pérez"
                              className="input-line"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.warm, display: 'block', marginBottom: '6px' }}>
                              Email *
                            </label>
                            <input
                              type="email"
                              value={guestEmail}
                              onChange={e => setGuestEmail(e.target.value)}
                              placeholder="correo@ejemplo.com"
                              className="input-line"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.warm, display: 'block', marginBottom: '6px' }}>
                              Teléfono <span style={{ color: C.line, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                            </label>
                            <input
                              type="tel"
                              value={guestTelefono}
                              onChange={e => setGuestTelefono(e.target.value)}
                              placeholder="+56 9 1234 5678"
                              className="input-line"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p style={{ fontSize: '13px', color: C.terracotta, marginBottom: '1rem', lineHeight: 1.4 }}>{error}</p>
                  )}

                  <button
                    onClick={handleReservar}
                    disabled={!canBook}
                    style={{
                      width: '100%',
                      fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase',
                      padding: '15px',
                      background: canBook ? C.teal : C.sand,
                      color: canBook ? '#fff' : C.warm,
                      border: 'none',
                      cursor: canBook ? 'pointer' : 'not-allowed',
                      transition: 'background 0.2s',
                      fontWeight: 500,
                    }}
                    onMouseEnter={e => { if (canBook) e.currentTarget.style.background = C.charcoal }}
                    onMouseLeave={e => { if (canBook) e.currentTarget.style.background = C.teal }}
                  >
                    {reservando ? 'Enviando reserva...' : 'Solicitar reserva'}
                  </button>

                  {!huesped && (
                    <p style={{ fontSize: '12px', textAlign: 'center', color: C.warm, marginTop: '1rem' }}>
                      ¿Ya tienes cuenta?{' '}
                      <button
                        onClick={() => navigate('/login')}
                        style={{ color: C.teal, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${C.teal}`, paddingBottom: '1px', fontSize: '12px' }}
                      >
                        Inicia sesión
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
