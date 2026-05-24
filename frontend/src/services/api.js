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
    if (err.response?.status === 401) {
      localStorage.removeItem('llavero_sesion')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (nombre, pin) => api.post('/auth/login', { nombre, pin })
export const logout = () => api.post('/auth/logout')

// Habitaciones
export const getHabitaciones = () => api.get('/habitaciones')
export const getTiposHabitacion = () => api.get('/habitaciones/tipos')
export const crearHabitacion = (data) => api.post('/habitaciones', data)
export const updateHabitacion = (id, data) => api.put(`/habitaciones/${id}`, data)
export const eliminarHabitacion = (id) => api.delete(`/habitaciones/${id}`)
export const liberarHabitacion = (id) => api.put(`/habitaciones/${id}/liberar`)
export const operarHabitacion = (id, estado, clave) => api.put(`/habitaciones/${id}/operar`, { estado, clave })
export const cambiarEstadoJefe = (id, estado) => api.put(`/habitaciones/${id}/estado`, { estado })
export const getHabitacionLog = () => api.get('/habitaciones/log')

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

// Admin
export const getMetricas = () => api.get('/admin/metricas')

export default api
