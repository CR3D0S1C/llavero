import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { publicApi, bookingApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function HabitacionDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { huesped } = useAuth()

  const [hab, setHab] = useState(null)
  const [fotoActual, setFotoActual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fechaEntrada, setFechaEntrada] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [notas, setNotas] = useState('')
  const [disponible, setDisponible] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [reservando, setReservando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    publicApi.getHabitacion(id)
      .then(r => {
        setHab(r.data)
        const portadaIdx = r.data.fotos?.findIndex(f => f.esPortada)
        if (portadaIdx > 0) setFotoActual(portadaIdx)
      })
      .catch(() => navigate('/habitaciones'))
      .finally(() => setLoading(false))
  }, [id])

  const verificarDisponibilidad = async () => {
    if (!fechaEntrada || !fechaSalida) return
    setVerificando(true)
    setDisponible(null)
    try {
      const r = await publicApi.verificarDisponibilidad(id, fechaEntrada, fechaSalida)
      setDisponible(r.data.disponible)
    } finally {
      setVerificando(false)
    }
  }

  useEffect(() => {
    if (fechaEntrada && fechaSalida && fechaEntrada < fechaSalida) {
      verificarDisponibilidad()
    } else {
      setDisponible(null)
    }
  }, [fechaEntrada, fechaSalida])

  const handleReservar = async () => {
    if (!huesped) { navigate('/login'); return }
    setReservando(true)
    setError('')
    try {
      await bookingApi.crearReserva({
        habitacionId: id,
        fechaEntrada,
        fechaSalida,
        notas,
      })
      setExito(true)
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear la reserva')
    } finally {
      setReservando(false)
    }
  }

  const hoy = new Date().toISOString().split('T')[0]

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-64 bg-gray-100 rounded-2xl mb-8" />
      <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
    </div>
  )

  if (!hab) return null

  const portada = hab.fotos?.[fotoActual]
  const precioMin = hab.precios?.length
    ? Math.min(...hab.precios.map(p => Number(p.precio)))
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <button onClick={() => navigate('/habitaciones')} className="text-sm text-gray-400 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Volver a habitaciones
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Galería */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video mb-3">
            {portada ? (
              <img src={portada.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-200">🛏️</div>
            )}
          </div>
          {hab.fotos?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {hab.fotos.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setFotoActual(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === fotoActual ? 'border-gray-900' : 'border-transparent'}`}
                >
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + reserva */}
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{hab.tipoLabel}</h1>
            <p className="text-gray-400 text-sm">Habitación {hab.numero} · Baño {hab.bano}</p>
            {precioMin && (
              <p className="text-lg font-semibold text-gray-900 mt-2">
                Desde ${precioMin.toLocaleString('es-CL')} por noche
              </p>
            )}
          </div>

          {hab.descripcionWeb && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{hab.descripcionWeb}</p>
          )}

          {hab.amenidades && (
            <div className="flex flex-wrap gap-1 mb-6">
              {hab.amenidades.split(',').map(a => (
                <span key={a} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {a.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Precios tabla */}
          {hab.precios?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tarifas</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-left p-3">Duración</th>
                      <th className="text-left p-3">Personas</th>
                      <th className="text-right p-3">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {hab.precios.map((p, i) => (
                      <tr key={i}>
                        <td className="p-3 text-gray-700">{p.duracion}</td>
                        <td className="p-3 text-gray-500">{p.personas} persona{p.personas > 1 ? 's' : ''}</td>
                        <td className="p-3 text-right font-medium text-gray-900">
                          ${Number(p.precio).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formulario de reserva */}
          {hab.estadoPublico === 'disponible' ? (
            exito ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-semibold text-green-800 mb-1">¡Reserva enviada!</h3>
                <p className="text-sm text-green-600 mb-3">
                  Recibirás confirmación una vez que el hostal la apruebe.
                </p>
                <button
                  onClick={() => navigate('/mis-reservas')}
                  className="text-sm text-green-700 underline"
                >
                  Ver mis reservas →
                </button>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Solicitar reserva</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Llegada</label>
                      <input
                        type="date"
                        min={hoy}
                        value={fechaEntrada}
                        onChange={e => setFechaEntrada(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Salida</label>
                      <input
                        type="date"
                        min={fechaEntrada || hoy}
                        value={fechaSalida}
                        onChange={e => setFechaSalida(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                      />
                    </div>
                  </div>

                  {verificando && <p className="text-xs text-gray-400">Verificando disponibilidad...</p>}
                  {!verificando && disponible === true && (
                    <p className="text-xs text-green-600 font-medium">✓ Disponible para esas fechas</p>
                  )}
                  {!verificando && disponible === false && (
                    <p className="text-xs text-red-500 font-medium">✗ No disponible para esas fechas</p>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Notas (opcional)</label>
                    <textarea
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      placeholder="Hora de llegada aproximada, solicitudes especiales..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                    />
                  </div>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <button
                    onClick={handleReservar}
                    disabled={!fechaEntrada || !fechaSalida || disponible === false || reservando}
                    className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {reservando ? 'Enviando...' : huesped ? 'Solicitar reserva' : 'Inicia sesión para reservar'}
                  </button>

                  {!huesped && (
                    <p className="text-xs text-center text-gray-400">
                      ¿No tienes cuenta?{' '}
                      <button onClick={() => navigate('/registro')} className="text-gray-700 underline">
                        Regístrate gratis
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center text-sm text-gray-400">
              Esta habitación no está disponible para reservas en este momento.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
