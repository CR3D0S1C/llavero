import { useModalClose } from '../hooks/useModalClose'

export default function ModalEarlyCheckin({ habitacion, onConfirmar, onCancelar }) {
  useModalClose(onCancelar)

  const opciones = [
    {
      value: 'sin_costo',
      titulo: 'Early check-in sin costo',
      desc: 'El huésped llega temprano sin cobro extra',
      salida: 'Sale mañana a las 12:00',
      color: 'hover:border-green-500 group-hover:text-green-400',
      icon: '🌙',
    },
    {
      value: 'con_costo',
      titulo: 'Early check-in con costo',
      desc: 'Se agrega $8.000 por llegada anticipada',
      salida: 'Sale mañana a las 12:00',
      color: 'hover:border-yellow-500 group-hover:text-yellow-400',
      icon: '💰',
    },
    {
      value: 'hoy',
      titulo: 'Salen a las 12:00 de hoy',
      desc: 'No es early check-in, salen al mediodía de hoy',
      salida: 'Sale hoy a las 12:00',
      color: 'hover:border-blue-500 group-hover:text-blue-400',
      icon: '☀️',
    },
  ]

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div className="modal-panel w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Tarifa Noche — Llegada temprana</h2>
          <p className="text-muted text-sm mt-1">
            Son las {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}.
            ¿Cómo se registra esta venta?
          </p>
        </div>

        <div className="p-6 space-y-3">
          {opciones.map(op => (
            <button
              key={op.value}
              onClick={() => onConfirmar(op.value)}
              className={`group w-full p-4 border-2 border-border rounded-xl text-left transition-all ${op.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{op.icon}</span>
                <div>
                  <div className="font-semibold">{op.titulo}</div>
                  <div className="text-sm text-muted mt-0.5">{op.desc}</div>
                  <div className="text-xs text-gray-500 mt-1">📅 {op.salida}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-border flex justify-end">
          <button onClick={onCancelar} className="btn-ghost">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
