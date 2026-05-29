// "Sebastian Cruchaga" → "scruchaga" | "Ana Maria Lopez" → "alopez" | "Ana" → "ana"
export function nombreClave(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0].toLowerCase()
  return (partes[0][0] + partes[partes.length - 1]).toLowerCase()
}
