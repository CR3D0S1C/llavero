import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import ModalConfirmar from '../components/ModalConfirmar'
import { getAseoPanel, crearAsignacionAseo, actualizarAsignacionAseo, eliminarAsignacionAseo } from '../services/api'
import { toast } from '../utils/toast'
import { nombreClave } from '../utils/nombre'

const TIPO_LABEL = { completo: 'Aseo completo', general: 'Aseo general' }
const TIPO_COLOR = { completo: 'text-orange-400', general: 'text-blue-400' }
const ESTADO_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado' }
const ESTADO_COLOR = {
  pendiente:  'bg-yellow-500/15 text-yellow-400',
  en_proceso: 'bg-blue-500/15 text-blue-400',
  completado: 'bg-green-500/15 text-green-400',
}
const ESTADO_HAB = {
  aseo:         { label: 'Aseo',      cls: 'bg-orange-500/15 text-orange-400' },
  ocupado:      { label: 'Ocupada',   cls: 'bg-red-500/15 text-red-400' },
  libre:        { label: 'Libre',     cls: 'bg-green-500/15 text-green-400' },
  reservado:    { label: 'Reservada', cls: 'bg-blue-500/15 text-blue-400' },
  mantenimiento:{ label: 'Mantención',cls: 'bg-gray-500/15 text-gray-400' },
}

