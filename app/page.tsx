'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const nombreGuardado = localStorage.getItem('nombreInvitado')
    if (nombreGuardado) router.push('/fiesta')
  }, [])

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Por favor escribe tu nombre')
      return
    }

    setCargando(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('invitados')
        .insert([{ nombre: nombre.trim() }])
        .select()
        .single()

      if (error) throw error

      localStorage.setItem('nombreInvitado', nombre.trim())
      localStorage.setItem('invitadoId', data.id)

      router.push('/fiesta')
    } catch (err) {
      console.error(err)
      setError('Hubo un problema. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 pointer-events-none"></div>

      <div className="relative bg-white/90 backdrop-blur-sm rounded-sm shadow-xl shadow-slate-200/50 p-10 md:p-16 max-w-lg w-full text-center border border-slate-200">
        
        <p className="text-slate-400 uppercase tracking-[0.3em] text-xs font-bold mb-4">Nuestra Boda</p>
        
        <h1 className="font-serif text-5xl md:text-6xl text-[#0A1C3A] mb-6 leading-tight">
          Marisol <span className="text-blue-600 font-light">&</span> Nadir
        </h1>
        
        <div className="w-16 h-px bg-slate-300 mx-auto mb-8"></div>
        
        <p className="text-slate-500 mb-10 font-light text-lg">
          Escribe tu nombre para compartir fotos y mensajes con nosotros.
        </p>

        <form onSubmit={handleEntrar} className="space-y-6">
          <div>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-2 py-3 bg-transparent border-b-2 border-slate-200 focus:outline-none focus:border-blue-800 text-center text-xl text-slate-700 transition-colors placeholder:text-slate-300"
              disabled={cargando}
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#0A1C3A] hover:bg-[#1E3A8A] text-white font-medium py-4 px-8 rounded-sm transition-all tracking-widest uppercase text-sm disabled:opacity-50"
          >
            {cargando ? 'Entrando...' : 'Entrar al evento'}
          </button>
        </form>
      </div>
    </div>
  )
}