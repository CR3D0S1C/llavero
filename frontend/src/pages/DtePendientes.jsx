import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getDteTodos, marcarDteEmitido } from '../services/api'

export default function DtePendientes() {
  const [dtes, setDtes] = useState([])
  const [filtro, setFiltro] = useState('pendiente')
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await getDteTodos()
      setDtes(res.data)
    } finally {
      setLoading(false)
    }
  }

  const marcarEmitido = async (id) => {
    if (!confirm('¿Marcar como emitido en el SII?')) return
    try {
      await marcarDteEmitido(id)
      await cargar()
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    }
  }

  const filtrados = dtes.filter(d => filtro === 'todos' || d.estado === filtro)
  const pendientes = dtes.filter(d => d.estado === 'pendiente').length

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gestión de DTEs</h1>
            <p className="text-muted text-sm mt-1">
              Emite los documentos manualmente en{' '}
              <span className="text-accent">mipyme.sii.cl</span>
              {' '}y márcalos como emitidos aquí.
            </p>
          </div>
          {pendientes > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-yellow-400">{pendientes}</div>
              <div className="text-xs text-yellow-500">Pendientes</div>
            </div>
          )}
        </div>

        {/* Info portal SII */}
        <div className="border border-blue-800 bg-blue-900/10 rounded-xl p-4 mb-6 text-sm">
          <p className="font-semibold text-blue-400 mb-1">📋 Cómo emitir en el portal MiPyme del SII</p>
          <ol className="text-gray-400 space-y-1 list-decimal list-inside">
            <li>Ingresa a <strong className="text-white">mipyme.sii.cl</strong> con tu RUT y clave</li>
            <li>Selecciona "Emitir DTE" → Boleta o Factura según corresponda</li>
            <li>Ingresa los datos del receptor (si es factura) que aparecen aquí</li>
            <li>Confirma la emisión y descarga el PDF si es necesario</li>
            <li>Vuelve aquí y marca el DTE como "Emitido"</li>
          </ol>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {['pendiente', 'emitido', 'error', 'todos'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filtro === f ? 'bg-accent text-white' : 'border border-border text-muted hover:text-gray-200'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted">No hay DTEs en este estado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(d => (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={`badge-${d.tipoDte}`}>{d.tipoDte}</span>
                      <span className={`badge-${d.estado}`}>{d.estado}</span>
                      <span className="text-sm font-semibold">{d.habitacion}</span>
                      <span className="text-green-400 font-bold">${Number(d.total).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="text-xs text-muted">
                      {d.cajero} · {new Date(d.createdAt).toLocaleString('es-CL')}
                    </div>

                    {d.tipoDte === 'factura' && d.receptorRut && (
                      <div className="mt-3 p-3 bg-purple-900/10 border border-purple-800/40 rounded-lg text-sm space-y-1">
                        <p className="text-purple-400 font-semibold text-xs">DATOS RECEPTOR (copiar en portal SII)</p>
                        <p><span className="text-muted">RUT:</span> {d.receptorRut}</p>
                        <p><span className="text-muted">Razón Social:</span> {d.receptorRazon}</p>
                        <p><span className="text-muted">Giro:</span> {d.receptorGiro}</p>
                        <p><span className="text-muted">Dirección:</span> {d.receptorDireccion}, {d.receptorComuna}, {d.receptorCiudad}</p>
                        {d.receptorEmail && <p><span className="text-muted">Email:</span> {d.receptorEmail}</p>}
                      </div>
                    )}
                  </div>

                  {d.estado === 'pendiente' && (
                    <button
                      onClick={() => marcarEmitido(d.id)}
                      className="btn-primary text-sm shrink-0"
                    >
                      ✓ Marcar Emitido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
