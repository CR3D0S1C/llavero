import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../api'

const ESTADO_LABEL = {
  disponible: { label: 'Disponible', color: 'bg-green-100 text-green-700' },
  ocupado: { label: 'Ocupado', color: 'bg-red-100 text-red-600' },
  reservado: { label: 'Reservado', color: 'bg-yellow-100 text-yellow-700' },
  no_disponible: { label: 'No disponible', color: 'bg-gray-100 text-gray-500' },
}

function HabitacionCard({ hab }) {
  const portada = hab.fotos?.find(f => f.esPortada) || hab.fotos?.[0]
  const estado = ESTADO_LABEL[hab.estadoPublico] || ESTADO_LABEL.no_disponible
  const precioDesde = hab.precios?.length
    ? Math.min(...hab.precios.map(p => Number(p.precio)))
    : null

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative bg-gray-100 aspect-video overflow-hidden">
        {portada ? (
          <img
            src={portada.url}
            alt={hab.tipoLabel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
            🛏️
          </div>
        )}
        <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full ${estado.color}`}>
          {estado.label}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{hab.tipoLabel}</h3>
            <p className="text-sm text-gray-400">Hab. {hab.numero} · Baño {hab.bano}</p>
          </div>
          {precioDesde && (
            <div className="text-right">
              <p className="text-xs text-gray-400">desde</p>
              <p className="font-bold text-gray-900">${precioDesde.toLocaleString('es-CL')}</p>
            </div>
          )}
        </div>

        {hab.descripcionWeb && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{hab.descripcionWeb}</p>
        )}

        {hab.amenidades && (
          <div className="flex flex-wrap gap-1 mb-4">
            {hab.amenidades.split(',').map(a => (
              <span key={a} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {a.trim()}
              </span>
            ))}
          </div>
        )}

        <Link
          to={`/habitaciones/${hab.id}`}
          className={`block text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            hab.estadoPublico === 'disponible'
              ? 'bg-gray-900 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-400 cursor-default pointer-events-none'
          }`}
        >
          {hab.estadoPublico === 'disponible' ? 'Ver y reservar' : 'No disponible'}
        </Link>
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuestras habitaciones</h1>
      <p className="text-gray-500 mb-8">Elige la habitación que mejor se adapte a tu estadía</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="bg-gray-100 aspect-video" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : habitaciones.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No hay habitaciones disponibles en este momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habitaciones.map(hab => <HabitacionCard key={hab.id} hab={hab} />)}
        </div>
      )}
    </div>
  )
}
