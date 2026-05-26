import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { huesped, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-900 tracking-tight">
          Hostal
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link to="/habitaciones" className="text-gray-600 hover:text-gray-900 transition-colors">
            Habitaciones
          </Link>

          {huesped ? (
            <>
              <Link to="/mis-reservas" className="text-gray-600 hover:text-gray-900 transition-colors">
                Mis reservas
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700 font-medium">{huesped.nombre}</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
