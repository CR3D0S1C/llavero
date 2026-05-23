import { createContext, useContext, useState, useEffect } from 'react'

const SesionContext = createContext(null)

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    const guardado = localStorage.getItem('llavero_sesion')
    return guardado ? JSON.parse(guardado) : null
  })

  const login = (datos) => {
    localStorage.setItem('llavero_sesion', JSON.stringify(datos))
    setSesion(datos)
  }

  const logout = () => {
    localStorage.removeItem('llavero_sesion')
    setSesion(null)
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
