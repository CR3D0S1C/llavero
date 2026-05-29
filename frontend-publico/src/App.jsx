import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import HabitacionesPage from './pages/HabitacionesPage'
import HabitacionDetallePage from './pages/HabitacionDetallePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MisReservasPage from './pages/MisReservasPage'

// Número WhatsApp del hostal (formato internacional sin +, sin espacios)
const WA_NUMERO = '56950455726'
const WA_MENSAJE = encodeURIComponent('Hola! Quisiera consultar disponibilidad en Hostal Mi Maravilla.')

function BtnWhatsApp() {
  return (
    <a
      href={`https://wa.me/${WA_NUMERO}?text=${WA_MENSAJE}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Consultar por WhatsApp"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.4)' }}
    >
      <svg width="28" height="28" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.5L4 29l7.697-1.805A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10c-1.88 0-3.64-.52-5.145-1.425l-.36-.215-4.572 1.072 1.1-4.457-.23-.372A9.96 9.96 0 016 15c0-5.523 4.477-10 10-10zm-3.5 5c-.28 0-.735.105-1.12.525C10.995 10.945 10 12.04 10 13.5c0 1.47 1.02 2.89 1.16 3.09.14.195 2.015 3.08 4.88 4.32 2.865 1.24 2.865.825 3.38.775.515-.05 1.66-.68 1.895-1.335.235-.655.235-1.215.165-1.335-.07-.12-.26-.19-.545-.335-.285-.145-1.66-.82-1.915-.915-.255-.095-.44-.145-.625.145-.185.285-.715.915-.875 1.1-.16.185-.32.21-.595.07-.285-.145-1.195-.44-2.275-1.405-.84-.75-1.41-1.675-1.575-1.96-.165-.285-.018-.44.125-.58.128-.127.285-.335.428-.5.14-.165.188-.285.283-.475.094-.19.047-.355-.024-.5-.07-.145-.625-1.51-.86-2.07C13.085 10.14 12.78 10 12.5 10z"/>
      </svg>
    </a>
  )
}

function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F5EFE6', width: '100%' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: isHome ? 0 : '72px', width: '100%' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/habitaciones" element={<HabitacionesPage />} />
          <Route path="/habitaciones/:id" element={<HabitacionDetallePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/mis-reservas" element={<MisReservasPage />} />
        </Routes>
      </main>
      <Footer />
      <BtnWhatsApp />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  )
}
