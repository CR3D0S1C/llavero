import { useModalClose } from '../hooks/useModalClose'

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')

export default function ComprobanteVenta({ venta, onCerrar, onContinuar }) {
  useModalClose(onCerrar)
  const imprimir = () => window.print()

  const fechaCorta = venta.fecha ? venta.fecha : new Date().toLocaleDateString('es-CL')
  const horaCorta  = venta.hora ? String(venta.hora).slice(0, 5) : new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="modal-backdrop no-print" onClick={onCerrar}>
      <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between no-print">
          <div>
            <h2 className="text-lg font-bold">Comprobante listo</h2>
            <p className="text-muted text-xs mt-0.5">Vista previa del ticket 58mm</p>
          </div>
          <button onClick={onCerrar} className="text-muted hover:text-white text-lg">✕</button>
        </div>

        {/* Preview con borde + área imprimible */}
        <div className="p-4 bg-[#0d0d0d] flex justify-center no-print">
          <div className="bg-white shadow-2xl rounded-sm" style={{ width: '58mm' }}>
            <Ticket venta={venta} fecha={fechaCorta} hora={horaCorta} />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2 justify-end no-print">
          <button onClick={onContinuar || onCerrar} className="btn-ghost text-sm">
            Saltar
          </button>
          <button onClick={imprimir} className="btn-primary text-sm">
            🖨  Imprimir 58mm
          </button>
        </div>
      </div>

      {/* Área que efectivamente se imprime */}
      <div className="print-only">
        <Ticket venta={venta} fecha={fechaCorta} hora={horaCorta} />
      </div>
    </div>
  )
}

function Ticket({ venta, fecha, hora }) {
  const esMinimarket = venta.tipoVenta === 'minimarket'
  const tipoDoc = venta.tipoDte === 'factura' ? 'FACTURA' : 'BOLETA'
  return (
    <div className="thermal">
      <div className="center bold lg">LLAVERO</div>
      <div className="center sm">{esMinimarket ? 'Minimarket' : 'Hostal'}</div>
      <div className="sep-double" />

      <div className="center bold">{tipoDoc}</div>
      <div className="center sm">ELECTRÓNICA</div>
      <div className="sep" />

      <div className="row sm"><span>Fecha:</span><span>{fecha} {hora}</span></div>
      {venta.cajero && (
        <div className="row sm"><span>Cajero:</span><span>{venta.cajero}</span></div>
      )}
      {!esMinimarket && venta.habitacionNumero && (
        <div className="row sm"><span>Habitación:</span><span className="bold">{venta.habitacionNumero}</span></div>
      )}
      {!esMinimarket && venta.duracion && (
        <div className="row sm"><span>Tarifa:</span><span>{venta.duracion}</span></div>
      )}
      {!esMinimarket && venta.salidaEstimada && (
        <div className="row sm"><span>Sale:</span><span>{new Date(venta.salidaEstimada).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
      )}

      <div className="sep" />
      <div className="label-row">Detalle</div>
      {venta.items?.map((it, i) => (
        <div key={i} className="item">
          <div>{it.descripcion}</div>
          <div className="row sm">
            <span>{it.cantidad} × ${fmt(it.precioUnitario)}</span>
            <span>${fmt(it.precioUnitario * it.cantidad)}</span>
          </div>
        </div>
      ))}

      <div className="sep-double" />
      <div className="row bold lg">
        <span>TOTAL</span>
        <span>${fmt(venta.total)}</span>
      </div>

      {venta.tipoDte === 'factura' && venta.receptorRut && (
        <>
          <div className="sep" />
          <div className="label-row">Receptor</div>
          <div className="sm">RUT: {venta.receptorRut}</div>
          <div className="sm">{venta.receptorRazon}</div>
          {venta.receptorGiro && <div className="sm">Giro: {venta.receptorGiro}</div>}
        </>
      )}

      <div className="sep" />
      <div className="center sm">¡Gracias por su preferencia!</div>
      <div className="center sm">Llavero · {fecha}</div>
    </div>
  )
}
