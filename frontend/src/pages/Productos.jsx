import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getProductos, crearProducto, updateProducto, eliminarProducto } from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'

const CATEGORIAS = ['Desayunos', 'Snacks', 'Aseo', 'Electrónica', 'Otro']
const ICONOS = ['🥐','🍳','☕','💧','🥤','🍟','🍫','🧴','🛁','💊','🔌','🎧','🍕','🧃','🍿','🪥']

const FORM_VACIO = {
  nombre: '', precio: '', icono: '📦', categoria: 'Snacks',
  codigoBarras: '', stock: '', stockMinimo: '', costo: ''
}

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
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
    if (!form.nombre || !form.precio) {
      toast.warning('Nombre y precio son obligatorios')
      return
    }
    const payload = {
      ...form,
      precio: Number(form.precio),
      costo: form.costo !== '' ? Number(form.costo) : null,
      stock: form.stock !== '' ? Number(form.stock) : null,
      stockMinimo: form.stockMinimo !== '' ? Number(form.stockMinimo) : 0,
      codigoBarras: form.codigoBarras?.trim() || null,
    }
    try {
      if (editId) {
        await updateProducto(editId, payload)
        toast.success(`Producto "${form.nombre}" actualizado`)
      } else {
        await crearProducto(payload)
        toast.success(`Producto "${form.nombre}" creado`)
      }
      await cargar()
      setForm(FORM_VACIO)
      setEditId(null)
      setShowForm(false)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar')
    }
  }

  const editar = (p) => {
    setForm({
      nombre: p.nombre, precio: p.precio, icono: p.icono, categoria: p.categoria,
      codigoBarras: p.codigoBarras || '',
      stock: p.stock ?? '',
      stockMinimo: p.stockMinimo ?? '',
      costo: p.costo ?? '',
    })
    setEditId(p.id)
    setShowForm(true)
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Desactivar el producto "${nombre}"?`)) return
    try {
      await eliminarProducto(id)
      toast.success('Producto desactivado')
      await cargar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al desactivar')
    }
  }

  const categorias = [...new Set(productos.map(p => p.categoria))]

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
          {esJefe && (
            <button onClick={() => { setForm(FORM_VACIO); setEditId(null); setShowForm(true) }} className="btn-primary">
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

            {/* Bloque inventario */}
            <div className="border-t border-border mt-4 pt-4">
              <p className="text-xs uppercase tracking-wider text-muted mb-3">Inventario (opcional)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Código barras</label>
                  <input className="input font-mono" placeholder="780..." value={form.codigoBarras}
                    onChange={e => setForm(p => ({ ...p, codigoBarras: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Stock inicial</label>
                  <input className="input tabular-nums" type="number" placeholder="—" value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Mínimo (alerta)</label>
                  <input className="input tabular-nums" type="number" placeholder="0" value={form.stockMinimo}
                    onChange={e => setForm(p => ({ ...p, stockMinimo: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Costo unitario</label>
                  <input className="input tabular-nums" type="number" placeholder="0" value={form.costo}
                    onChange={e => setForm(p => ({ ...p, costo: e.target.value }))} />
                </div>
              </div>
              <p className="text-xs text-muted mt-2">
                Dejá Stock vacío si no querés trackear inventario para este producto.
              </p>
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
              {productos.filter(p => p.categoria === cat).map(p => {
                const stockState = p.stock == null ? null
                  : p.stock === 0 ? { label: 'Sin stock', cls: 'text-red-400 bg-red-900/40' }
                  : p.stock <= (p.stockMinimo || 0) ? { label: `${p.stock} · bajo`, cls: 'text-yellow-400 bg-yellow-900/40' }
                  : { label: `${p.stock} en stock`, cls: 'text-green-400 bg-green-900/40' }
                return (
                <div key={p.id} className="card flex items-center gap-3">
                  <span className="text-2xl">{p.icono}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.nombre}</div>
                    <div className="text-green-400 text-sm font-bold">${Number(p.precio).toLocaleString('es-CL')}</div>
                    {stockState && (
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${stockState.cls}`}>
                        {stockState.label}
                      </span>
                    )}
                    {p.codigoBarras && (
                      <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">{p.codigoBarras}</p>
                    )}
                  </div>
                  {esJefe && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => editar(p)} className="text-xs text-muted hover:text-white">✏️</button>
                      <button onClick={() => eliminar(p.id, p.nombre)} className="text-xs text-red-400 hover:text-red-300">🗑️</button>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
