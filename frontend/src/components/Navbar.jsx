import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { logout } from '../services/api'
import { toast } from '../utils/toast'

const links = [
  { to: '/dashboard',   label: 'Dashboard',   icon: '📊' },
  { to: '/nueva-venta', label: 'Nueva Venta', icon: '💰' },
  { to: '/historial',   label: 'Historial',   icon: '📋' },
  { to: '/productos',   label: 'Productos',   icon: '📦' },
  { to: '/cierre-turno',label: 'Cierre',      icon: '🔒' },
]

const linksJefe = [
  { to: '/gestion', label: 'Gestión', icon: '🏨' },
  { to: '/dte',     label: 'DTEs',    icon: '🧾' },
  { to: '/admin',   label: 'Admin',   icon: '⚙️' },
]

export default function Navbar() {
  const { sesion, logout: logoutCtx } = useSesion()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    logoutCtx()
    toast.info('Sesión cerrada')
    navigate('/')
  }

  const allLinks = sesion?.rol === 'jefe' ? [...links, ...linksJefe] : links

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
    }`

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-accent font-bold text-lg shrink-0">🔑 Llavero</span>

        {/* Desktop: links inline con scroll horizontal si es necesario */}
        <div className="hidden md:flex gap-1 flex-1 overflow-x-auto scrollbar-hide ml-4">
          {allLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="mr-1">{link.icon}</span>{link.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile: botón hamburguesa */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden ml-auto text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
          aria-label="Menú"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Usuario + salir */}
        <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
          <span className="text-sm text-muted">
            {sesion?.nombre}
            <span className={`ml-1 text-xs ${sesion?.rol === 'jefe' ? 'text-accent' : 'text-gray-500'}`}>
              ({sesion?.rol})
            </span>
          </span>
          <button onClick={handleLogout} className="btn-ghost text-sm py-1 px-3">
            Salir
          </button>
        </div>
      </div>

      {/* Mobile: panel desplegable */}
      {menuOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-1 animate-fade-in">
          {allLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <span className="mr-2">{link.icon}</span>{link.label}
            </NavLink>
          ))}
          <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
            <span className="text-sm text-muted">
              {sesion?.nombre}
              <span className={`ml-1 text-xs ${sesion?.rol === 'jefe' ? 'text-accent' : 'text-gray-500'}`}>
                ({sesion?.rol})
              </span>
            </span>
            <button onClick={handleLogout} className="btn-ghost text-sm py-1 px-3">
              Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
