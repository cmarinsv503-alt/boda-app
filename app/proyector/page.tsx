'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Proyector() {
  const [fotos, setFotos] = useState<any[]>([])
  const [indice, setIndice] = useState(0)

  // 1. Cargar las fotos iniciales
  useEffect(() => {
    const cargarFotos = async () => {
      const { data } = await supabase
        .from('fotos')
        .select('*')
        .order('creado_en', { ascending: true }) // Orden cronológico
      
      if (data) setFotos(data)
    }
    cargarFotos()
  }, [])

  // 2. Escuchar fotos nuevas en TIEMPO REAL
  useEffect(() => {
    const canal = supabase
      .channel('fotos-nuevas') // Nombre del canal
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fotos' },
        (payload) => {
          // Cuando alguien sube una foto, la agregamos a la lista
          setFotos((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    // Limpiamos la conexión si se cierra la página
    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  // 3. Rotación automática de fotos
  useEffect(() => {
    if (fotos.length === 0) return
    
    // Cambia de foto cada 6 segundos (puedes ajustarlo)
    const intervalo = setInterval(() => {
      setIndice((prev) => (prev + 1) % fotos.length)
    }, 6000)

    return () => clearInterval(intervalo)
  }, [fotos.length])

  // Si no hay fotos aún, mostramos un mensaje
  if (fotos.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-4xl cursor-none">
        Esperando fotos de la boda... 📸
      </div>
    )
  }

  const fotoActual = fotos[indice]

  return (
    // cursor-none oculta el mouse en la pantalla del proyector
    <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden cursor-none">
      {fotoActual.tipo === 'video' ? (
        <video
          key={fotoActual.id}
          src={fotoActual.url}
          autoPlay
          muted
          loop // Hace que el video se repita
          className="max-h-screen max-w-full object-contain"
        />
      ) : (
        <img
          key={fotoActual.id}
          src={fotoActual.url}
          alt="Proyección"
          className="max-h-screen max-w-full object-contain"
        />
      )}
    </div>
  )
}