import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Tu lugar de descanso
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">
            Habitaciones cómodas, ubicación céntrica y atención personalizada.
            Reserva directamente en línea.
          </p>
          <Link
            to="/habitaciones"
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
          >
            Ver habitaciones
          </Link>
        </div>
      </section>

      {/* Ventajas */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          ¿Por qué elegirnos?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🛏️', title: 'Habitaciones cómodas', desc: 'Distintas opciones para una persona, pareja o familia. Con baño privado o compartido.' },
            { icon: '📅', title: 'Reserva online 24/7', desc: 'Elige tus fechas, confirma tu reserva y recibe confirmación al instante.' },
            { icon: '📍', title: 'Ubicación céntrica', desc: 'A pasos del transporte público, restaurantes y comercio.' },
          ].map(item => (
            <div key={item.title} className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Listo para reservar?
          </h2>
          <p className="text-gray-500 mb-6">
            Crea tu cuenta en 30 segundos y reserva tu estadía.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/habitaciones"
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Ver disponibilidad
            </Link>
            <Link
              to="/registro"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
