import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import ModalLiberar from '../components/ModalLiberar'
import { getHabitaciones, updateHabitacion } from '../services/api'
import { useSesion } from '../context/SesionContext'

const ESTADOS = ['libre', 'ocupado', 'aseo', 'mantenimiento', 'deshabilitada']

export default function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [habitacionALiberar, setHabitacionALiberar] = useState(null)
  const { sesion } = useSesion()
  const esJefe = sesion?.rol === 'jefe'

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await getHabitaciones()
    setHabitaciones(res.data)
  }

  const seleccionar = (h) => {
    setSeleccionada(h)
    setEditForm({
      estado: h.estado,
      nota: h.nota || '',
      descripcion: h.descripcion || '',
      precios: h.precios?.map(p => ({ ...p })) || []
    })
  }

  const guardar = async () => {
    if (!seleccionada) return
    setSaving(true)
    try {
      await updateHabitacion(seleccionada.id, editForm)
      await cargar()
      setSeleccionada(null)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Habitaciones</h1>

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
              <div className="card sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Editar — {seleccionada.numero}</h2>
                  <button onClick={() => setSeleccionada(null)} className="text-muted hover:text-white text-sm">✕</button>
                </div>

                <div className="space-y-4">
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
                    <label className="text-xs text-muted mb-2 block">Tarifas</label>
                    <div className="space-y-2">
                      {editForm.precios?.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-muted w-16 shrink-0">{p.duracion} / {p.personas}p</span>
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

                  <button onClick={guardar} disabled={saving} className="btn-primary w-full">
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
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
    </div>
  )
}
