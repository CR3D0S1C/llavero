import { NavLink, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { logout } from '../services/api'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/nueva-venta', label: 'Nueva Venta', icon: '💰' },
  { to: '/historial', label: 'Historial', icon: '📋' },
  { to: '/productos', label: 'Productos', icon: '📦' },
  { to: '/cierre-turno', label: 'Cierre', icon: '🔒' },
]

const linksJefe = [
  { to: '/dte', label: 'DTEs', icon: '🧾' },
  { to: '/admin', label: 'Admin', icon: '⚙️' },
]

export default function Navbar() {
  const { sesion, logout: logoutCtx } = useSesion()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    logoutCtx()
    navigate('/')
  }

  const allLinks = sesion?.rol === 'jefe' ? [...links, ...linksJefe] : links

  return (
    <nav className="bg-card border-b border-border px-4 py-3 flex items-center gap-2 sticky top-0 z-50">
      <span className="text-accent font-bold text-lg mr-4">🔑 Llavero</span>

      <div className="flex gap-1 flex-1 flex-wrap">
        {allLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            <span className="mr-1">{link.icon}</span>{link.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <span className="text-sm text-muted hidden sm:block">
          {sesion?.nombre}
          <span className={`ml-1 text-xs ${sesion?.rol === 'jefe' ? 'text-accent' : 'text-gray-500'}`}>
            ({sesion?.rol})
          </span>
        </span>
        <button onClick={handleLogout} className="btn-ghost text-sm py-1 px-3">
          Salir
        </button>
      </div>
    </nav>
  )
}
