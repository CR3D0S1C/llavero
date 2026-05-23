import { useState } from 'react'
import { operarHabitacion } from '../services/api'

const CLAVE_OPS   = '1331'
const CLAVE_DESHAB = '1221'

export default function ModalLiberar({ habitacion, onExito, onCancelar }) {
  const [clave, setClave]       = useState('')
  const [claveOk, setClaveOk]   = useState(false)
  const [claveUsada, setClaveUsada] = useState(null) // 'ops' | 'deshab'
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const validarClave = () => {
    if (clave === CLAVE_OPS) {
      setClaveOk(true); setClaveUsada('ops'); setError('')
    } else if (clave === CLAVE_DESHAB) {
      setClaveOk(true); setClaveUsada('deshab'); setError('')
    } else {
      setError('Clave incorrecta'); setClave('')
    }
  }

  const operar = async (estado) => {
    setLoading(true)
    try {
      await operarHabitacion(
        habitacion.id,
        estado,
        claveUsada === 'deshab' ? CLAVE_DESHAB : CLAVE_OPS
      )
      onExito()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cambiar estado')
    } finally {
      setLoading(false)
    }
  }

  const estado = habitacion.estado
  const desdeAseo = estado === 'aseo'
  const puedeOperar = estado === 'ocupado' || estado === 'aseo'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Gestionar Habitación</h2>
          <p className="text-muted text-sm mt-1">
            {habitacion.numero} — {habitacion.tipoLabel}
          </p>
        </div>

        <div className="p-6">
          {!claveOk ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-2 block">Clave de operación</label>
                <input
                  className="input text-center text-2xl tracking-widest"
                  type="password"
                  maxLength={4}
                  placeholder="****"
                  value={clave}
                  onChange={e => { setClave(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && validarClave()}
                  autoFocus
                />
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                <div className="mt-3 text-center text-xs text-gray-600 space-y-0.5">
                  <p>1331 — liberar / enviar a aseo</p>
                  <p>1221 — deshabilitar habitación</p>
                </div>
              </div>
              <button onClick={validarClave} className="btn-primary w-full">
                Confirmar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Clave 1331: liberar / aseo */}
              {claveUsada === 'ops' && puedeOperar && (
                <>
                  <p className="text-sm text-muted mb-1">
                    {desdeAseo ? 'Habitación en aseo. ¿Qué hacemos?' : '¿Qué hacemos con la habitación?'}
                  </p>

                  <button
                    onClick={() => operar('libre')}
                    disabled={loading}
                    className="w-full p-4 border-2 border-border hover:border-green-500 rounded-xl text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <div className="font-semibold">Liberar</div>
                        <div className="text-sm text-muted">Pasa a Libre — lista para vender</div>
                      </div>
                    </div>
                  </button>

                  {!desdeAseo && (
                    <button
                      onClick={() => operar('aseo')}
                      disabled={loading}
                      className="w-full p-4 border-2 border-border hover:border-orange-500 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🧹</span>
                        <div>
                          <div className="font-semibold">Enviar a Aseo</div>
                          <div className="text-sm text-muted">No disponible hasta que esté lista</div>
                        </div>
                      </div>
                    </button>
                  )}
                </>
              )}

              {claveUsada === 'ops' && !puedeOperar && (
                <p className="text-yellow-500 text-sm text-center py-4">
                  La clave 1331 solo opera habitaciones ocupadas o en aseo.
                </p>
              )}

              {/* Clave 1221: deshabilitar */}
              {claveUsada === 'deshab' && (
                <>
                  <p className="text-sm text-muted mb-1">La habitación dejará de estar disponible.</p>
                  <button
                    onClick={() => operar('deshabilitada')}
                    disabled={loading}
                    className="w-full p-4 border-2 border-border hover:border-red-500 rounded-xl text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚫</span>
                      <div>
                        <div className="font-semibold">Deshabilitar</div>
                        <div className="text-sm text-muted">Solo el jefe puede habilitarla de nuevo</div>
                      </div>
                    </div>
                  </button>
                </>
              )}

              {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end">
          <button onClick={onCancelar} className="btn-ghost" disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
