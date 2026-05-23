import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getProductos, crearProducto, updateProducto, eliminarProducto } from '../services/api'
import { useSesion } from '../context/SesionContext'

const CATEGORIAS = ['Desayunos', 'Snacks', 'Aseo', 'Electrónica', 'Otro']
const ICONOS = ['🥐','🍳','☕','💧','🥤','🍟','🍫','🧴','🛁','💊','🔌','🎧','🍕','🧃','🍿','🪥']

const vacío = { nombre: '', precio: '', icono: '📦', categoria: 'Snacks' }

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState(vacío)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const { sesion } = useSesion()
  const esJefe = sesion?.rol === 'jefe'

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await getProductos()
    setProductos(res.data)
  }

  const guardar = async () => {
    if (!form.nombre || !form.precio) return
    try {
      if (editId) {
        await updateProducto(editId, form)
      } else {
        await crearProducto(form)
      }
      await cargar()
      setForm(vacío)
      setEditId(null)
      setShowForm(false)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    }
  }

  const editar = (p) => {
    setForm({ nombre: p.nombre, precio: p.precio, icono: p.icono, categoria: p.categoria })
    setEditId(p.id)
    setShowForm(true)
  }

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar producto?')) return
    await eliminarProducto(id)
    await cargar()
  }

  const categorias = [...new Set(productos.map(p => p.categoria))]

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
          {esJefe && (
            <button onClick={() => { setForm(vacío); setEditId(null); setShowForm(true) }} className="btn-primary">
              + Nuevo Producto
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && esJefe && (
          <div className="card mb-6">
            <h2 className="font-semibold mb-4">{editId ? 'Editar' : 'Nuevo'} Producto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Nombre</label>
                <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Precio</label>
                <input className="input" type="number" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Categoría</label>
                <select className="input" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-2 block">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {ICONOS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setForm(p => ({ ...p, icono: ic }))}
                      className={`w-9 h-9 rounded-lg text-xl transition-all ${form.icono === ic ? 'bg-accent/20 border border-accent' : 'hover:bg-white/5'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={guardar} className="btn-primary">Guardar</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        )}

        {/* Lista por categoría */}
        {categorias.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="text-muted text-sm font-semibold mb-3 uppercase tracking-wider">{cat}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productos.filter(p => p.categoria === cat).map(p => (
                <div key={p.id} className="card flex items-center gap-3">
                  <span className="text-2xl">{p.icono}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.nombre}</div>
                    <div className="text-green-400 text-sm font-bold">${Number(p.precio).toLocaleString('es-CL')}</div>
                  </div>
                  {esJefe && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => editar(p)} className="text-xs text-muted hover:text-white">✏️</button>
                      <button onClick={() => eliminar(p.id)} className="text-xs text-red-400 hover:text-red-300">🗑️</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
