import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import ModalDTE from '../components/ModalDTE'
import ModalConfirmar from '../components/ModalConfirmar'
import ModalEarlyCheckin from '../components/ModalEarlyCheckin'
import ComprobanteVenta from '../components/ComprobanteVenta'
import {
  getHabitaciones, getProductos, crearVenta,
  buscarProductoPorCodigo, buscarHabitacionPorCodigo,
  getEstadiasActivas, agregarCargosBatch
} from '../services/api'
import { useSesion } from '../context/SesionContext'
import { toast } from '../utils/toast'

const CODIGO_SUPERVISOR = '7777'
const esNoche = (d) => d?.toLowerCase().includes('noche')

export default function NuevaVenta() {
  const [modo, setModo] = useState('hostal') // 'hostal' | 'minimarket'
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
  const [codigoBarras, setCodigoBarras] = useState('')
  const [ventaConfirmada, setVentaConfirmada] = useState(null)
  const [cantidadNoches, setCantidadNoches] = useState(1)
  const [estadias, setEstadias] = useState([])
  const [estadiaSel, setEstadiaSel] = useState(null)
  const scannerRef = useRef(null)
  const navigate = useNavigate()
  const { sesion } = useSesion()

  useEffect(() => {
    Promise.all([getHabitaciones(), getProductos(), getEstadiasActivas()]).then(([h, p, e]) => {
      setHabitaciones(h.data.filter(x => x.estado === 'libre'))
      setProductos(p.data)
      setEstadias(e.data || [])
    })
  }, [])

  // Mantener el scanner enfocado en modo minimarket
  useEffect(() => {
    if (modo === 'minimarket') {
      const t = setTimeout(() => scannerRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [modo, items.length])

  const [confirmarModo, setConfirmarModo] = useState(null)

  const cambiarModo = (nuevo) => {
    if (items.length > 0) { setConfirmarModo(nuevo); return }
    setModo(nuevo)
    setHabitacionSel(null)
    setTarifaSel(null)
    setItems([])
    setEarlyCheckinVal(null)
    setCantidadNoches(1)
    setEstadiaSel(null)
  }

  const seleccionarTarifa = (precio, noches = cantidadNoches) => {
    if (!habitacionSel) return
    const existe = items.find(i => i.tipo === 'habitacion')
    const esTarifaNoche = esNoche(precio.duracion)
    const n = esTarifaNoche ? noches : 1
    const desc = esTarifaNoche && n > 1
      ? `Hab. ${habitacionSel.numero} ${habitacionSel.tipoLabel} — ${n} noches (${precio.personas} pers.)`
      : `Hab. ${habitacionSel.numero} ${habitacionSel.tipoLabel} ${precio.duracion} (${precio.personas} pers.)`
    const item = {
      tipo: 'habitacion',
      descripcion: desc,
      cantidad: n,
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

  const cambiarNoches = (delta) => {
    const nuevas = Math.max(1, cantidadNoches + delta)
    setCantidadNoches(nuevas)
    if (esNoche(tarifaSel?.duracion)) seleccionarTarifa(tarifaSel, nuevas)
  }

  const handleConfirmarClick = () => {
    if (modo === 'hostal' && habitacionSel && tarifaSel) {
      const hora = new Date().getHours()
      if (esNoche(tarifaSel.duracion) && hora < 12) {
        setShowEarlyCheckin(true)
        return
      }
    }
    setShowModal(true)
  }

  const handleEarlyCheckinConfirm = (val) => {
    setEarlyCheckinVal(val)
    setShowEarlyCheckin(false)
    setShowModal(true)
  }

  const agregarProducto = (prod) => {
    if (prod.stock != null && prod.stock <= 0) {
      toast.warning(`${prod.nombre} sin stock`)
      return
    }
    setItems(prev => {
      const existe = prev.find(i => i.descripcion === prod.nombre && i.tipo === 'producto')
      if (existe) {
        // No permitir vender más de lo que hay en stock si está trackeado
        if (prod.stock != null && existe.cantidad >= prod.stock) {
          toast.warning(`Solo quedan ${prod.stock} de ${prod.nombre}`)
          return prev
        }
        return prev.map(i => i.descripcion === prod.nombre && i.tipo === 'producto'
          ? { ...i, cantidad: i.cantidad + 1 }
          : i)
      }
      return [...prev, { tipo: 'producto', descripcion: prod.nombre, cantidad: 1, precioUnitario: prod.precio, esLibre: false }]
    })
  }

  const escanearCodigo = async (e) => {
    if (e.key !== 'Enter') return
    const codigo = codigoBarras.trim()
    if (!codigo) return
    // 1. Buscar como producto
    try {
      const res = await buscarProductoPorCodigo(codigo)
      agregarProducto(res.data)
      setCodigoBarras('')
      return
    } catch (_) { /* sigue */ }
    // 2. En modo hostal, buscar como habitación
    if (modo === 'hostal') {
      try {
        const res = await buscarHabitacionPorCodigo(codigo)
        if (res.data.estado !== 'libre') {
          toast.warning(`Habitación ${res.data.numero} no disponible (${res.data.estado})`)
        } else {
          setHabitacionSel(res.data)
          setTarifaSel(null)
          setItems(prev => prev.filter(i => i.tipo !== 'habitacion'))
          toast.success(`Habitación ${res.data.numero} seleccionada`)
        }
        setCodigoBarras('')
        return
      } catch (_) { /* fallthrough */ }
    }
    toast.error(`Código ${codigo} no encontrado`)
    setCodigoBarras('')
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
    setCodSuper(''); setLibreDesc(''); setLibrePrecio(''); setCodError(false)
  }

  const quitarItem = (idx) => {
    const item = items[idx]
    if (item.tipo === 'habitacion') setTarifaSel(null)
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const ajustarCantidad = (idx, delta) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      if (it.tipo === 'habitacion') return it
      const nueva = it.cantidad + delta
      if (nueva <= 0) return null
      const prod = productos.find(p => p.nombre === it.descripcion)
      if (delta > 0 && prod?.stock != null && nueva > prod.stock) {
        toast.warning(`Solo quedan ${prod.stock} de ${it.descripcion}`)
        return it
      }
      return { ...it, cantidad: nueva }
    }).filter(Boolean))
  }

  const total = items.reduce((s, i) => s + (i.precioUnitario * i.cantidad), 0)

  // En hostal: si hay habitación seleccionada, necesita tarifa; si no, basta con items.
  const puedeConfirmar = modo === 'hostal'
    ? (habitacionSel ? !!tarifaSel : items.length > 0)
    : items.length > 0

  const cargarAEstadia = async () => {
    if (!estadiaSel || items.length === 0) return
    setLoading(true)
    try {
      const cargos = items.map(i => ({
        tipo: i.tipo === 'habitacion' ? 'producto' : i.tipo,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      }))
      await agregarCargosBatch(estadiaSel.id, cargos)
      toast.success(`${items.length} ítem${items.length > 1 ? 's' : ''} cargado${items.length > 1 ? 's' : ''} a Hab. ${estadiaSel.habitacionNumero}`)
      navigate('/estadias')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al cargar a estadía')
    } finally {
      setLoading(false)
    }
  }

  const confirmarVenta = async (tipoDte, receptor, pago, pagoAlSalir = false) => {
    if (!puedeConfirmar) return
    setLoading(true)
    try {
      const payload = {
        tipoVenta: modo,
        tipoDte: pagoAlSalir ? 'boleta' : tipoDte,
        items: items.map(i => ({ ...i })),
        ...(modo === 'hostal' && habitacionSel ? {
          habitacionId: habitacionSel.id,
          duracion: tarifaSel?.duracion,
          earlyCheckin: earlyCheckinVal,
          cantidadNoches: esNoche(tarifaSel?.duracion) ? cantidadNoches : 1,
        } : {}),
        ...(receptor ? {
          receptorRut: receptor.rut,
          receptorRazon: receptor.razon,
          receptorGiro: receptor.giro,
          receptorDireccion: receptor.direccion,
          receptorComuna: receptor.comuna,
          receptorCiudad: receptor.ciudad,
          receptorEmail: receptor.email,
        } : {}),
        ...(pago ? {
          metodoPago: pago.metodoPago,
          montoPagado: pago.montoPagado,
          codigoTransaccion: pago.codigoTransaccion,
        } : {}),
        ...(pagoAlSalir ? { pagoAlSalir: true } : {})
      }
      const res = await crearVenta(payload)
      if (pagoAlSalir) {
        toast.success(`Estadía activa creada — Hab. ${habitacionSel.numero}`)
        navigate('/estadias')
        return
      }
      toast.success(modo === 'hostal' && habitacionSel
        ? `Venta registrada — Hab. ${habitacionSel.numero}`
        : `Venta registrada — $${total.toLocaleString('es-CL')}`)
      setVentaConfirmada(res.data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear venta')
    } finally {
      setLoading(false)
    }
  }

  const tarifaVigenteHoy = useMemo(() => {
    if (!habitacionSel?.tarifasTemporada?.length) return null
    const hoy = new Date().toISOString().split('T')[0]
    return habitacionSel.tarifasTemporada
      .filter(t => t.fechaDesde <= hoy && t.fechaHasta >= hoy)
      .sort((a, b) => Number(b.precio) - Number(a.precio))[0] || null
  }, [habitacionSel])

  const categorias = [...new Set(productos.map(p => p.categoria))]

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Selector de modo */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Nueva Venta</h1>
          <div className="inline-flex p-1 bg-card border border-border rounded-xl">
            <button
              onClick={() => cambiarModo('hostal')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                modo === 'hostal' ? 'bg-accent text-white' : 'text-muted hover:text-gray-200'
              }`}
            >
              🏨 Hostal
            </button>
            <button
              onClick={() => cambiarModo('minimarket')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                modo === 'minimarket' ? 'bg-accent text-white' : 'text-muted hover:text-gray-200'
              }`}
            >
              🏪 Minimarket
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Escáner (solo minimarket) */}
            {modo === 'minimarket' && (
              <div className="card border-accent/40 bg-accent/5">
                <label className="text-xs uppercase tracking-wider text-accent mb-2 block flex items-center gap-2">
                  <span>📷</span> Escanear código de barras
                </label>
                <input
                  ref={scannerRef}
                  className="input bg-black/40 text-xl font-mono tracking-wider text-center"
                  placeholder="Apuntá la pistola al código..."
                  value={codigoBarras}
                  onChange={e => setCodigoBarras(e.target.value)}
                  onKeyDown={escanearCodigo}
                  autoFocus
                />
                <p className="text-xs text-muted mt-1.5 text-center">
                  La pistola escribe el código y presiona Enter automáticamente
                </p>
              </div>
            )}

            {/* Habitaciones (solo hostal) */}
            {modo === 'hostal' && (
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
                    {/* Selector de noches (solo tarifa noche) */}
                    {esNoche(tarifaSel?.duracion) && (
                      <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="text-xs font-semibold text-accent mb-2">Cantidad de noches</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => cambiarNoches(-1)}
                            className="w-8 h-8 rounded border border-border hover:border-accent text-muted hover:text-white font-bold"
                          >−</button>
                          <span className="text-xl font-bold tabular-nums w-8 text-center">{cantidadNoches}</span>
                          <button
                            onClick={() => cambiarNoches(+1)}
                            className="w-8 h-8 rounded border border-border hover:border-accent text-muted hover:text-white font-bold"
                          >+</button>
                          <span className="text-sm text-muted ml-2">
                            → Salida: {(() => {
                              const d = new Date()
                              d.setDate(d.getDate() + cantidadNoches)
                              return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
                            })()}
                          </span>
                        </div>
                      </div>
                    )}

                    {tarifaVigenteHoy && (
                      <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm font-semibold text-yellow-400">
                          ★ Temporada activa: {tarifaVigenteHoy.label}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Precio temporada: <span className="font-bold text-yellow-300">${Number(tarifaVigenteHoy.precio).toLocaleString('es-CL')}/noche</span>
                          {' — '}verificar con administración antes de confirmar
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Productos */}
            <div className="card">
              <h2 className="font-semibold mb-3">
                {modo === 'hostal' ? '2. Agregar Productos (opcional)' : 'Productos'}
              </h2>
              {categorias.map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-xs text-muted mb-2 uppercase tracking-wider">{cat}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {productos.filter(p => p.categoria === cat).map(p => {
                      const sinStock = p.stock != null && p.stock <= 0
                      const bajoStock = p.stock != null && p.stock > 0 && p.stock <= (p.stockMinimo || 0)
                      return (
                        <button
                          key={p.id}
                          onClick={() => agregarProducto(p)}
                          disabled={sinStock}
                          className={`p-3 border rounded-lg transition-all text-left relative ${
                            sinStock
                              ? 'border-red-900/40 bg-red-950/20 opacity-60 cursor-not-allowed'
                              : 'border-border hover:border-accent hover:bg-accent/5'
                          }`}
                        >
                          <span className="text-xl">{p.icono}</span>
                          <div className="text-sm font-medium mt-1 leading-tight">{p.nombre}</div>
                          <div className="text-xs text-green-400 font-bold">${Number(p.precio).toLocaleString('es-CL')}</div>
                          {p.stock != null && (
                            <div className={`text-[10px] mt-1 font-mono ${
                              sinStock ? 'text-red-400' : bajoStock ? 'text-yellow-400' : 'text-muted'
                            }`}>
                              {sinStock ? 'Sin stock' : `${p.stock} disp.`}
                            </div>
                          )}
                        </button>
                      )
                    })}
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

          {/* Carrito derecho */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="font-semibold mb-4 flex items-center justify-between">
                <span>Resumen</span>
                <span className="text-xs text-muted font-normal">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
              </h2>

              {items.length === 0 ? (
                <p className="text-muted text-sm text-center py-6">
                  {modo === 'hostal' ? 'Selecciona una habitación' : 'Escaneá o agregá productos'}
                </p>
              ) : (
                <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm border-b border-border/30 pb-2 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {item.esLibre && <span className="text-[10px] bg-yellow-900/40 text-yellow-400 px-1 rounded">LIBRE</span>}
                          <span className="truncate">{item.descripcion}</span>
                        </div>
                        {item.tipo !== 'habitacion' && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <button onClick={() => ajustarCantidad(i, -1)} className="w-6 h-6 rounded border border-border hover:border-accent text-muted hover:text-white text-xs">−</button>
                            <span className="text-xs tabular-nums w-6 text-center">{item.cantidad}</span>
                            <button onClick={() => ajustarCantidad(i, +1)} className="w-6 h-6 rounded border border-border hover:border-accent text-muted hover:text-white text-xs">+</button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400 font-semibold whitespace-nowrap tabular-nums">
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
                  <span className="text-green-400 tabular-nums">${total.toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Cargar a estadía activa */}
              {estadias.length > 0 && items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted mb-1.5">Cargar a estadía activa</p>
                  <select
                    value={estadiaSel?.id || ''}
                    onChange={e => {
                      const sel = estadias.find(s => s.id === e.target.value)
                      setEstadiaSel(sel || null)
                    }}
                    className="input w-full text-sm"
                  >
                    <option value="">— Nueva venta independiente —</option>
                    {estadias.map(e => (
                      <option key={e.id} value={e.id}>
                        Hab. {e.habitacionNumero} {e.habitacionTipo && `(${e.habitacionTipo})`}{e.huespedNombre ? ` · ${e.huespedNombre}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {estadiaSel ? (
                <button
                  onClick={cargarAEstadia}
                  disabled={loading || items.length === 0}
                  className="w-full mt-3 py-3 text-base rounded-lg font-medium border border-dashed border-accent/60 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando…' : `➕ Cargar a Hab. ${estadiaSel.habitacionNumero}`}
                </button>
              ) : (
                <button
                  onClick={handleConfirmarClick}
                  disabled={!puedeConfirmar || loading}
                  className="btn-primary w-full mt-4 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : 'Confirmar Venta'}
                </button>
              )}

              {!estadiaSel && modo === 'hostal' && habitacionSel && tarifaSel && (
                <button
                  onClick={() => confirmarVenta(null, null, null, true)}
                  disabled={loading}
                  className="w-full mt-2 py-2.5 text-sm rounded-lg font-medium border border-dashed border-green-700/60 text-green-400 hover:bg-green-950/30 transition-colors disabled:opacity-50"
                >
                  🏠 Estadía activa — pago al salir
                </button>
              )}

              {!estadiaSel && modo === 'hostal' && esNoche(tarifaSel?.duracion) && new Date().getHours() < 12 && (
                <p className="text-xs text-yellow-500/70 mt-2 text-center">
                  Llegada temprana — se consultará por early check-in
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmarModo && (
        <ModalConfirmar
          titulo="¿Cambiar de modo?"
          mensaje="Los ítems del carrito se descartarán."
          textoBtn="Sí, cambiar"
          variante="normal"
          onConfirmar={() => {
            const nuevo = confirmarModo
            setConfirmarModo(null)
            setModo(nuevo)
            setHabitacionSel(null); setTarifaSel(null)
            setItems([]); setEarlyCheckinVal(null)
            setCantidadNoches(1); setEstadiaSel(null)
          }}
          onCancelar={() => setConfirmarModo(null)}
        />
      )}

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
          onConfirmar={(tipo, receptor, pago) => { setShowModal(false); confirmarVenta(tipo, receptor, pago) }}
          onCancelar={() => setShowModal(false)}
        />
      )}

      {ventaConfirmada && (
        <ComprobanteVenta
          venta={{ ...ventaConfirmada, cajero: ventaConfirmada.cajero || sesion?.nombre }}
          onCerrar={() => { setVentaConfirmada(null); navigate('/dashboard') }}
          onContinuar={() => { setVentaConfirmada(null); navigate('/dashboard') }}
        />
      )}
    </div>
  )
}
