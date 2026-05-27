import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SesionProvider } from './context/SesionContext'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/ToastContainer'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Habitaciones from './pages/Habitaciones'
import NuevaVenta from './pages/NuevaVenta'
import Historial from './pages/Historial'
import Productos from './pages/Productos'
import CierreTurno from './pages/CierreTurno'
import Admin from './pages/Admin'
import DtePendientes from './pages/DtePendientes'
import GestionHabitaciones from './pages/GestionHabitaciones'
import Inventario from './pages/Inventario'
import GestionUsuarios from './pages/GestionUsuarios'
import Reservas from './pages/Reservas'

export default function App() {
  return (
    <SesionProvider>
      <ToastContainer />
      <BrowserRouter basename="/llavero">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/habitaciones" element={<ProtectedRoute><Habitaciones /></ProtectedRoute>} />
          <Route path="/nueva-venta" element={<ProtectedRoute><NuevaVenta /></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
          <Route path="/cierre-turno" element={<ProtectedRoute><CierreTurno /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute soloJefe><Admin /></ProtectedRoute>} />
          <Route path="/dte" element={<ProtectedRoute soloJefe><DtePendientes /></ProtectedRoute>} />
          <Route path="/gestion" element={<ProtectedRoute soloJefe><GestionHabitaciones /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute soloJefe><Inventario /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute soloJefe><GestionUsuarios /></ProtectedRoute>} />
          <Route path="/reservas" element={<ProtectedRoute soloJefe><Reservas /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </SesionProvider>
  )
}
