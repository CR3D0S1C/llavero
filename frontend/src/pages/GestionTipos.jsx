import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ModalConfirmar from '../components/ModalConfirmar'
import {
  getTiposHabitacion, crearTipoHabitacion, actualizarTipoHabitacion, eliminarTipoHabitacion,
  crearTarifaTemporada, eliminarTarifaTemporada,
} from '../services/api'
import { toast } from '../utils/toast'

const TARIFA_INIT = { label: '', fechaDesde: '', fechaHasta: '', precio: '' }

const AMENIDADES_COMUNES = [
  'WiFi gratuito', 'TV LCD', 'Calefacción', 'Aire acondicionado',
  'Agua caliente', 'Armario', 'Cocina equipada', 'Menaje incluido',
  'Casillero personal', 'Baño privado', 'Escritorio',
]

const COLORES_PRESET = [
  '#1C4A5A', '#5B8A6F', '#7E9B89', '#4A7A8A', '#3D6B5E',
  '#C9943A', '#6B6057', '#B5533E', '#2A7D4F', '#8B5CF6',
]

const FORM_VACIO = { id: '', label: '', bano: 'privado', color: '#1C4A5A', amenidades: '' }

export default function GestionTipos() {
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(FORM_VACIO)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [amenidadInput, setAmenidadInput] = useState('')

  // Tarifas de temporada
  const [tarifasAbiertas, setTarifasAbiertas] = useState(new Set())
  const [tarifaForms, setTarifaForms] = useState({}) // tipoId → form
  const [guardandoTarifa, setGuardandoTarifa] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await getTiposHabitacion()
      setTipos(res.data)
    } catch { toast.error('Error al cargar tipos') }
    finally { setLoading(false) }
  }

  const amenidadesArr = form.amenidades
    ? form.amenidades.split(',').map(a => a.trim()).filter(Boolean)
    : []

  const agregarAmenidad = (a) => {
    const nueva = a.trim()
    if (!nueva || amenidadesArr.includes(nueva)) return
    setForm(f => ({ ...f, amenidades: [...amenidadesArr, nueva].join(', ') }))
    setAmenidadInput('')
  }

  const quitarAmenidad = (a) => {
    setForm(f => ({
      ...f,
      amenidades: amenidadesArr.filter(x => x !== a).join(', ')
    }))
  }

  const iniciarEdicion = (tipo) => {
    setEditando(tipo.id)
    setForm({
      id: tipo.id,
      label: tipo.label,
      bano: tipo.bano,
      color: tipo.color || '#1C4A5A',
      amenidades: tipo.amenidades || '',
    })
    setAmenidadInput('')
  }

  const cancelar = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setAmenidadInput('')
  }

  const guardar = async () => {
    if (!form.label.trim()) return toast.error('El nombre es obligatorio')
    if (!editando && !form.id.trim()) return toast.error('El ID es obligatorio')
    setGuardando(true)
    try {
      if (editando) {
        const res = await actualizarTipoHabitacion(editando, form)
        setTipos(ts => ts.map(t => t.id === editando ? res.data : t))
        toast.success('Tipo actualizado')
      } else {
        const res = await crearTipoHabitacion(form)
        setTipos(ts => [...ts, res.data])
        toast.success('Tipo creado')
      }
      cancelar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  const [confirmar, setConfirmar] = useState(null)

  const eliminar = (tipo) => {
    setConfirmar({
      titulo: `¿Eliminar el tipo "${tipo.label}"?`,
      mensaje: 'Solo es posible si no tiene habitaciones asignadas.',
      textoBtn: 'Eliminar',
      accion: async () => {
        try {
          await eliminarTipoHabitacion(tipo.id)
          setTipos(ts => ts.filter(t => t.id !== tipo.id))
          toast.success('Tipo eliminado')
        } catch (e) {
          toast.error(e.response?.data?.error || 'Error al eliminar')
        }
      }
    })
  }

  const toggleTarifas = (tipoId) => {
    setTarifasAbiertas(prev => {
      const next = new Set(prev)
      next.has(tipoId) ? next.delete(tipoId) : next.add(tipoId)
      return next
    })
    if (!tarifaForms[tipoId]) {
      setTarifaForms(f => ({ ...f, [tipoId]: { ...TARIFA_INIT } }))
    }
  }

  const handleCrearTarifa = async (tipoId) => {
    const f = tarifaForms[tipoId]
    if (!f?.label?.trim()) return toast.error('Ingresa un nombre para la tarifa')
    if (!f.fechaDesde || !f.fechaHasta) return toast.error('Las fechas son obligatorias')
    if (f.fechaDesde >= f.fechaHasta) return toast.error('La fecha de fin debe ser posterior a la de inicio')
    if (!f.precio || Number(f.precio) <= 0) return toast.error('El precio debe ser mayor a cero')
    setGuardandoTarifa(tipoId)
    try {
      await crearTarifaTemporada(tipoId, {
        label: f.label.trim(),
        fechaDesde: f.fechaDesde,
        fechaHasta: f.fechaHasta,
        precio: Number(f.precio),
      })
      toast.success('Tarifa creada')
      setTarifaForms(forms => ({ ...forms, [tipoId]: { ...TARIFA_INIT } }))
      const res = await getTiposHabitacion()
      setTipos(res.data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear tarifa')
    } finally { setGuardandoTarifa(null) }
  }

  const handleEliminarTarifa = (tipoId, tarifaId, label) => {
    setConfirmar({
      titulo: `¿Eliminar la tarifa "${label}"?`,
      textoBtn: 'Eliminar',
      accion: async () => {
        try {
          await eliminarTarifaTemporada(tipoId, tarifaId)
          toast.success('Tarifa eliminada')
          const res = await getTiposHabitacion()
          setTipos(res.data)
        } catch (e) {
          toast.error(e.response?.data?.error || 'Error al eliminar tarifa')
        }
      }
    })
  }

  const fmtFecha = (d) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${parseInt(day)} ${meses[parseInt(m)-1]} ${y}`
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
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-white">Tipos de habitación</h1>
          <p className="text-muted text-sm mt-1">
            Define las categorías de habitaciones. Luego las asignas al crear cada habitación.
          </p>
        </div>

        {/* Formulario crear / editar */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">
            {editando ? 'Editar tipo' : 'Nuevo tipo'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID — solo al crear */}
            {!editando && (
              <div>
                <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">
                  ID interno <span className="text-red-400">*</span>
                </label>
                <input
                  className="input w-full"
                  placeholder="ej: doble-privado"
                  value={form.id}
                  onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                />
                <p className="text-xs text-muted mt-1">Clave única, sin espacios. Se normaliza automáticamente.</p>
              </div>
            )}
            {editando && (
              <div>
                <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">ID</label>
                <div className="input w-full bg-white/5 text-muted cursor-not-allowed">{editando}</div>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">
                Nombre visible <span className="text-red-400">*</span>
              </label>
              <input
                className="input w-full"
                placeholder="ej: Habitación Doble Matrimonial"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>

            {/* Baño */}
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Tipo de baño</label>
              <select
                className="input w-full"
                value={form.bano}
                onChange={e => setForm(f => ({ ...f, bano: e.target.value }))}
              >
                <option value="privado">Privado</option>
                <option value="compartido">Compartido</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Color en panel</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="h-10 w-14 rounded cursor-pointer border border-border bg-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COLORES_PRESET.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      title={c}
                      style={{ background: c }}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        form.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Amenidades */}
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Amenidades</label>

            {/* Tags actuales */}
            {amenidadesArr.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {amenidadesArr.map(a => (
                  <span key={a} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/15 text-accent text-xs rounded-full">
                    {a}
                    <button onClick={() => quitarAmenidad(a)} className="text-accent/60 hover:text-red-400 leading-none">✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* Input + botón agregar */}
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Escribe una amenidad y presiona Enter o Agregar"
                value={amenidadInput}
                onChange={e => setAmenidadInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarAmenidad(amenidadInput) } }}
              />
              <button
                onClick={() => agregarAmenidad(amenidadInput)}
                className="btn-ghost px-4 text-sm"
              >
                + Agregar
              </button>
            </div>

            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {AMENIDADES_COMUNES.filter(a => !amenidadesArr.includes(a)).map(a => (
                <button
                  key={a}
                  onClick={() => agregarAmenidad(a)}
                  className="px-2 py-0.5 text-xs border border-border text-muted rounded-full hover:border-accent hover:text-accent transition-colors"
                >
                  + {a}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="btn-primary px-6"
            >
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear tipo'}
            </button>
            {editando && (
              <button onClick={cancelar} className="btn-ghost px-6">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de tipos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            Tipos creados <span className="text-muted text-sm font-normal">({tipos.length})</span>
          </h2>

          {loading ? (
            <div className="text-muted text-sm">Cargando...</div>
          ) : tipos.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted">
              No hay tipos creados aún. Crea el primero arriba.
            </div>
          ) : (
            <div className="grid gap-3">
              {tipos.map(tipo => {
                const abierto = tarifasAbiertas.has(tipo.id)
                const tf = tarifaForms[tipo.id] || TARIFA_INIT
                const tarifas = tipo.tarifas || []
                return (
                  <div key={tipo.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Fila principal */}
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: tipo.color || '#6B6057' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{tipo.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted">{tipo.bano}</span>
                          <span className="text-xs text-muted font-mono">{tipo.id}</span>
                        </div>
                        {tipo.amenidades && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {tipo.amenidades.split(',').map(a => (
                              <span key={a} className="text-xs px-1.5 py-0.5 bg-white/5 text-muted rounded">{a.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => toggleTarifas(tipo.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            abierto
                              ? 'border-orange-700/60 text-orange-400 bg-orange-900/20'
                              : 'border-border text-muted hover:text-white'
                          }`}
                        >
                          🌟 Temporada {tarifas.length > 0 ? `(${tarifas.length})` : ''}
                        </button>
                        <button onClick={() => iniciarEdicion(tipo)} className="btn-ghost text-xs px-3 py-1.5">Editar</button>
                        <button
                          onClick={() => eliminar(tipo)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Sección tarifas expandible */}
                    {abierto && (
                      <div className="border-t border-border bg-white/2 px-4 pb-4 pt-3 space-y-3">
                        <p className="text-xs uppercase tracking-wider text-orange-400 font-medium">Tarifas de temporada — {tipo.label}</p>

                        {tarifas.length === 0 ? (
                          <p className="text-xs text-muted">Sin tarifas definidas. Las fechas fuera de temporada usarán el precio base de cada habitación.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {tarifas.map(t => (
                              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-border/40">
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium">{t.label}</span>
                                  <span className="text-xs text-muted ml-2">
                                    {fmtFecha(t.fechaDesde)} → {fmtFecha(t.fechaHasta)}
                                  </span>
                                </div>
                                <span className="text-orange-400 font-semibold text-sm shrink-0">
                                  ${Number(t.precio).toLocaleString('es-CL')}/noche
                                </span>
                                <button
                                  onClick={() => handleEliminarTarifa(tipo.id, t.id, t.label)}
                                  className="text-red-400/60 hover:text-red-400 text-xs shrink-0"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulario nueva tarifa */}
                        <div className="border border-dashed border-orange-700/40 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-muted">Nueva tarifa de temporada</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input
                              className="input text-sm col-span-2 md:col-span-1"
                              placeholder="Nombre (ej: Temporada Alta)"
                              value={tf.label}
                              onChange={e => setTarifaForms(f => ({ ...f, [tipo.id]: { ...tf, label: e.target.value } }))}
                            />
                            <input
                              type="date"
                              className="input text-sm"
                              value={tf.fechaDesde}
                              onChange={e => setTarifaForms(f => ({ ...f, [tipo.id]: { ...tf, fechaDesde: e.target.value } }))}
                            />
                            <input
                              type="date"
                              className="input text-sm"
                              min={tf.fechaDesde}
                              value={tf.fechaHasta}
                              onChange={e => setTarifaForms(f => ({ ...f, [tipo.id]: { ...tf, fechaHasta: e.target.value } }))}
                            />
                            <input
                              type="number"
                              className="input text-sm"
                              placeholder="Precio/noche"
                              value={tf.precio}
                              onChange={e => setTarifaForms(f => ({ ...f, [tipo.id]: { ...tf, precio: e.target.value } }))}
                            />
                          </div>
                          <button
                            onClick={() => handleCrearTarifa(tipo.id)}
                            disabled={guardandoTarifa === tipo.id}
                            className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                          >
                            {guardandoTarifa === tipo.id ? 'Guardando...' : '+ Agregar tarifa'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
