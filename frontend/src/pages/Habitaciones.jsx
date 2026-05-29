import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import ModalLiberar from '../components/ModalLiberar'
import ModalConfirmar from '../components/ModalConfirmar'
import {
  getHabitaciones, getTiposHabitacion, updateHabitacion,
  crearHabitacion, eliminarHabitacion,
  subirFotoHabitacion, setPortadaFoto, eliminarFotoHabitacion
} from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'
import { useModalClose } from '../hooks/useModalClose'

const ESTADOS = ['libre', 'ocupado', 'aseo', 'mantenimiento', 'deshabilitada']

export default function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [tipos, setTipos] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [habitacionALiberar, setHabitacionALiberar] = useState(null)
  const [showNueva, setShowNueva] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const fileInputRef = useRef(null)
  const { sesion } = useSesion()
  const esJefe = sesion?.rol === 'jefe'

  useEffect(() => {
    cargar()
    getTiposHabitacion().then(r => setTipos(r.data)).catch(() => {})
  }, [])

  const cargar = async () => {
    const res = await getHabitaciones()
    setHabitaciones(res.data)
  }

  const [confirmar, setConfirmar] = useState(null)

  const eliminar = (h) => {
    setConfirmar({
      titulo: `¿Eliminar habitación ${h.numero}?`,
      mensaje: 'Quedará inactiva y no aparecerá en el sistema ni en el sitio web.',
      textoBtn: 'Eliminar',
      accion: async () => {
        try {
          await eliminarHabitacion(h.id)
          toast.success(`${h.numero} eliminada`)
          if (seleccionada?.id === h.id) setSeleccionada(null)
          await cargar()
        } catch (e) {
          toast.error(e.response?.data?.error || 'No se pudo eliminar')
        }
      }
    })
  }

  const seleccionar = (h) => {
    setSeleccionada(h)
    setEditForm({
      estado: h.estado,
      nota: h.nota || '',
      descripcion: h.descripcion || '',
      descripcionWeb: h.descripcionWeb || '',
      capacidadMax: h.capacidadMax || '',
      codigoBarras: h.codigoBarras || '',
      precios: h.precios?.map(p => ({ ...p })) || []
    })
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file || !seleccionada) return
    setSubiendoFoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('esPortada', seleccionada.fotos?.length === 0 ? 'true' : 'false')
      await subirFotoHabitacion(seleccionada.id, fd)
      toast.success('Foto subida')
      const res = await getHabitaciones()
      setHabitaciones(res.data)
      const actualizada = res.data.find(h => h.id === seleccionada.id)
      if (actualizada) setSeleccionada(actualizada)
    } catch (e) {
      toast.error('Error al subir foto')
    } finally {
      setSubiendoFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const marcarPortada = async (fotoId) => {
    try {
      await setPortadaFoto(seleccionada.id, fotoId)
      toast.success('Portada actualizada')
      const res = await getHabitaciones()
      setHabitaciones(res.data)
      const actualizada = res.data.find(h => h.id === seleccionada.id)
      if (actualizada) setSeleccionada(actualizada)
    } catch {
      toast.error('Error al cambiar portada')
    }
  }

  const borrarFoto = (fotoId) => {
    setConfirmar({
      titulo: '¿Eliminar esta foto?',
      textoBtn: 'Eliminar',
      accion: async () => { try {
      await eliminarFotoHabitacion(seleccionada.id, fotoId)
      toast.success('Foto eliminada')
      const res = await getHabitaciones()
      setHabitaciones(res.data)
      const actualizada = res.data.find(h => h.id === seleccionada.id)
      if (actualizada) setSeleccionada(actualizada)
    } catch {
      toast.error('Error al eliminar foto')
    }}
    })
  }

  const guardar = async () => {
    if (!seleccionada) return
    setSaving(true)
    try {
      await updateHabitacion(seleccionada.id, {
        ...editForm,
        capacidadMax: editForm.capacidadMax !== '' ? Number(editForm.capacidadMax) : null,
      })
      toast.success(`${seleccionada.numero} actualizada`)
      await cargar()
      setSeleccionada(null)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const actualizarPrecio = (idx, campo, valor) => {
    setEditForm(prev => {
      const precios = [...prev.precios]
      precios[idx] = { ...precios[idx], [campo]: campo === 'precio' ? Number(valor) : valor }
      return { ...prev, precios }
    })
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      {confirmar && (
        <ModalConfirmar
          titulo={confirmar.titulo}
          mensaje={confirmar.mensaje}
          textoBtn={confirmar.textoBtn}
          onConfirmar={() => { setConfirmar(null); confirmar.accion() }}
          onCancelar={() => setConfirmar(null)}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Habitaciones</h1>
          {esJefe && (
            <button onClick={() => setShowNueva(true)} className="btn-primary">
              + Nueva habitación
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {habitaciones.map(h => (
                <RoomCard
                  key={h.id}
                  habitacion={h}
                  seleccionada={seleccionada?.id === h.id}
                  onClick={esJefe ? seleccionar : null}
                  onLiberar={setHabitacionALiberar}
                />
              ))}
            </div>
          </div>

          {/* Panel edición */}
          <div className="lg:col-span-1">
            {seleccionada && esJefe ? (
              <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Hab. {seleccionada.numero}</h2>
                  <button onClick={() => setSeleccionada(null)} className="text-muted hover:text-white text-sm">✕</button>
                </div>

                <div className="space-y-4">

                  {/* ── Fotos ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted uppercase tracking-wide">Fotos del sitio web</label>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoFoto}
                        className="text-xs text-accent hover:underline disabled:opacity-50"
                      >
                        {subiendoFoto ? 'Subiendo...' : '+ Subir foto'}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={subirFoto} />
                    </div>

                    {seleccionada.fotos?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {seleccionada.fotos.map(f => (
                          <div key={f.id} className="relative group aspect-square">
                            <img
                              src={f.url}
                              alt=""
                              className={`w-full h-full object-cover rounded ${f.esPortada ? 'ring-2 ring-accent' : ''}`}
                            />
                            {f.esPortada && (
                              <span className="absolute top-1 left-1 text-[9px] bg-accent text-black font-bold px-1 rounded leading-tight">
                                PORTADA
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center gap-1">
                              {!f.esPortada && (
                                <button
                                  onClick={() => marcarPortada(f.id)}
                                  className="text-[10px] bg-accent text-black font-bold px-2 py-0.5 rounded hover:bg-yellow-400"
                                >
                                  Portada
                                </button>
                              )}
                              <button
                                onClick={() => borrarFoto(f.id)}
                                className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded hover:bg-red-500"
                              >
                                Borrar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted text-xs cursor-pointer hover:border-accent/50 transition-colors"
                      >
                        Sin fotos — haz clic para subir
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs text-muted uppercase tracking-wide mb-3">Datos del sitio web</p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted mb-1 block">Descripción pública</label>
                        <textarea
                          className="input resize-none text-sm"
                          rows={3}
                          placeholder="Descripción que verán los huéspedes al reservar..."
                          value={editForm.descripcionWeb}
                          onChange={e => setEditForm(p => ({ ...p, descripcionWeb: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted mb-1 block">Capacidad máx. (personas)</label>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Ej: 2"
                          value={editForm.capacidadMax}
                          onChange={e => setEditForm(p => ({ ...p, capacidadMax: e.target.value }))}
                        />
                      </div>

                      {seleccionada.amenidades && (
                        <div>
                          <label className="text-xs text-muted mb-1 block">Amenidades (del tipo de habitación)</label>
                          <p className="text-xs text-gray-400 bg-surface rounded px-2 py-1.5">{seleccionada.amenidades}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs text-muted uppercase tracking-wide mb-3">Datos internos (POS)</p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted mb-1 block">Estado</label>
                        <select
                          className="input"
                          value={editForm.estado}
                          onChange={e => setEditForm(p => ({ ...p, estado: e.target.value }))}
                        >
                          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-muted mb-1 block">Nota interna</label>
                        <input className="input" placeholder="Opcional..." value={editForm.nota}
                          onChange={e => setEditForm(p => ({ ...p, nota: e.target.value }))} />
                      </div>

                      <div>
                        <label className="text-xs text-muted mb-1 block">Código barras</label>
                        <input className="input font-mono" placeholder="Para pistola de código"
                          value={editForm.codigoBarras}
                          onChange={e => setEditForm(p => ({ ...p, codigoBarras: e.target.value }))} />
                      </div>

                      <div>
                        <label className="text-xs text-muted mb-2 block">Tarifas</label>
                        <div className="space-y-2">
                          {editForm.precios?.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-muted w-16 shrink-0 text-xs">{p.duracion} / {p.personas}p</span>
                              <input
                                className="input py-1"
                                type="number"
                                value={p.precio}
                                onChange={e => actualizarPrecio(i, 'precio', e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={guardar} disabled={saving} className="btn-primary w-full">
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>

                  <button
                    onClick={() => eliminar(seleccionada)}
                    className="w-full text-xs py-2 rounded-lg border border-red-700/60 text-red-400 hover:bg-red-900/30 font-medium transition-colors"
                  >
                    🗑 Eliminar habitación
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center text-muted py-12">
                {esJefe ? 'Selecciona una habitación para editarla' : 'Solo el jefe puede editar habitaciones'}
              </div>
            )}
          </div>
        </div>
      </div>

      {habitacionALiberar && (
        <ModalLiberar
          habitacion={habitacionALiberar}
          onExito={() => {
            const id = habitacionALiberar?.id
            setHabitacionALiberar(null)
            cargar()
            if (seleccionada?.id === id) setSeleccionada(null)
          }}
          onCancelar={() => setHabitacionALiberar(null)}
        />
      )}

      {showNueva && esJefe && (
        <ModalNuevaHabitacion
          tipos={tipos}
          onCerrar={() => setShowNueva(false)}
          onExito={() => { setShowNueva(false); cargar() }}
        />
      )}
    </div>
  )
}

function ModalNuevaHabitacion({ tipos, onCerrar, onExito }) {
  const [numero, setNumero] = useState('')
  const [tipoId, setTipoId] = useState(tipos[0]?.id || '')
  const [descripcion, setDescripcion] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [precios, setPrecios] = useState([
    { duracion: '1h',    personas: 1, precio: '' },
    { duracion: '3h',    personas: 1, precio: '' },
    { duracion: 'noche', personas: 1, precio: '' },
  ])
  const [loading, setLoading] = useState(false)
  useModalClose(onCerrar, !loading)

  const guardar = async () => {
    if (!numero.trim()) { toast.warning('Ingresa el número de habitación'); return }
    if (!tipoId)        { toast.warning('Selecciona un tipo'); return }
    setLoading(true)
    try {
      await crearHabitacion({
        numero: numero.trim(),
        tipoId,
        descripcion: descripcion.trim() || null,
        codigoBarras: codigoBarras.trim() || null,
        precios: precios
          .filter(p => p.precio !== '' && Number(p.precio) > 0)
          .map(p => ({ ...p, precio: Number(p.precio), personas: Number(p.personas) })),
      })
      toast.success(`Habitación ${numero} creada`)
      onExito()
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo crear')
    } finally { setLoading(false) }
  }

  const actualizarPrecio = (i, campo, val) =>
    setPrecios(ps => ps.map((p, idx) => idx === i ? { ...p, [campo]: val } : p))

  const agregarPrecio = () =>
    setPrecios(ps => [...ps, { duracion: '', personas: 1, precio: '' }])

  const quitarPrecio = (i) =>
    setPrecios(ps => ps.filter((_, idx) => idx !== i))

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onCerrar}>
      <div className="modal-panel w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Nueva Habitación</h2>
          <p className="text-muted text-sm mt-1">Se crea en estado libre, lista para vender</p>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Número *</label>
              <input className="input" placeholder="L102" value={numero}
                onChange={e => setNumero(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Tipo *</label>
              <select className="input" value={tipoId} onChange={e => setTipoId(e.target.value)}>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Descripción (opcional)</label>
            <input className="input" placeholder="Ej: Loft con vista al patio" value={descripcion}
              onChange={e => setDescripcion(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Código de barras (opcional)</label>
            <input className="input font-mono" placeholder="Para escanear con pistola"
              value={codigoBarras} onChange={e => setCodigoBarras(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">Tarifas</label>
              <button onClick={agregarPrecio} className="text-xs text-accent hover:underline">+ Agregar</button>
            </div>
            <div className="space-y-2">
              {precios.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input col-span-4 text-sm" placeholder="duración (1h, noche)"
                    value={p.duracion} onChange={e => actualizarPrecio(i, 'duracion', e.target.value)} />
                  <input className="input col-span-2 text-sm text-center tabular-nums" type="number" min="1"
                    value={p.personas} onChange={e => actualizarPrecio(i, 'personas', e.target.value)} />
                  <input className="input col-span-5 text-sm text-right tabular-nums" type="number" placeholder="precio"
                    value={p.precio} onChange={e => actualizarPrecio(i, 'precio', e.target.value)} />
                  <button onClick={() => quitarPrecio(i)}
                    className="col-span-1 text-red-400 hover:text-red-300 text-sm">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <button onClick={onCerrar} disabled={loading} className="btn-ghost">Cancelar</button>
          <button onClick={guardar} disabled={loading} className="btn-primary">
            {loading ? 'Creando...' : 'Crear Habitación'}
          </button>
        </div>
      </div>
    </div>
  )
}
