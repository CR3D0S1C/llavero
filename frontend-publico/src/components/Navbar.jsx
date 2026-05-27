import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { huesped, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const glass = isHome && !scrolled

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: glass ? 'transparent' : 'rgba(245,239,230,0.96)',
        backdropFilter: glass ? 'none' : 'blur(12px)',
        borderBottom: glass ? 'none' : '1px solid #DDD0C0',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: '72px' }}>

        {/* Logo */}
        <Link
          to="/"
          className="font-heading transition-colors duration-300"
          style={{
            fontSize: '1.375rem',
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: glass ? '#fff' : '#1C4A5A',
          }}
        >
          Hostal Mi Maravilla
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/habitaciones"
            className="transition-colors duration-300"
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: glass ? 'rgba(255,255,255,0.75)' : '#6B6057',
            }}
            onMouseEnter={e => e.target.style.color = glass ? '#fff' : '#1C4A5A'}
            onMouseLeave={e => e.target.style.color = glass ? 'rgba(255,255,255,0.75)' : '#6B6057'}
          >
            Habitaciones
          </Link>

          {huesped ? (
            <>
              <Link
                to="/mis-reservas"
                className="transition-colors duration-300"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: glass ? 'rgba(255,255,255,0.75)' : '#6B6057',
                }}
                onMouseEnter={e => e.target.style.color = glass ? '#fff' : '#1C4A5A'}
                onMouseLeave={e => e.target.style.color = glass ? 'rgba(255,255,255,0.75)' : '#6B6057'}
              >
                Mis reservas
              </Link>
              <span style={{ fontSize: '11px', color: glass ? 'rgba(255,255,255,0.45)' : '#DDD0C0' }}>|</span>
              <span style={{ fontSize: '12px', color: glass ? 'rgba(255,255,255,0.65)' : '#6B6057', fontWeight: 300 }}>
                {huesped.nombre.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="transition-all duration-200"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '8px 18px',
                  border: glass ? '1px solid rgba(255,255,255,0.3)' : '1px solid #DDD0C0',
                  color: glass ? 'rgba(255,255,255,0.8)' : '#6B6057',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = glass ? '#fff' : '#1C4A5A'
                  e.target.style.color = glass ? '#fff' : '#1C4A5A'
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = glass ? 'rgba(255,255,255,0.3)' : '#DDD0C0'
                  e.target.style.color = glass ? 'rgba(255,255,255,0.8)' : '#6B6057'
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="transition-colors duration-300"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: glass ? 'rgba(255,255,255,0.75)' : '#6B6057',
                }}
                onMouseEnter={e => e.target.style.color = glass ? '#fff' : '#1C4A5A'}
                onMouseLeave={e => e.target.style.color = glass ? 'rgba(255,255,255,0.75)' : '#6B6057'}
              >
                Entrar
              </Link>
              <Link
                to="/registro"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  padding: '10px 22px',
                  background: glass ? 'rgba(255,255,255,0.12)' : '#1C4A5A',
                  border: glass ? '1px solid rgba(255,255,255,0.35)' : '1px solid #1C4A5A',
                  color: '#fff',
                  backdropFilter: glass ? 'blur(4px)' : 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.22)' : '#1E1E1E'
                  e.currentTarget.style.borderColor = glass ? 'rgba(255,255,255,0.55)' : '#1E1E1E'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.12)' : '#1C4A5A'
                  e.currentTarget.style.borderColor = glass ? 'rgba(255,255,255,0.35)' : '#1C4A5A'
                }}
              >
                Reservar
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-end gap-[5px] w-8 h-8"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span
            className="block transition-all duration-300 h-px"
            style={{
              width: '24px',
              background: glass ? '#fff' : '#1E1E1E',
              transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }}
          />
          <span
            className="block transition-all duration-300 h-px"
            style={{
              width: menuOpen ? '0' : '16px',
              background: glass ? '#fff' : '#1E1E1E',
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block transition-all duration-300 h-px"
            style={{
              width: '24px',
              background: glass ? '#fff' : '#1E1E1E',
              transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: menuOpen ? '280px' : '0',
          background: 'rgba(245,239,230,0.98)',
          backdropFilter: 'blur(12px)',
          borderTop: menuOpen ? '1px solid #DDD0C0' : 'none',
        }}
      >
        <div className="px-6 py-5 space-y-1">
          <Link to="/habitaciones" className="block py-3 border-b border-line/50"
            style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6057' }}>
            Habitaciones
          </Link>
          {huesped ? (
            <>
              <Link to="/mis-reservas" className="block py-3 border-b border-line/50"
                style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6057' }}>
                Mis reservas
              </Link>
              <button onClick={handleLogout} className="block py-3 w-full text-left"
                style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B5533E' }}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-3 border-b border-line/50"
                style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6057' }}>
                Entrar
              </Link>
              <Link to="/registro" className="block py-3"
                style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1C4A5A', fontWeight: 500 }}>
                Reservar →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
