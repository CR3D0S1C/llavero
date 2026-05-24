import { useModalClose } from '../hooks/useModalClose'

const fmt = (n) => Number(n || 0).toLocaleString('es-CL')

const DENOMS = [
  { key: 'b20000', valor: 20000, label: '$20.000' },
  { key: 'b10000', valor: 10000, label: '$10.000' },
  { key: 'b5000',  valor: 5000,  label: '$5.000' },
  { key: 'b2000',  valor: 2000,  label: '$2.000' },
  { key: 'b1000',  valor: 1000,  label: '$1.000' },
  { key: 'm500',   valor: 500,   label: '$500' },
  { key: 'm100',   valor: 100,   label: '$100' },
  { key: 'm50',    valor: 50,    label: '$50' },
  { key: 'm10',    valor: 10,    label: '$10' },
]

export default function ComprobanteCierre({ resumen, arqueo, emailEnviado, onCerrar, onFinalizar }) {
  useModalClose(onCerrar, false) // No cerrar accidentalmente con ESC
  const imprimir = () => window.print()

  return (
    <div className="modal-backdrop no-print">
      <div className="modal-panel w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-5 border-b border-border no-print">
          <h2 className="text-lg font-bold">✅ Turno cerrado</h2>
          <p className="text-muted text-xs mt-1">
            Arqueo guardado y firmado.{' '}
            {emailEnviado && <span className="text-green-400">Email enviado al jefe.</span>}
          </p>
        </div>

        <div className="p-4 bg-[#0d0d0d] flex justify-center overflow-y-auto no-print">
          <div className="bg-white shadow-2xl rounded-sm" style={{ width: '58mm' }}>
            <TicketCierre resumen={resumen} arqueo={arqueo} />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2 justify-end no-print">
          <button onClick={onFinalizar} className="btn-ghost text-sm">
            Salir sin imprimir
          </button>
          <button onClick={imprimir} className="btn-primary text-sm">
            🖨  Imprimir 58mm
          </button>
        </div>
      </div>

      {/* Área que efectivamente se imprime */}
      <div className="print-only">
        <TicketCierre resumen={resumen} arqueo={arqueo} />
      </div>
    </div>
  )
}

function TicketCierre({ resumen, arqueo }) {
  const fechaCierre = new Date().toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  const fechaInicio = resumen?.inicio
    ? new Date(resumen.inicio).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'
  const horas = resumen ? Math.floor(resumen.duracionMinutos / 60) : 0
  const mins  = resumen ? resumen.duracionMinutos % 60 : 0
  const totalConteo = DENOMS.reduce((s, d) => s + d.valor * (arqueo[d.key] || 0), 0)
  const diff = arqueo.diferencia ?? 0

  return (
    <div className="thermal">
      <div className="center bold lg">LLAVERO</div>
      <div className="sep-double" />
      <div className="center bold">CIERRE DE TURNO</div>
      <div className="center sm">Arqueo de caja</div>
      <div className="sep" />

      <div className="row sm"><span>Cajero:</span><span className="bold">{resumen.cajeroNombre}</span></div>
      <div className="row sm"><span>Inicio:</span><span>{fechaInicio}</span></div>
      <div className="row sm"><span>Cierre:</span><span>{fechaCierre}</span></div>
      <div className="row sm"><span>Duración:</span><span>{horas}h {mins}m</span></div>

      <div className="sep" />
      <div className="label-row">Resumen</div>
      <div className="row sm"><span>Ventas:</span><span>{resumen.cantidadVentas}</span></div>
      <div className="row sm"><span>Boletas:</span><span>{resumen.cantidadBoletas}</span></div>
      <div className="row sm"><span>Facturas:</span><span>{resumen.cantidadFacturas}</span></div>
      <div className="row sm"><span>Mov. hab:</span><span>{resumen.movimientosHabitaciones}</span></div>
      <div className="row sm"><span>Limpiezas:</span><span>{resumen.limpiezasRealizadas}</span></div>

      <div className="sep" />
      <div className="label-row">Pagos declarados</div>
      <div className="row sm"><span>Efectivo</span><span>${fmt(arqueo.efectivo)}</span></div>
      <div className="row sm"><span>Transferencia</span><span>${fmt(arqueo.transferencia)}</span></div>
      <div className="row sm"><span>T. Débito</span><span>${fmt(arqueo.tarjetaDebito)}</span></div>
      <div className="row sm"><span>T. Crédito</span><span>${fmt(arqueo.tarjetaCredito)}</span></div>
      <div className="row sm"><span>Otro</span><span>${fmt(arqueo.otro)}</span></div>

      <div className="sep" />
      <div className="label-row">Conteo efectivo</div>
      {DENOMS.filter(d => (arqueo[d.key] || 0) > 0).map(d => (
        <div key={d.key} className="row sm">
          <span>{d.label} × {arqueo[d.key]}</span>
          <span>${fmt(d.valor * arqueo[d.key])}</span>
        </div>
      ))}
      <div className="row sm bold">
        <span>Total contado</span>
        <span>${fmt(totalConteo)}</span>
      </div>

      <div className="sep-double" />
      <div className="row sm"><span>Total sistema</span><span>${fmt(resumen.totalSistema)}</span></div>
      <div className="row sm"><span>Total declarado</span><span>${fmt(arqueo.totalDeclarado)}</span></div>
      <div className="row bold lg">
        <span>DIFERENCIA</span>
        <span>{diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))}</span>
      </div>

      {arqueo.observacion && (
        <>
          <div className="sep" />
          <div className="label-row">Observación</div>
          <div className="sm">{arqueo.observacion}</div>
        </>
      )}

      <div className="sep-double" />
      <div className="center sm">Firmado con PIN del cajero</div>
      <div className="center sm">_____________________</div>
      <div className="center sm">{resumen.cajeroNombre}</div>
    </div>
  )
}
