import { useState } from 'react'
import { operarHabitacion } from '../services/api'

export default function ModalLiberar({ habitacion, onExito, onCancelar }) {
  const [clave, setClave] = useState('')
  const [claveOk, setClaveOk] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validarClave = () => {
    if (clave === '1331') {
      setClaveOk(true)
      setError('')
    } else {
      setError('Clave incorrecta')
      setClave('')
    }
  }

  const operar = async (estado) => {
    setLoading(true)
    try {
      await operarHabitacion(habitacion.id, estado, '1331')
      onExito()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cambiar estado')
    } finally {
      setLoading(false)
    }
  }

  const desdeAseo = habitacion.estado === 'aseo'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">
            {desdeAseo ? 'Habitación en Aseo' : 'Liberar Habitación'}
          </h2>
          <p className="text-muted text-sm mt-1">
            {habitacion.numero} — {habitacion.tipoLabel}
          </p>
        </div>

        <div className="p-6">
          {!claveOk ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-2 block">Clave de operaciones</label>
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
              </div>
              <button onClick={validarClave} className="btn-primary w-full">
                Confirmar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted mb-4">
                {desdeAseo
                  ? 'La habitación está en aseo. ¿Qué hacemos?'
                  : 'Clave correcta. ¿Qué hacemos con la habitación?'}
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
                      <div className="font-semibold">Aseo</div>
                      <div className="text-sm text-muted">No se puede vender hasta que esté lista</div>
                    </div>
                  </div>
                </button>
              )}
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
