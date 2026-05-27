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
