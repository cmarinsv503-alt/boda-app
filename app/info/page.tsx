'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Info() {
  const [evento, setEvento] = useState<any>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data } = await supabase.from('evento').select('*').single()
      if (data) setEvento(data)
    }
    cargarDatos()
  }, [])

  if (!evento) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-500">Cargando información...</div>

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden">
        
        <div className="bg-[#0A1C3A] p-10 text-center text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-10 pointer-events-none"></div>
          <h1 className="font-serif text-4xl font-bold mb-2 relative z-10">{evento.nombre_novios}</h1>
          <p className="text-lg text-slate-300 relative z-10">¡Acompáñanos a celebrar nuestro amor!</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center">
            <div className="text-4xl mb-2">⛪</div>
            <h2 className="font-serif text-2xl font-bold text-[#0A1C3A] mb-1">Ceremonia</h2>
            <p className="text-slate-700 font-semibold">{evento.iglesia_nombre || 'Por confirmar'}</p>
            <p className="text-slate-500">{evento.iglesia_direccion || 'Dirección por confirmar'}</p>
            <p className="text-blue-700 font-bold mt-2">{evento.iglesia_hora || 'Hora por confirmar'}</p>
          </div>

          <hr className="border-slate-200 w-1/2 mx-auto" />

          <div className="text-center">
            <div className="text-4xl mb-2">🥂</div>
            <h2 className="font-serif text-2xl font-bold text-[#0A1C3A] mb-1">Recepción</h2>
            <p className="text-slate-700 font-semibold">{evento.recepcion_lugar || 'Por confirmar'}</p>
            <p className="text-slate-500">{evento.recepcion_direccion || 'Dirección por confirmar'}</p>
            <p className="text-blue-700 font-bold mt-2">{evento.recepcion_hora || 'Hora por confirmar'}</p>
          </div>

          <div className="text-center pt-6">
            <Link href="/fiesta" className="inline-block bg-[#0A1C3A] hover:bg-[#1E3A8A] text-white font-bold py-3 px-8 rounded-sm transition uppercase tracking-widest text-sm">
              Ir a subir fotos 📸
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}