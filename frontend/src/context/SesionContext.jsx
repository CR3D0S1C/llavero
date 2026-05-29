import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SesionContext = createContext(null)

const TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 horas

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    const guardado = localStorage.getItem('llavero_sesion')
    if (!guardado) return null
    const datos = JSON.parse(guardado)
    // Verificar expiración al cargar
    if (datos.loginAt && Date.now() - datos.loginAt > TIMEOUT_MS) {
      localStorage.removeItem('llavero_sesion')
      sessionStorage.setItem('llavero_sesion_invalidada', '1')
      return null
    }
    return datos
  })

  const logout = useCallback((porTimeout = false) => {
    localStorage.removeItem('llavero_sesion')
    if (porTimeout) sessionStorage.setItem('llavero_sesion_expirada', '1')
    setSesion(null)
  }, [])

  // Chequeo periódico cada minuto
  useEffect(() => {
    if (!sesion) return
    const interval = setInterval(() => {
      const guardado = localStorage.getItem('llavero_sesion')
      if (!guardado) return
      const datos = JSON.parse(guardado)
      if (datos.loginAt && Date.now() - datos.loginAt > TIMEOUT_MS) {
        logout(true)
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [sesion, logout])

  const login = (datos) => {
    const conTimestamp = { ...datos, loginAt: Date.now() }
    localStorage.setItem('llavero_sesion', JSON.stringify(conTimestamp))
    setSesion(conTimestamp)
  }

  const actualizarTurno = (turnoId) => {
    if (sesion) {
      const nueva = { ...sesion, turnoId }
      localStorage.setItem('llavero_sesion', JSON.stringify(nueva))
      setSesion(nueva)
    }
  }

  return (
    <SesionContext.Provider value={{ sesion, login, logout, actualizarTurno }}>
      {children}
    </SesionContext.Provider>
  )
}

export function useSesion() {
  return useContext(SesionContext)
}
