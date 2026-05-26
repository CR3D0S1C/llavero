import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('huesped_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const publicApi = {
  getHabitaciones: () => api.get('/public/habitaciones'),
  getHabitacion: (id) => api.get(`/public/habitaciones/${id}`),
  verificarDisponibilidad: (habitacionId, fechaEntrada, fechaSalida) =>
    api.get('/public/disponibilidad', { params: { habitacionId, fechaEntrada, fechaSalida } }),
  register: (data) => api.post('/public/register', data),
  login: (data) => api.post('/public/login', data),
}

export const bookingApi = {
  crearReserva: (data) => api.post('/booking/reservas', data),
  misReservas: () => api.get('/booking/reservas'),
  cancelarReserva: (id) => api.delete(`/booking/reservas/${id}`),
}

export default api
