import { createPortal } from 'react-dom'
import { useModalClose } from '../hooks/useModalClose'

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')

const TIPO_DTE_LABEL = {
  boleta:  'Boleta SII',
  factura: 'Factura SII',
}

export default function ComprobanteVenta({ venta, onCerrar, onContinuar }) {
  useModalClose(onCerrar)
  const imprimir = () => setTimeout(() => window.print(), 100)

  const fechaCorta = venta.fecha ? venta.fecha : new Date().toLocaleDateString('es-CL')
  const horaCorta  = venta.hora
    ? String(venta.hora).slice(0, 5)
    : new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Modal en pantalla — se oculta al imprimir */}
      <div className="modal-backdrop" onClick={onCerrar}>
        <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Comprobante listo</h2>
              <p className="text-muted text-xs mt-0.5">Vista previa 58mm</p>
            </div>
            <button onClick={onCerrar} className="text-muted hover:text-white text-lg">✕</button>
          </div>

          <div className="p-4 bg-[#0d0d0d] flex justify-center max-h-[60vh] overflow-y-auto">
            <div className="bg-white shadow-2xl rounded-sm" style={{ width: '58mm' }}>
              <Ticket venta={venta} fecha={fechaCorta} hora={horaCorta} />
            </div>
          </div>

          <div className="p-4 border-t border-border flex gap-2 justify-end">
            <button onClick={onContinuar || onCerrar} className="btn-ghost text-sm">
              Saltar
            </button>
            <button onClick={imprimir} className="btn-primary text-sm">
              🖨  Imprimir 58mm
            </button>
          </div>
        </div>
      </div>

      {/* Portal: renderiza el ticket como hijo directo de <body>.
          Solo es visible cuando se imprime (CSS @media print). */}
      {createPortal(
        <div className="print-only" aria-hidden="true">
          <Ticket venta={venta} fecha={fechaCorta} hora={horaCorta} />
        </div>,
        document.body
      )}
    </>
  )
}

function Ticket({ venta, fecha, hora }) {
  const esMinimarket = venta.tipoVenta === 'minimarket'
  const sinHabitacion = !venta.habitacionNumero
  const dtePendiente = TIPO_DTE_LABEL[venta.tipoDte] || 'Boleta SII'

  return (
    <div className="thermal">
      <div className="center bold lg">LLAVERO</div>
      <div className="center sm">{esMinimarket ? 'Minimarket' : 'Hostal'}</div>
      <div className="sep-double" />

      <div className="center bold">NOTA DE VENTA</div>
      <div className="center sm">Documento no tributario</div>
      <div className="sep" />

      <div className="row sm"><span>Fecha:</span><span>{fecha} {hora}</span></div>
      {venta.cajero && (
        <div className="row sm"><span>Cajero:</span><span>{venta.cajero}</span></div>
      )}
      {venta.id && (
        <div className="row sm"><span>Ref:</span><span style={{ fontSize: '8pt' }}>{String(venta.id).slice(0, 8)}</span></div>
      )}
      {!sinHabitacion && (
        <>
          <div className="row sm"><span>Habitación:</span><span className="bold">{venta.habitacionNumero}</span></div>
          {venta.duracion && (
            <div className="row sm"><span>Tarifa:</span><span>{venta.duracion}</span></div>
          )}
          {venta.salidaEstimada && (
            <div className="row sm">
              <span>Sale:</span>
              <span>{new Date(venta.salidaEstimada).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </>
      )}

      <div className="sep" />
      <div className="label-row">Detalle</div>
      {(venta.items || []).map((it, i) => (
        <div key={i} className="item">
          <div>{it.descripcion}</div>
          <div className="row sm">
            <span>{it.cantidad} × ${fmt(it.precioUnitario)}</span>
            <span>${fmt((it.precioUnitario || 0) * (it.cantidad || 1))}</span>
          </div>
        </div>
      ))}
      {(!venta.items || venta.items.length === 0) && (
        <div className="sm" style={{ fontStyle: 'italic' }}>Sin ítems registrados</div>
      )}

      <div className="sep-double" />
      <div className="row bold lg">
        <span>TOTAL</span>
        <span>${fmt(venta.total)}</span>
      </div>

      <div className="sep" />
      <div className="sm center">
        Solicite su {dtePendiente.toLowerCase()}
      </div>

      {venta.tipoDte === 'factura' && venta.receptorRut && (
        <>
          <div className="sep" />
          <div className="label-row">Receptor (factura)</div>
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
