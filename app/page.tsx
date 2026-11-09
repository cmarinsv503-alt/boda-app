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
    if (nombreGuardado) {
      router.push('/fiesta')
    }
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-rose-700 mb-2">
          ¡Bienvenido a la fiesta!
        </h1>
        <p className="text-gray-600 mb-8">
          Escribe tu nombre para empezar a compartir fotos
        </p>

        <form onSubmit={handleEntrar} className="space-y-4">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-lg"
            disabled={cargando}
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {cargando ? 'Entrando...' : 'Entrar a la fiesta'}
          </button>
        </form>
      </div>
    </div>
  )
}