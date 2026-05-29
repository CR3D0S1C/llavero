export default function ModalConfirmar({ titulo, mensaje, textoBtn = 'Confirmar', variante = 'danger', onConfirmar, onCancelar }) {
  const btnCls = variante === 'danger'
    ? 'bg-red-600 hover:bg-red-500 text-white'
    : 'bg-accent hover:bg-accent-hover text-white'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onCancelar}
    >
      <div
        className="card w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-2">{titulo}</h2>
        {mensaje && <p className="text-sm text-muted mb-5 leading-relaxed">{mensaje}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancelar} className="btn-ghost text-sm px-4">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnCls}`}
          >
            {textoBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
