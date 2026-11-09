'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Fiesta() {
  const [nombre, setNombre] = useState('')
  const [invitadoId, setInvitadoId] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [fotos, setFotos] = useState<any[]>([]) // Aquí guardaremos las fotos
  const router = useRouter()

  // 1. Verificar invitado y cargar fotos iniciales
  useEffect(() => {
    const nombreGuardado = localStorage.getItem('nombreInvitado')
    const idGuardado = localStorage.getItem('invitadoId')

    if (!nombreGuardado || !idGuardado) {
      router.push('/')
    } else {
      setNombre(nombreGuardado)
      setInvitadoId(idGuardado)
      cargarFotos()
    }
  }, [router])

  // Función para traer las fotos de la base de datos
  const cargarFotos = async () => {
    const { data, error } = await supabase
      .from('fotos')
      .select('*')
      .order('creado_en', { ascending: false }) // Las más nuevas primero

    if (!error && data) {
      setFotos(data)
    }
  }

  // 2. Función para subir fotos
  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendo(true)

    try {
      const nombreLimpio = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')

      const filePath = `${invitadoId}/${Date.now()}_${nombreLimpio}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-boda')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('fotos-boda')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('fotos')
        .insert([{
          invitado_id: invitadoId,
          nombre_invitado: nombre,
          url: urlData.publicUrl,
          tipo: file.type.startsWith('video') ? 'video' : 'foto'
        }])

      if (dbError) throw dbError

      alert('¡Foto subida con éxito!')
      cargarFotos() // Recargamos la galería para que aparezca la nueva
    } catch (error) {
      console.error(error)
      alert('Hubo un error al subir la foto.')
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  return (
    // onContextMenu bloquea el clic derecho en toda esta página
    <div 
      className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-6"
      onContextMenu={(e) => e.preventDefault()} 
    >
      <div className="max-w-4xl mx-auto text-center mt-10">
        <h1 className="text-4xl font-bold text-rose-700 mb-4">
          ¡Hola, {nombre}!
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Sube tus fotos y videos favoritos de la boda aquí.
        </p>

        {/* Botón de subida */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-100 max-w-md mx-auto mb-12">
          <label className="block w-full cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 rounded-xl transition">
            {subiendo ? 'Subiendo...' : 'Seleccionar Foto o Video'}
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleSubirFoto}
              disabled={subiendo}
            />
          </label>
        </div>

        {/* Galería de fotos */}
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Galería de la Boda</h2>
          
          {fotos.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Aún no hay fotos. ¡Sé el primero en subir una!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fotos.map((foto) => (
                <div key={foto.id} className="relative bg-gray-200 rounded-xl overflow-hidden shadow-md aspect-square">
                  
                  {/* Marca de agua */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 z-10 rotate-[-30deg]">
                    <span className="text-white text-lg font-bold drop-shadow-md">
                      Boda de Ana & Carlos
                    </span>
                  </div>

                  {foto.tipo === 'video' ? (
                    <video src={foto.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={foto.url} 
                      alt={`Foto de ${foto.nombre_invitado}`} 
                      className="w-full h-full object-cover pointer-events-none select-none" 
                      // pointer-events-none evita que puedan arrastrar la imagen
                    />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 z-20">
                    Subida por: {foto.nombre_invitado}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}