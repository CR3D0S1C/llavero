import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const sesion = localStorage.getItem('llavero_sesion')
  if (sesion) {
    const { token } = JSON.parse(sesion)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const esLogin = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !esLogin) {
      const tenia = !!localStorage.getItem('llavero_sesion')
      localStorage.removeItem('llavero_sesion')
      if (tenia) {
        sessionStorage.setItem('llavero_sesion_invalidada', '1')
      }
      window.location.href = '/llavero/'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login              = (nombre, pin) => api.post('/auth/login', { nombre, pin })
export const logout             = () => api.post('/auth/logout')
export const getUsuariosPublicos = () => api.get('/auth/usuarios')

// Habitaciones
export const getHabitaciones = () => api.get('/habitaciones')
export const getTiposHabitacion = () => api.get('/habitaciones/tipos')
export const crearTipoHabitacion = (data) => api.post('/habitaciones/tipos', data)
export const actualizarTipoHabitacion = (id, data) => api.put(`/habitaciones/tipos/${id}`, data)
export const eliminarTipoHabitacion = (id) => api.delete(`/habitaciones/tipos/${id}`)
export const crearTarifaTemporada = (tipoId, data) => api.post(`/habitaciones/tipos/${tipoId}/tarifas`, data)
export const actualizarTarifaTemporada = (tipoId, tarifaId, data) => api.put(`/habitaciones/tipos/${tipoId}/tarifas/${tarifaId}`, data)
export const eliminarTarifaTemporada = (tipoId, tarifaId) => api.delete(`/habitaciones/tipos/${tipoId}/tarifas/${tarifaId}`)
export const buscarHabitacionPorCodigo = (codigo) => api.get(`/habitaciones/buscar/${encodeURIComponent(codigo)}`)
export const crearHabitacion = (data) => api.post('/habitaciones', data)
export const updateHabitacion = (id, data) => api.put(`/habitaciones/${id}`, data)
export const eliminarHabitacion = (id) => api.delete(`/habitaciones/${id}`)
export const liberarHabitacion = (id) => api.put(`/habitaciones/${id}/liberar`)
export const operarHabitacion = (id, estado, clave) => api.put(`/habitaciones/${id}/operar`, { estado, clave })
export const cambiarEstadoJefe = (id, estado) => api.put(`/habitaciones/${id}/estado`, { estado })
export const getHabitacionLog = () => api.get('/habitaciones/log')
export const subirFotoHabitacion = (id, formData) => api.post(`/habitaciones/${id}/fotos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const setPortadaFoto = (habId, fotoId) => api.put(`/habitaciones/${habId}/fotos/${fotoId}/portada`)
export const eliminarFotoHabitacion = (habId, fotoId) => api.delete(`/habitaciones/${habId}/fotos/${fotoId}`)

// Ventas
export const getVentas = (params) => api.get('/ventas', { params })
export const crearVenta = (data) => api.post('/ventas', data)
export const eliminarVenta = (id) => api.delete(`/ventas/${id}`)
export const anularVenta = (id, clave) => api.post(`/ventas/${id}/anular`, { clave })

// Productos
export const getProductos = () => api.get('/productos')
export const buscarProductoPorCodigo = (codigo) => api.get(`/productos/buscar/${encodeURIComponent(codigo)}`)
export const crearProducto = (data) => api.post('/productos', data)
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data)
export const eliminarProducto = (id) => api.delete(`/productos/${id}`)
export const ingresoStock = (id, data) => api.post(`/productos/${id}/stock/entrada`, data)
export const ajustarStock = (id, data) => api.post(`/productos/${id}/stock/ajuste`, data)
export const getMovimientosProducto = (id) => api.get(`/productos/${id}/movimientos`)
export const getMovimientosRecientes = () => api.get('/productos/movimientos')

// Turnos
export const getTurnoActivo = () => api.get('/turnos/activo')
export const getResumenTurno = () => api.get('/turnos/activo/resumen')
export const cerrarTurno = (arqueo) => api.post('/turnos/cerrar', arqueo)
export const getTurnosHoy = () => api.get('/turnos/hoy')

// DTE
export const getDtePendientes = () => api.get('/dte/pendientes')
export const getDteTodos = () => api.get('/dte/todos')
export const marcarDteEmitido = (id) => api.put(`/dte/${id}/emitido`)
export const marcarDteError = (id, mensaje) => api.put(`/dte/${id}/error`, { mensaje })

// Reservas (admin/staff)
export const getReservas           = () => api.get('/admin/reservas')
export const crearReservaAdmin     = (data) => api.post('/admin/reservas', data)
export const confirmarReserva      = (id, body = {}) => api.put(`/admin/reservas/${id}/confirmar`, body)
export const completarReserva      = (id) => api.put(`/admin/reservas/${id}/completar`)
export const cancelarReservaAdmin  = (id) => api.put(`/admin/reservas/${id}/cancelar`)
export const checkinReserva        = (id) => api.post(`/admin/reservas/${id}/checkin`)
export const getReservasProximas   = () => api.get('/staff/reservas/proximas')

// Estadías activas
export const getEstadiasActivas   = () => api.get('/admin/estadias')
export const agregarCargo         = (ventaId, data) => api.post(`/admin/estadias/${ventaId}/cargo`, data)
export const agregarCargosBatch   = (ventaId, items) => api.post(`/admin/estadias/${ventaId}/cargos-batch`, items)
export const checkoutEstadia      = (ventaId, data) => api.post(`/admin/estadias/${ventaId}/checkout`, data)

// Aseo — panel del jefe
export const getAseoPanel        = (fecha) => api.get('/aseo/panel', { params: { fecha: fecha || '' } })
export const getAseoPersonal     = () => api.get('/aseo/personal')
export const crearAsignacionAseo = (data) => api.post('/aseo/asignaciones', data)
export const actualizarAsignacionAseo = (id, data) => api.put(`/aseo/asignaciones/${id}`, data)
export const eliminarAsignacionAseo   = (id) => api.delete(`/aseo/asignaciones/${id}`)

// Aseo — vista de la mucama (usa aseoApi con sesión separada en sessionStorage)
export const getMisAsignaciones  = (fecha) => api.get('/aseo/mis-asignaciones', { params: { fecha: fecha || '' } })
export const iniciarAsignacion   = (id) => api.put(`/aseo/asignaciones/${id}/iniciar`)
export const completarAsignacion = (id) => api.put(`/aseo/asignaciones/${id}/completar`)

// Admin
export const getMetricas        = () => api.get('/admin/metricas')
export const getEstadoActual    = () => api.get('/admin/estado-actual')
export const getEstadisticas    = () => api.get('/admin/estadisticas')
export const getReporte         = (desde, hasta, tipo = 'todos') => api.get('/admin/reporte', { params: { desde, hasta, tipo } })
export const enviarResumenDia   = () => api.post('/admin/resumen-dia/enviar')
export const getUsuarios        = () => api.get('/admin/usuarios')
export const crearUsuario       = (data) => api.post('/admin/usuarios', data)
export const editarUsuario      = (id, data) => api.put(`/admin/usuarios/${id}`, data)
export const desactivarUsuario  = (id) => api.delete(`/admin/usuarios/${id}`)

export default api
