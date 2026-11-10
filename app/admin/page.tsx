'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Admin() {
  const [logueado, setLogueado] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [evento, setEvento] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    const { data, error } = await supabase.from('evento').select('*').single()

    if (error || !data) {
      setError('Error al conectar con la base de datos.')
    } else if (data.codigo_admin === codigo) {
      setLogueado(true)
      setEvento(data)
      cargarFotos()
    } else {
      setError('Código incorrecto.')
    }
    setCargando(false)
  }

  const cargarFotos = async () => {
    const { data } = await supabase.from('fotos').select('*').order('creado_en', { ascending: false })
    if (data) setFotos(data)
  }

  const toggleEvento = async () => {
    const nuevoEstado = evento.estado === 'abierto' ? 'cerrado' : 'abierto'
    const { error } = await supabase
      .from('evento')
      .update({ estado: nuevoEstado })
      .eq('id', evento.id)

    if (!error) {
      setEvento({ ...evento, estado: nuevoEstado })
    }
  }

  const eliminarFoto = async (foto: any) => {
    if (!confirm('¿Seguro que quieres eliminar esta foto?')) return

    await supabase.from('fotos').delete().eq('id', foto.id)
    
    const partesUrl = foto.url.split('/')
    const nombreArchivo = partesUrl[partesUrl.length - 1]
    const filePath = `${foto.invitado_id}/${nombreArchivo}`
    
    await supabase.storage.from('fotos-boda').remove([filePath])

    cargarFotos()
  }

  if (!logueado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Administrador</h1>
          <input
            type="password"
            placeholder="Código de acceso"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button type="submit" disabled={cargando} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition">
            {cargando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Administración</h1>
          <Link href="/proyector" target="_blank" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
            Abrir Modo Proyector 📺
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Estado del Evento</h2>
            <p className="text-gray-500">Actualmente el evento está: <span className="font-bold uppercase">{evento.estado}</span></p>
          </div>
          <button 
            onClick={toggleEvento}
            className={`px-6 py-3 rounded-xl font-bold text-white transition ${evento.estado === 'abierto' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {evento.estado === 'abierto' ? 'Cerrar Evento' : 'Abrir Evento'}
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Galería ({fotos.length} archivos)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fotos.map((foto) => (
            <div key={foto.id} className="bg-white rounded-xl overflow-hidden shadow-md relative group">
              {foto.tipo === 'video' ? (
                <video src={foto.url} className="w-full h-40 object-cover" />
              ) : (
                <img src={foto.url} className="w-full h-40 object-cover" />
              )}
              <div className="p-3">
                <p className="text-xs text-gray-500 truncate">{foto.nombre_invitado}</p>
                <button 
                  onClick={() => eliminarFoto(foto)}
                  className="mt-2 w-full bg-red-100 text-red-600 font-bold py-1 rounded-lg hover:bg-red-200 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}