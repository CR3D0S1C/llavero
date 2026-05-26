import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [huesped, setHuesped] = useState(() => {
    const token = localStorage.getItem('huesped_token')
    const data = localStorage.getItem('huesped_data')
    return token && data ? JSON.parse(data) : null
  })

  const login = (data) => {
    localStorage.setItem('huesped_token', data.token)
    localStorage.setItem('huesped_data', JSON.stringify({
      huespedId: data.huespedId,
      nombre: data.nombre,
      email: data.email,
    }))
    setHuesped({ huespedId: data.huespedId, nombre: data.nombre, email: data.email })
  }

  const logout = () => {
    localStorage.removeItem('huesped_token')
    localStorage.removeItem('huesped_data')
    setHuesped(null)
  }

  return (
    <AuthContext.Provider value={{ huesped, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
