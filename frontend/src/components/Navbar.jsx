import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { logout } from '../services/api'
import { toast } from '../utils/toast'
import { nombreClave } from '../utils/nombre'

// Visibles para todos
const linksComunes = [
  { to: '/dashboard',   label: 'Dashboard',   icon: '📊' },
  { to: '/nueva-venta', label: 'Nueva Venta', icon: '💰' },
  { to: '/historial',   label: 'Historial',   icon: '📋' },
  { to: '/cierre-turno',label: 'Cierre',      icon: '🔒' },
]

// Agrupado bajo el dropdown "Administración" (solo jefe)
const linksAdmin = [
  { to: '/reservas',    label: 'Reservas Online',         icon: '📅', desc: 'Confirmar y gestionar reservas' },
  { to: '/estadias',    label: 'Estadías Activas',        icon: '🏠', desc: 'Huéspedes en curso, cargos y check-out' },
  { to: '/gestion',     label: 'Gestión de habitaciones', icon: '🏨', desc: 'Estados y log de cambios' },
  { to: '/tipos',       label: 'Tipos de habitación',     icon: '🏷️', desc: 'Categorías, amenidades y colores' },
  { to: '/habitaciones',label: 'Configurar habitaciones', icon: '🛏️', desc: 'Agregar, eliminar, editar precios' },
  { to: '/productos',   label: 'Productos',               icon: '📦', desc: 'Catálogo, precios e iconos' },
  { to: '/inventario',  label: 'Inventario',              icon: '📥', desc: 'Stock, ingresos y movimientos' },
  { to: '/dte',         label: 'DTEs SII',                icon: '🧾', desc: 'Boletas y facturas pendientes' },
  { to: '/admin',       label: 'Métricas',                icon: '📈', desc: 'Resumen general del negocio' },
  { to: '/estadisticas',label: 'Estadísticas',            icon: '📊', desc: 'Ocupación, ingresos por tipo y temporada' },
  { to: '/reporte',     label: 'Reporte de ventas',       icon: '📑', desc: 'Filtrar por fecha, exportar CSV' },
  { to: '/panel-aseo', label: 'Panel de Aseo',            icon: '🧹', desc: 'Asignación de habitaciones al personal' },
  { to: '/usuarios',   label: 'Usuarios',                icon: '👤', desc: 'Cajeros, mucamas y administradores' },
]

export default function Navbar() {
  const { sesion, logout: logoutCtx } = useSesion()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const esJefe = sesion?.rol === 'jefe'

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    logoutCtx()
    toast.info('Sesión cerrada')
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
    }`

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center gap-2">
        <NavLink to="/dashboard" className="text-accent font-bold text-lg shrink-0 hover:text-accent-hover">
          🔑 Llavero
        </NavLink>

        {/* Desktop: links inline + dropdown admin */}
        <div className="hidden md:flex gap-1 flex-1 ml-4 items-center">
          {linksComunes.map(link => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="mr-1">{link.icon}</span>{link.label}
            </NavLink>
          ))}
          {esJefe && <AdminDropdown />}
        </div>

        {/* Mobile: botón hamburguesa */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden ml-auto text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
          aria-label="Menú"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Usuario + salir (desktop) */}
        <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
          <span className="text-sm text-muted">
            {nombreClave(sesion?.nombre)}
            <span className={`ml-1 text-xs ${esJefe ? 'text-accent' : 'text-gray-500'}`}>
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
        <div className="md:hidden border-t border-border px-4 py-3 space-y-1 animate-fade-in max-h-[80vh] overflow-y-auto">
          {linksComunes.map(link => (
            <MobileLink key={link.to} link={link} onClick={() => setMenuOpen(false)} />
          ))}

          {esJefe && (
            <>
              <p className="text-xs uppercase tracking-wider text-muted mt-4 mb-2 px-3">Administración</p>
              {linksAdmin.map(link => (
                <MobileLink key={link.to} link={link} onClick={() => setMenuOpen(false)} />
              ))}
            </>
          )}

          <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
            <span className="text-sm text-muted">
              {sesion?.nombre}
              <span className={`ml-1 text-xs ${esJefe ? 'text-accent' : 'text-gray-500'}`}>
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

function MobileLink({ link, onClick }) {
  return (
    <NavLink
      to={link.to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`
      }
    >
      <span className="mr-2">{link.icon}</span>{link.label}
    </NavLink>
  )
}

function AdminDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cerrar al cambiar de ruta
  useEffect(() => { setOpen(false) }, [location.pathname])

  const activo = linksAdmin.some(l => location.pathname === l.to)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
          activo || open
            ? 'bg-accent/20 text-accent'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`}
      >
        <span>⚙️</span>
        <span>Administración</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl py-2 animate-fade-in">
          {linksAdmin.map(link => (
            <button
              key={link.to}
              onClick={() => { navigate(link.to); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                location.pathname === link.to
                  ? 'bg-accent/15 text-accent'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{link.label}</div>
                <div className="text-xs text-muted truncate">{link.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
