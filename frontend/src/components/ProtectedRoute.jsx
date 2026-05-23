import { Navigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'

export default function ProtectedRoute({ children, soloJefe = false }) {
  const { sesion } = useSesion()

  if (!sesion) return <Navigate to="/" replace />
  if (soloJefe && sesion.rol !== 'jefe') return <Navigate to="/dashboard" replace />

  return children
}
