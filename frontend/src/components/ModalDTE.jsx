import { useState } from 'react'
import { useModalClose } from '../hooks/useModalClose'

function validarRut(rut) {
  if (!rut) return false
  const cleaned = rut.replace(/[.\-]/g, '').toUpperCase()
  if (cleaned.length < 2) return false
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  let suma = 0
  let multiplo = 2
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const dvEsperado = 11 - (suma % 11)
  const dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado)
  return dvCalc === dv
}

export default function ModalDTE({ total, onConfirmar, onCancelar }) {
  const [tipo, setTipo] = useState(null)
  const [receptor, setReceptor] = useState({
    rut: '', razon: '', giro: '', direccion: '', comuna: '', ciudad: '', email: ''
  })
  const [rutError, setRutError] = useState(false)

  const handleRutBlur = () => {
    setRutError(receptor.rut.length > 0 && !validarRut(receptor.rut))
  }

  const confirmar = () => {
    if (!tipo) return
    if (tipo === 'factura') {
      if (!validarRut(receptor.rut)) { setRutError(true); return }
      if (!receptor.razon || !receptor.giro || !receptor.direccion) return
    }
    onConfirmar(tipo, tipo === 'factura' ? receptor : null)
  }

  useModalClose(onCancelar)

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div className="modal-panel w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Documento Tributario</h2>
          <p className="text-muted text-sm mt-1">Total a cobrar: <span className="text-green-400 font-bold">${total?.toLocaleString('es-CL')}</span></p>
        </div>

        <div className="p-6">
          {!tipo ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTipo('boleta')}
                className="p-6 border-2 border-border hover:border-blue-500 rounded-xl text-center transition-all group"
              >
                <div className="text-4xl mb-3">🧾</div>
                <div className="font-bold text-lg group-hover:text-blue-400">Boleta</div>
                <div className="text-muted text-sm mt-1">Sin datos del receptor</div>
              </button>
              <button
                onClick={() => setTipo('factura')}
                className="p-6 border-2 border-border hover:border-purple-500 rounded-xl text-center transition-all group"
              >
                <div className="text-4xl mb-3">📄</div>
                <div className="font-bold text-lg group-hover:text-purple-400">Factura</div>
                <div className="text-muted text-sm mt-1">Con datos de empresa</div>
              </button>
            </div>
          ) : tipo === 'factura' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setTipo(null)} className="text-muted hover:text-white text-sm">← Volver</button>
                <span className="font-semibold">Datos del Receptor</span>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">RUT *</label>
                <input
                  className={`input ${rutError ? 'border-red-500' : ''}`}
                  placeholder="76.123.456-7"
                  value={receptor.rut}
                  onChange={e => { setReceptor(p => ({ ...p, rut: e.target.value })); setRutError(false) }}
                  onBlur={handleRutBlur}
                />
                {rutError && <p className="text-red-400 text-xs mt-1">RUT inválido</p>}
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Razón Social *</label>
                <input className="input" placeholder="Empresa SpA" value={receptor.razon}
                  onChange={e => setReceptor(p => ({ ...p, razon: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Giro *</label>
                <input className="input" placeholder="Servicios empresariales" value={receptor.giro}
                  onChange={e => setReceptor(p => ({ ...p, giro: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Dirección *</label>
                <input className="input" placeholder="Av. Ejemplo 123" value={receptor.direccion}
                  onChange={e => setReceptor(p => ({ ...p, direccion: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Comuna</label>
                  <input className="input" placeholder="Providencia" value={receptor.comuna}
                    onChange={e => setReceptor(p => ({ ...p, comuna: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Ciudad</label>
                  <input className="input" placeholder="Santiago" value={receptor.ciudad}
                    onChange={e => setReceptor(p => ({ ...p, ciudad: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Email</label>
                <input className="input" type="email" placeholder="contacto@empresa.cl" value={receptor.email}
                  onChange={e => setReceptor(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🧾</div>
              <p className="text-lg font-semibold">Boleta electrónica</p>
              <p className="text-muted text-sm mt-1">Se registrará como pendiente de emisión manual en el SII</p>
            </div>
          )}
        </div>

        {tipo && (
          <div className="p-6 border-t border-border flex gap-3 justify-end">
            <button onClick={onCancelar} className="btn-ghost">Cancelar</button>
            <button onClick={confirmar} className="btn-primary">
              Confirmar {tipo === 'boleta' ? 'Boleta' : 'Factura'}
            </button>
          </div>
        )}

        {!tipo && (
          <div className="p-6 border-t border-border flex justify-end">
            <button onClick={onCancelar} className="btn-ghost">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
