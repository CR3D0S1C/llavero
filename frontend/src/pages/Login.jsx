import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'

const USUARIOS = ['Carlos Mendoza', 'Ana Torres', 'Luis Pérez']

export default function Login() {
  const [nombre, setNombre] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: loginCtx, sesion } = useSesion()
  const navigate = useNavigate()

  useEffect(() => {
    if (sesion) navigate('/dashboard', { replace: true })
  }, [sesion, navigate])

  // Soporte de teclado físico (números + backspace + Enter)
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') setPin(p => p.length < 4 ? p + e.key : p)
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
      else if (e.key === 'Enter' && nombre && pin.length === 4) ingresar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, pin])

  const presionar = (digito) => {
    if (pin.length < 4) setPin(p => p + digito)
  }

  const borrar = () => setPin(p => p.slice(0, -1))

  const ingresar = async () => {
    if (!nombre || pin.length !== 4) {
      setError('Selecciona usuario e ingresa PIN de 4 dígitos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await login(nombre, pin)
      loginCtx(res.data)
      toast.success(`Bienvenido, ${res.data.nombre}`)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.error || 'PIN incorrecto')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const teclas = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🔑</div>
          <h1 className="text-3xl font-bold text-accent">Llavero</h1>
          <p className="text-muted text-sm mt-1">Sistema de Hospedaje</p>
        </div>

        <div className="card space-y-6">
          <div>
            <label className="text-xs text-muted mb-2 block">USUARIO</label>
            <div className="grid grid-cols-1 gap-2">
              {USUARIOS.map(u => (
                <button
                  key={u}
                  onClick={() => { setNombre(u); setError('') }}
                  className={`py-2.5 px-4 rounded-lg border transition-all text-left text-sm font-medium ${
                    nombre === u
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-2 block">PIN</label>
            <div className="flex justify-center gap-3 mb-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  pin.length > i ? 'border-accent bg-accent/20 text-accent' : 'border-border'
                }`}>
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {teclas.map((t, i) => (
                <button
                  key={i}
                  onClick={() => t === '⌫' ? borrar() : t !== '' ? presionar(t) : null}
                  disabled={t === ''}
                  className={`h-14 rounded-xl text-xl font-bold transition-all select-none ${
                    t === '' ? 'opacity-0 pointer-events-none' :
                    t === '⌫' ? 'border border-border hover:border-red-500 hover:text-red-400 text-muted' :
                    'border border-border hover:border-accent hover:bg-accent/10 text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={ingresar}
            disabled={loading || !nombre || pin.length !== 4}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}
