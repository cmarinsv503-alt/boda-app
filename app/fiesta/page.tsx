'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { supabase } from '@/lib/supabase'

export default function Fiesta() {
  const [nombre, setNombre] = useState('')
  const [invitadoId, setInvitadoId] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [fotos, setFotos] = useState<any[]>([])
  const [mensaje, setMensaje] = useState('')
  const [eventoAbierto, setEventoAbierto] = useState(true)
  const [mostrarQR, setMostrarQR] = useState(false)
  
  // --- NUEVOS ESTADOS PARA LA VISTA PREVIA ---
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [tipoArchivo, setTipoArchivo] = useState<'foto' | 'video' | null>(null)

  const router = useRouter()
  const whatsappNumber = "50361444433"
  const [urlApp, setUrlApp] = useState('')

  useEffect(() => {
    setUrlApp(window.location.origin)
    const nombreGuardado = localStorage.getItem('nombreInvitado')
    const idGuardado = localStorage.getItem('invitadoId')

    if (!nombreGuardado || !idGuardado) {
      router.push('/')
    } else {
      setNombre(nombreGuardado)
      setInvitadoId(idGuardado)
      cargarFotos()
      verificarEstadoEvento()
    }
  }, [router])

  const verificarEstadoEvento = async () => {
    const { data } = await supabase.from('evento').select('estado').single()
    if (data && data.estado === 'cerrado') setEventoAbierto(false)
  }

  const cargarFotos = async () => {
    const { data, error } = await supabase
      .from('fotos')
      .select('*')
      .order('creado_en', { ascending: false })
    if (!error && data) setFotos(data)
  }

  const validarArchivo = async (file: File) => {
    const MAX_SIZE_MB = 20
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`El archivo es muy grande. El límite es de ${MAX_SIZE_MB} MB.`)
      return false
    }

    if (file.type.startsWith('video')) {
      const isValidDuration = await new Promise<boolean>((resolve) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src)
          if (video.duration > 30) {
            alert('El video es muy largo. Máximo 30 segundos.')
            resolve(false)
          } else {
            resolve(true)
          }
        }
        video.src = URL.createObjectURL(file)
      })
      if (!isValidDuration) return false
    }
    return true
  }

  // 1. NUEVA FUNCIÓN: Solo selecciona y muestra la vista previa
  const handleSeleccionArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!eventoAbierto) return alert('El evento ha finalizado.')

    const esValido = await validarArchivo(file)
    if (!esValido) { e.target.value = ''; return }

    // Creamos la URL de vista previa
    const url = URL.createObjectURL(file)
    setArchivoSeleccionado(file)
    setPreviewUrl(url)
    setTipoArchivo(file.type.startsWith('video') ? 'video' : 'foto')
    
    // Limpiamos el input para permitir seleccionar el mismo archivo si se cancela
    e.target.value = ''
  }

  // 2. NUEVA FUNCIÓN: Cancelar y borrar la selección
  const cancelarSeleccion = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setArchivoSeleccionado(null)
    setPreviewUrl(null)
    setTipoArchivo(null)
  }

  // 3. NUEVA FUNCIÓN: Subir el archivo confirmado
  const confirmarSubida = async () => {
    if (!archivoSeleccionado || !previewUrl) return
    
    setSubiendo(true)
    try {
      const file = archivoSeleccionado
      const nombreLimpio = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const filePath = `${invitadoId}/${Date.now()}_${nombreLimpio}`

      const { error: uploadError } = await supabase.storage.from('fotos-boda').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('fotos-boda').getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('fotos').insert([{
        invitado_id: invitadoId,
        nombre_invitado: nombre,
        url: urlData.publicUrl,
        tipo: tipoArchivo,
        mensaje: mensaje.trim()
      }])

      if (dbError) throw dbError
      
      alert('¡Subido con éxito!')
      setMensaje('')
      cancelarSeleccion() // Cerramos el modal
      cargarFotos()       // Recargamos la galería
    } catch (error) {
      console.error(error)
      alert('Hubo un error al subir el archivo.')
    } finally {
      setSubiendo(false)
    }
  }

  const handleCompartirWhatsApp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Recuerdo de la Boda' })
      } catch (error) { console.log('Cancelado') }
    } else {
      alert("Se descargará el archivo para adjuntarlo en WhatsApp Web.")
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url; a.download = file.name; a.click()
      URL.revokeObjectURL(url)
      window.open(`https://wa.me/${whatsappNumber}?text=Hola, te envío un recuerdo (De: ${nombre})`, '_blank')
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen relative pb-20" onContextMenu={(e) => e.preventDefault()}>
      
      {/* MODAL QR */}
      {mostrarQR && (
        <div className="fixed inset-0 bg-[#0A1C3A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-sm shadow-2xl max-w-sm w-full text-center relative animate-fade-in border-t-4 border-blue-600">
            <button onClick={() => setMostrarQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-xl font-bold">✕</button>
            <h3 className="font-serif text-2xl text-[#0A1C3A] mb-2">Escanea para entrar</h3>
            <p className="text-slate-500 text-sm mb-6">Comparte este código con los invitados para que suban sus fotos.</p>
            <div className="bg-white p-4 rounded-sm border-2 border-slate-100 inline-block mb-4">
              <QRCode value={urlApp} size={200} fgColor="#0A1C3A" />
            </div>
            <p className="text-xs text-slate-400">O comparte este enlace:<br/><span className="text-blue-700 font-semibold break-all">{urlApp}</span></p>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA */}
      {previewUrl && (
        <div className="fixed inset-0 bg-[#0A1C3A]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in border-t-4 border-blue-600 max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f4f6f9]">
              <h3 className="font-serif text-xl text-[#0A1C3A]">Vista Previa</h3>
              <button onClick={cancelarSeleccion} disabled={subiendo} className="text-slate-400 hover:text-red-500 font-bold text-xl">✕</button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50 flex flex-col items-center justify-center min-h-[250px]">
              {tipoArchivo === 'foto' ? (
                <img src={previewUrl} alt="Vista previa" className="max-h-[40vh] object-contain rounded-sm shadow-sm" />
              ) : (
                <video src={previewUrl} controls className="max-h-[40vh] object-contain rounded-sm shadow-sm" />
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu mensaje para los novios (opcional)..."
                className="w-full px-4 py-3 bg-transparent border-b-2 border-slate-200 focus:outline-none focus:border-blue-700 resize-none h-20 text-slate-700 placeholder:text-slate-400 font-light mb-6"
                disabled={subiendo}
              />
              <div className="flex gap-4">
                <button 
                  onClick={cancelarSeleccion} 
                  disabled={subiendo}
                  className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-sm hover:bg-slate-50 transition uppercase tracking-wider text-sm"
                >
                  Eliminar
                </button>
                <button 
                  onClick={confirmarSubida} 
                  disabled={subiendo}
                  className="flex-1 bg-[#0A1C3A] hover:bg-[#1E3A8A] text-white font-medium py-3 rounded-sm transition uppercase tracking-wider text-sm disabled:opacity-50"
                >
                  {subiendo ? 'Subiendo...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Flotante */}
      <a 
        href={`https://wa.me/${whatsappNumber}?text=Hola, soy ${nombre}. Te escribo de la app de la boda.`}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-40"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>

      <div className="max-w-4xl mx-auto px-4 pt-16 text-center">
        <h1 className="font-serif text-5xl text-[#0A1C3A] mb-4">Marisol & Nadir</h1>
        <p className="text-slate-500 font-light text-lg mb-6">Gracias por acompañarnos, {nombre}.</p>
        
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <Link href="/info" className="inline-flex items-center gap-2 text-slate-600 hover:text-[#0A1C3A] transition-colors text-sm uppercase tracking-widest font-semibold border-b border-slate-300 hover:border-[#0A1C3A] pb-1">
            <span>📍 Ubicaciones</span>
          </Link>
          <button onClick={() => setMostrarQR(true)} className="inline-flex items-center gap-2 text-slate-600 hover:text-[#0A1C3A] transition-colors text-sm uppercase tracking-widest font-semibold border-b border-slate-300 hover:border-[#0A1C3A] pb-1">
            <span>📱 Compartir QR</span>
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-12 mb-20">
        {eventoAbierto ? (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-sm shadow-lg shadow-slate-200/50 border border-slate-200">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="cursor-pointer border border-slate-300 hover:border-[#0A1C3A] text-slate-700 hover:text-[#0A1C3A] font-medium py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <span>📸 Tomar Foto</span>
                {/* Ahora usamos handleSeleccionArchivo */}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSeleccionArchivo} disabled={subiendo} />
              </label>

              <label className="cursor-pointer border border-slate-300 hover:border-[#0A1C3A] text-slate-700 hover:text-[#0A1C3A] font-medium py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <span>🎥 Grabar Video</span>
                <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleSeleccionArchivo} disabled={subiendo} />
              </label>

              <label className="cursor-pointer bg-[#0A1C3A] hover:bg-[#1E3A8A] text-white font-medium py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <span>🖼️ Galería</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleSeleccionArchivo} disabled={subiendo} />
              </label>

              <label className="cursor-pointer bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <span>WhatsApp</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleCompartirWhatsApp} disabled={subiendo} />
              </label>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 border border-slate-200 rounded-sm bg-white/50">
            <p className="font-serif text-2xl text-slate-700 mb-2">El evento ha finalizado</p>
            <p className="text-slate-500 font-light">Puedes seguir viendo la galería.</p>
          </div>
        )}
      </div>

      {/* Galería */}
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-serif text-3xl text-center text-[#0A1C3A] mb-10">Galería de Recuerdos</h2>
        
        {fotos.length === 0 ? (
          <p className="text-center text-slate-400 font-light py-10">Aún no hay fotos. ¡Sé el primero!</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative break-inside-avoid bg-white p-2 shadow-sm border border-slate-200 group">
                <div className="relative overflow-hidden bg-slate-100">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-10 rotate-[-20deg]">
                    <span className="font-serif text-2xl text-[#0A1C3A]">M & N</span>
                  </div>
                  {foto.tipo === 'video' ? (
                    <video src={foto.url} controls className="w-full object-cover" />
                  ) : (
                    <img src={foto.url} className="w-full object-cover pointer-events-none select-none" loading="lazy" />
                  )}
                </div>
                <div className="p-4 text-center">
                  <p className="font-serif italic text-slate-600 text-lg mb-1">"{foto.mensaje || 'Un recuerdo especial'}"</p>
                  <p className="text-slate-400 text-xs uppercase tracking-widest">— {foto.nombre_invitado}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}