export default function PanelAseo() {
  const [fecha, setFecha]         = useState(new Date().toISOString().split('T')[0])
  const [panel, setPanel]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState('aseo') // 'aseo' | 'ocupado' | 'todas'
  const [modal, setModal]         = useState(null)
  const [confirmar, setConfirmar] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getAseoPanel(fecha)
      setPanel(r.data)
    } catch {
      toast.error('Error al cargar el panel')
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => { cargar() }, [cargar])

  const habitaciones = panel?.habitaciones || []
  const personal     = panel?.personal     || []

  const habsFiltradas = habitaciones.filter(h => {
    if (filtro === 'aseo')    return h.estado === 'aseo'
    if (filtro === 'ocupado') return h.estado === 'ocupado'
    return true
  })

  const handleEliminar = (asigId) => {
    setConfirmar({
      asigId,
      titulo: '¿Quitar la asignación?',
      mensaje: 'La habitación quedará sin personal asignado para hoy.',
    })
  }

  const confirmarEliminar = async (asigId) => {
    try {
      await eliminarAsignacionAseo(asigId)
      toast.success('Asignación eliminada')
      cargar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Panel de Aseo</h1>
            <p className="text-muted text-sm mt-0.5">Asignación de habitaciones al personal</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="input text-sm"
            />
            <button onClick={cargar} className="btn-ghost text-sm">↺ Actualizar</button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted text-sm">Cargando...</p>
        ) : (
          <>
            {/* Progreso por mucama */}
            {personal.length === 0 ? (
              <div className="card mb-6 text-center py-6">
                <p className="text-muted text-sm">No hay personal disponible.</p>
                <p className="text-muted text-xs mt-1">Los usuarios con rol <strong>Aseo, Cajero o Jefe</strong> pueden recibir asignaciones.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {personal.map(m => (
                  <div key={m.id} className="card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400 shrink-0">
                        {m.nombre[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate">{nombreClave(m.nombre)}</span>
                    </div>
                    {/* Barra de progreso */}
                    {m.total > 0 && (
                      <>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${Math.round((m.completadas / m.total) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted">
                          <span>{m.completadas}/{m.total} listas</span>
                          <span>{m.enProceso > 0 ? `${m.enProceso} en proceso` : ''}</span>
                        </div>
                      </>
                    )}
                    {m.total === 0 && <p className="text-xs text-muted">Sin asignaciones</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Filtro */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'aseo',    label: 'En aseo' },
                { id: 'ocupado', label: 'Ocupadas' },
                { id: 'todas',   label: 'Todas' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filtro === f.id
                      ? 'bg-accent text-white'
                      : 'text-muted hover:text-white border border-border'
                  }`}
                >
                  {f.label}
                  {f.id !== 'todas' && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({habitaciones.filter(h => h.estado === f.id).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Grid de habitaciones */}
            {habsFiltradas.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-muted">
                  {filtro === 'aseo' ? 'No hay habitaciones en aseo' :
                   filtro === 'ocupado' ? 'No hay habitaciones ocupadas' :
                   'No hay habitaciones relevantes para hoy'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {habsFiltradas.map(hab => {
                  const estHab = ESTADO_HAB[hab.estado] || { label: hab.estado, cls: 'bg-gray-500/15 text-gray-400' }
                  const asig   = hab.asignacion
                  return (
                    <div key={hab.id} className="card flex gap-4 items-start">
                      {/* Dot de color */}
                      <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: hab.color }} />

                      <div className="flex-1 min-w-0">
                        {/* Encabezado */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold">Hab. {hab.numero}</span>
                          <span className="text-xs text-muted">{hab.tipoLabel}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estHab.cls}`}>
                            {estHab.label}
                          </span>
                        </div>

                        {/* Estado de asignación */}
                        {asig ? (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-green-400">{nombreClave(asig.mucamaNombre)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${TIPO_COLOR[asig.tipoAseo]}`}>
                                {TIPO_LABEL[asig.tipoAseo]}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[asig.estado]}`}>
                                {ESTADO_LABEL[asig.estado]}
                              </span>
                            </div>
                            {asig.notas && <p className="text-xs text-muted italic">{asig.notas}</p>}
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => setModal({ hab, editar: asig })}
                                className="text-xs btn-ghost px-2 py-1"
                              >
                                Reasignar
                              </button>
                              <button
                                onClick={() => handleEliminar(asig.id)}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setModal({ hab })}
                            disabled={personal.length === 0}
                            className="mt-2 text-sm btn-primary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            + Asignar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {confirmar && (
        <ModalConfirmar
          titulo={confirmar.titulo}
          mensaje={confirmar.mensaje}
          textoBtn="Quitar"
          onConfirmar={() => { const id = confirmar.asigId; setConfirmar(null); confirmarEliminar(id) }}
          onCancelar={() => setConfirmar(null)}
        />
      )}

      {modal && (
        <ModalAsignar
          hab={modal.hab}
          editar={modal.editar}
          personal={personal}
          fecha={fecha}
          onClose={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}

function ModalAsignar({ hab, editar, personal, fecha, onClose, onGuardado }) {
  const [form, setForm] = useState({
    mucamaId: editar?.mucamaId || (personal[0]?.id || ''),
    tipoAseo: editar?.tipoAseo || (hab.estado === 'aseo' ? 'completo' : 'general'),
    notas:    editar?.notas    || '',
  })
  const [guardando, setGuardando] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.mucamaId) return
    setGuardando(true)
    try {
      if (editar) {
        await actualizarAsignacionAseo(editar.id, { mucamaId: form.mucamaId, tipoAseo: form.tipoAseo, notas: form.notas })
        toast.success('Asignación actualizada')
      } else {
        await crearAsignacionAseo({ habitacionId: hab.id, mucamaId: form.mucamaId, tipoAseo: form.tipoAseo, notas: form.notas, fecha })
        toast.success(`Hab. ${hab.numero} asignada`)
      }
      onGuardado()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {editar ? 'Reasignar' : 'Asignar aseo'} — Hab. {hab.numero}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Asignar a</label>
            <select className="input w-full" value={form.mucamaId} onChange={e => set('mucamaId', e.target.value)}>
              {personal.map(m => <option key={m.id} value={m.id}>{nombreClave(m.nombre)} ({m.rol})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Tipo de aseo</label>
            <select className="input w-full" value={form.tipoAseo} onChange={e => set('tipoAseo', e.target.value)}>
              <option value="completo">Aseo completo (sale huésped)</option>
              <option value="general">Aseo general (huésped continúa)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Notas <span className="text-xs text-muted">(opcional)</span></label>
            <input
              className="input w-full"
              placeholder="Ej: revisar baño, sábanas extra..."
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
            <button type="submit" className="btn-primary text-sm" disabled={guardando || !form.mucamaId}>
              {guardando ? 'Guardando...' : editar ? 'Actualizar' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
