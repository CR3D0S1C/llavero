import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import ModalDTE from '../components/ModalDTE'
import ModalEarlyCheckin from '../components/ModalEarlyCheckin'
import { getHabitaciones, getProductos, crearVenta } from '../services/api'
import { useSesion } from '../context/SesionContext'

export default function NuevaVenta() {
  const [habitaciones, setHabitaciones] = useState([])
  const [productos, setProductos] = useState([])
  const [habitacionSel, setHabitacionSel] = useState(null)
  const [tarifaSel, setTarifaSel] = useState(null)
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showEarlyCheckin, setShowEarlyCheckin] = useState(false)
  const [earlyCheckinVal, setEarlyCheckinVal] = useState(null)
  const [showLibre, setShowLibre] = useState(false)
  const [codSuper, setCodSuper] = useState('')
  const [libreDesc, setLibreDesc] = useState('')
  const [librePrecio, setLibrePrecio] = useState('')
  const [codError, setCodError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { sesion } = useSesion()
  const navigate = useNavigate()

  const CODIGO_SUPERVISOR = '7777'

  useEffect(() => {
    Promise.all([getHabitaciones(), getProductos()]).then(([h, p]) => {
      setHabitaciones(h.data.filter(h => h.estado === 'libre'))
      setProductos(p.data)
    })
  }, [])

  const seleccionarTarifa = (precio) => {
    if (!habitacionSel) return
    const existe = items.find(i => i.tipo === 'habitacion')
    const item = {
      tipo: 'habitacion',
      descripcion: `${habitacionSel.numero} ${habitacionSel.tipoLabel} ${precio.duracion} (${precio.personas} pers.)`,
      cantidad: 1,
      precioUnitario: precio.precio,
      esLibre: false
    }
    if (existe) {
      setItems(prev => prev.map(i => i.tipo === 'habitacion' ? item : i))
    } else {
      setItems(prev => [...prev, item])
    }
    setTarifaSel(precio)
    setEarlyCheckinVal(null)
  }

  const handleConfirmarClick = () => {
    const hora = new Date().getHours()
    if (tarifaSel?.duracion === 'noche' && hora < 12) {
      setShowEarlyCheckin(true)
    } else {
      setShowModal(true)
    }
  }

  const handleEarlyCheckinConfirm = (val) => {
    setEarlyCheckinVal(val)
    setShowEarlyCheckin(false)
    setShowModal(true)
  }

  const agregarProducto = (prod) => {
    setItems(prev => {
      const existe = prev.find(i => i.descripcion === prod.nombre && i.tipo === 'producto')
      if (existe) {
        return prev.map(i => i.descripcion === prod.nombre && i.tipo === 'producto'
          ? { ...i, cantidad: i.cantidad + 1 }
          : i)
      }
      return [...prev, { tipo: 'producto', descripcion: prod.nombre, cantidad: 1, precioUnitario: prod.precio, esLibre: false }]
    })
  }

  const agregarLibre = () => {
    if (codSuper !== CODIGO_SUPERVISOR) { setCodError(true); return }
    if (!libreDesc || !librePrecio) return
    setItems(prev => [...prev, {
      tipo: 'libre',
      descripcion: libreDesc,
      cantidad: 1,
      precioUnitario: parseFloat(librePrecio),
      esLibre: true
    }])
    setShowLibre(false)
    setCodSuper('')
    setLibreDesc('')
    setLibrePrecio('')
    setCodError(false)
  }

  const quitarItem = (idx) => {
    const item = items[idx]
    if (item.tipo === 'habitacion') setTarifaSel(null)
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const total = items.reduce((s, i) => s + (i.precioUnitario * i.cantidad), 0)

  const confirmarVenta = async (tipoDte, receptor) => {
    if (!habitacionSel || !tarifaSel) return
    setLoading(true)
    try {
      await crearVenta({
        habitacionId: habitacionSel.id,
        tipoDte,
        duracion: tarifaSel.duracion,
        earlyCheckin: earlyCheckinVal,
        items: items.map(i => ({ ...i })),
        ...(receptor ? {
          receptorRut: receptor.rut,
          receptorRazon: receptor.razon,
          receptorGiro: receptor.giro,
          receptorDireccion: receptor.direccion,
          receptorComuna: receptor.comuna,
          receptorCiudad: receptor.ciudad,
          receptorEmail: receptor.email,
        } : {})
      })
      navigate('/dashboard')
    } catch (e) {
      alert(e.response?.data?.error || 'Error al crear venta')
    } finally {
      setLoading(false)
    }
  }

  const categorias = [...new Set(productos.map(p => p.categoria))]

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Nueva Venta</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Izquierda: Habitación + Productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Habitaciones */}
            <div className="card">
              <h2 className="font-semibold mb-3">1. Seleccionar Habitación</h2>
              {habitaciones.length === 0 ? (
                <p className="text-muted text-sm">No hay habitaciones disponibles</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {habitaciones.map(h => (
                    <RoomCard
                      key={h.id}
                      habitacion={h}
                      seleccionada={habitacionSel?.id === h.id}
                      onClick={() => { setHabitacionSel(h); setTarifaSel(null); setItems(prev => prev.filter(i => i.tipo !== 'habitacion')) }}
                    />
                  ))}
                </div>
              )}

              {/* Tarifas */}
              {habitacionSel && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted mb-3">Tarifas — {habitacionSel.numero}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {habitacionSel.precios?.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => seleccionarTarifa(p)}
                        className={`p-3 rounded-lg border text-sm transition-all text-left ${
                          tarifaSel === p
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-gray-500'
                        }`}
                      >
                        <div className="font-semibold">{p.duracion}</div>
                        <div className="text-xs text-muted">{p.personas} persona{p.personas > 1 ? 's' : ''}</div>
                        <div className="font-bold mt-1">${Number(p.precio).toLocaleString('es-CL')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Productos */}
            <div className="card">
              <h2 className="font-semibold mb-3">2. Agregar Productos (opcional)</h2>
              {categorias.map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-xs text-muted mb-2">{cat}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {productos.filter(p => p.categoria === cat).map(p => (
                      <button
                        key={p.id}
                        onClick={() => agregarProducto(p)}
                        className="p-3 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-left"
                      >
                        <span className="text-xl">{p.icono}</span>
                        <div className="text-sm font-medium mt-1 leading-tight">{p.nombre}</div>
                        <div className="text-xs text-green-400 font-bold">${Number(p.precio).toLocaleString('es-CL')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Ítem libre */}
              <div className="mt-3 pt-3 border-t border-border">
                {!showLibre ? (
                  <button onClick={() => setShowLibre(true)} className="btn-ghost text-sm">
                    + Ítem libre
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted font-semibold">Ítem Libre — Requiere código supervisor</p>
                    <input className="input" placeholder="Código supervisor (4 dígitos)"
                      value={codSuper} onChange={e => { setCodSuper(e.target.value); setCodError(false) }}
                      type="password" maxLength={4} />
                    {codError && <p className="text-red-400 text-xs">Código incorrecto</p>}
                    <input className="input" placeholder="Descripción" value={libreDesc}
                      onChange={e => setLibreDesc(e.target.value)} />
                    <input className="input" placeholder="Precio" type="number" value={librePrecio}
                      onChange={e => setLibrePrecio(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={agregarLibre} className="btn-primary text-sm">Agregar</button>
                      <button onClick={() => setShowLibre(false)} className="btn-ghost text-sm">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Derecha: Caja */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="font-semibold mb-4">Resumen</h2>

              {items.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">Sin ítems todavía</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          {item.esLibre && <span className="text-xs bg-yellow-900/40 text-yellow-400 px-1 rounded">LIBRE</span>}
                          <span>{item.descripcion}</span>
                        </div>
                        {item.cantidad > 1 && <span className="text-xs text-muted">x{item.cantidad}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-semibold whitespace-nowrap">
                          ${(item.precioUnitario * item.cantidad).toLocaleString('es-CL')}
                        </span>
                        <button onClick={() => quitarItem(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-400">${total.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmarClick}
                disabled={!habitacionSel || !tarifaSel || loading}
                className="btn-primary w-full mt-4 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Confirmar Venta'}
              </button>

              {tarifaSel?.duracion === 'noche' && new Date().getHours() < 12 && (
                <p className="text-xs text-yellow-500/70 mt-2 text-center">
                  Llegada temprana — se consultará por early check-in
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEarlyCheckin && (
        <ModalEarlyCheckin
          habitacion={habitacionSel}
          onConfirmar={handleEarlyCheckinConfirm}
          onCancelar={() => setShowEarlyCheckin(false)}
        />
      )}

      {showModal && (
        <ModalDTE
          total={total}
          onConfirmar={(tipo, receptor) => { setShowModal(false); confirmarVenta(tipo, receptor) }}
          onCancelar={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
