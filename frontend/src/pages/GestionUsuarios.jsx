import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getUsuarios, crearUsuario, editarUsuario, desactivarUsuario } from '../services/api'
import { toast } from '../utils/toast'

const ROL_LABEL = { jefe: 'Jefe', cajero: 'Cajero' }
const ROL_COLOR = { jefe: 'text-accent', cajero: 'text-blue-400' }

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { modo: 'crear'|'editar', usuario?: {} }

  const cargar = () => {
    setLoading(true)
    getUsuarios()
      .then(r => setUsuarios(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const handleDesactivar = async (u) => {
    if (!confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`)) return
    try {
      await desactivarUsuario(u.id)
      toast.success(`${u.nombre} desactivado`)
      cargar()
    } catch {
      toast.error('Error al desactivar usuario')
    }
  }

  const activos   = usuarios.filter(u => u.activo)
  const inactivos = usuarios.filter(u => !u.activo)

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Usuarios</h1>
            <p className="text-muted text-sm mt-0.5">Gestión de cajeros y administradores</p>
          </div>
          <button
            onClick={() => setModal({ modo: 'crear' })}
            className="btn-primary text-sm"
          >
            + Nuevo usuario
          </button>
        </div>

        {loading ? (
          <p className="text-muted text-sm">Cargando...</p>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {activos.map(u => (
                <UsuarioRow
                  key={u.id}
                  u={u}
                  onEditar={() => setModal({ modo: 'editar', usuario: u })}
                  onDesactivar={() => handleDesactivar(u)}
                />
              ))}
              {activos.length === 0 && (
                <p className="text-muted text-sm">No hay usuarios activos</p>
              )}
            </div>

            {inactivos.length > 0 && (
              <>
                <h2 className="text-xs uppercase tracking-wider text-muted mb-2">Desactivados</h2>
                <div className="space-y-2 opacity-50">
                  {inactivos.map(u => (
                    <div key={u.id} className="card flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
                        {u.nombre[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-400 line-through">{u.nombre}</div>
                        <div className="text-xs text-muted">{ROL_LABEL[u.rol]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {modal && (
        <ModalUsuario
          modo={modal.modo}
          usuario={modal.usuario}
          onClose={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}

function UsuarioRow({ u, onEditar, onDesactivar }) {
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
        {u.nombre[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{u.nombre}</div>
        <div className={`text-xs font-medium ${ROL_COLOR[u.rol]}`}>{ROL_LABEL[u.rol]}</div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onEditar} className="btn-ghost text-xs px-3 py-1.5">
          Editar
        </button>
        <button
          onClick={onDesactivar}
          className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Desactivar
        </button>
      </div>
    </div>
  )
}

function ModalUsuario({ modo, usuario, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    rol:    usuario?.rol    || 'cajero',
    pin:    '',
    pinConfirm: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (modo === 'crear' && !form.pin) return setError('El PIN es obligatorio')
    if (form.pin && form.pin !== form.pinConfirm) return setError('Los PINes no coinciden')
    if (form.pin && (form.pin.length < 4 || form.pin.length > 8))
      return setError('El PIN debe tener entre 4 y 8 dígitos')

    setGuardando(true)
    try {
      const payload = { nombre: form.nombre.trim(), rol: form.rol }
      if (form.pin) payload.pin = form.pin

      if (modo === 'crear') {
        await crearUsuario(payload)
        toast.success(`Usuario ${form.nombre} creado`)
      } else {
        await editarUsuario(usuario.id, payload)
        toast.success('Usuario actualizado')
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {modo === 'crear' ? 'Nuevo usuario' : `Editar — ${usuario.nombre}`}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Nombre completo</label>
            <input
              className="input w-full"
              placeholder="Ej: María González"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Rol</label>
            <select
              className="input w-full"
              value={form.rol}
              onChange={e => set('rol', e.target.value)}
            >
              <option value="cajero">Cajero</option>
              <option value="jefe">Jefe (acceso total)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              PIN {modo === 'editar' && <span className="text-xs">(dejar vacío para no cambiar)</span>}
            </label>
            <input
              className="input w-full"
              type="password"
              inputMode="numeric"
              placeholder="4–8 dígitos"
              value={form.pin}
              onChange={e => set('pin', e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {form.pin && (
            <div>
              <label className="block text-sm text-muted mb-1">Confirmar PIN</label>
              <input
                className="input w-full"
                type="password"
                inputMode="numeric"
                placeholder="Repetir PIN"
                value={form.pinConfirm}
                onChange={e => set('pinConfirm', e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">
              Cancelar
            </button>
            <button type="submit" className="btn-primary text-sm" disabled={guardando}>
              {guardando ? 'Guardando...' : modo === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
