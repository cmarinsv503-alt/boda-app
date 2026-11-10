'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function Proyector() {
  const [fotos, setFotos] = useState<any[]>([])
  const [indice, setIndice] = useState(0)
  const [iniciado, setIniciado] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  let timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const cargarFotos = async () => {
      const { data } = await supabase
        .from('fotos')
        .select('*')
        .order('creado_en', { ascending: true })
      
      if (data) setFotos(data)
    }
    cargarFotos()
  }, [])

  useEffect(() => {
    const canal = supabase
      .channel('fotos-nuevas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fotos' },
        (payload) => setFotos((prev) => [...prev, payload.new])
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [])

  useEffect(() => {
    if (fotos.length === 0 || !iniciado || isPaused) return
    const fotoActual = fotos[indice]
    if (!fotoActual || fotoActual.tipo === 'video') return

    const intervalo = setInterval(() => {
      setIndice((prev) => (prev + 1) % fotos.length)
    }, 9000) 

    return () => clearInterval(intervalo)
  }, [fotos.length, iniciado, indice, fotos, isPaused])

  useEffect(() => {
    if (audioRef.current && fotos[indice]) {
      if (fotos[indice].tipo === 'video') {
        audioRef.current.volume = isMuted ? 0 : 0.05 
      } else {
        audioRef.current.volume = isMuted ? 0 : 0.5  
      }
    }
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [indice, fotos, isMuted])

  const handleMouseMove = () => {
    setShowControls(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const iniciarProyeccion = () => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.5
      audioRef.current.play()
    }
    setIniciado(true)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (videoRef.current) {
      if (isPaused) videoRef.current.play()
      else videoRef.current.pause()
    }
  }

  const toggleMute = () => setIsMuted(!isMuted)

  const handleCast = async () => {
    if ('PresentationRequest' in window) {
      try {
        // @ts-ignore
        const request = new PresentationRequest([window.location.href]);
        await request.start();
      } catch (error) {
        alert("No se pudo iniciar la proyección automática. Usa el ícono de transmitir del navegador.");
      }
    } else {
      alert("Tu navegador no soporta transmisión directa. Usa el ícono de 'Transmitir' del navegador.");
    }
  }

  const handleVideoEnded = () => {
    if (!isPaused) {
      setIndice((prev) => (prev + 1) % fotos.length)
    }
  }

  const fotoActual = fotos[indice]

  return (
    <div 
      className="h-screen w-screen bg-[#0A111E] flex items-center justify-center overflow-hidden relative font-sans"
      onMouseMove={handleMouseMove}
    >
      <audio ref={audioRef} src="/musica/cancion-boda.mp3" loop />

      {/* Controles */}
      {iniciado && (
        <div className={`fixed top-6 right-6 flex gap-3 z-50 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={handleCast} className="bg-[#0A1C3A]/80 hover:bg-[#1E3A8A] text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition" title="Transmitir a pantalla">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M1 18V21H4C4 19.34 2.66 18 1 18ZM1 14V16C3.76 16 6 18.24 6 21H8C8 17.13 4.87 14 1 14ZM1 10V12C5.97 12 10 16.03 10 21H12C12 14.92 7.07 10 1 10ZM21 3H3C1.9 3 1 3.9 1 5V8H3V5H21V19H14V21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM19 7H5V15H8C8 11.13 11.13 8 15 8V7H19Z"/></svg>
          </button>
          <button onClick={toggleMute} className="bg-[#0A1C3A]/80 hover:bg-[#1E3A8A] text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition" title={isMuted ? "Activar sonido" : "Silenciar"}>
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM19 12C19 14.89 17.25 17.3 14.75 18.5V20.5C18.33 19.16 21 15.59 21 12C21 8.41 18.33 4.84 14.75 3.5V5.5C17.25 6.7 19 9.11 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.53C15.47 18.09 14.62 18.5 13.75 18.79V20.83C15.07 20.47 16.3 19.84 17.33 18.99L19.73 21.41L21 20.14L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z"/></svg>
            )}
          </button>
          <button onClick={togglePause} className="bg-[#0A1C3A]/80 hover:bg-[#1E3A8A] text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5V19L19 12L8 5Z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z"/></svg>
            )}
          </button>
        </div>
      )}

      {!iniciado && (
        <div className="absolute inset-0 bg-[#0A111E] flex flex-col items-center justify-center text-white cursor-pointer z-50" onClick={iniciarProyeccion}>
          <div className="border border-slate-700/50 p-12 text-center rounded-sm relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-blue-500/50 -mt-[1px] -ml-[1px]"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-500/50 -mt-[1px] -mr-[1px]"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-500/50 -mb-[1px] -ml-[1px]"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-blue-500/50 -mb-[1px] -mr-[1px]"></div>

            <p className="text-slate-400 uppercase tracking-[0.3em] text-sm mb-6">Nuestra Boda</p>
            <h1 className="font-serif text-6xl text-slate-100 mb-6">Marisol & Nadir</h1>
            <div className="w-16 h-px bg-blue-500/50 mx-auto mb-8"></div>
            <p className="text-slate-400 font-light text-lg animate-pulse">Haz clic para iniciar la proyección</p>
          </div>
        </div>
      )}

      {iniciado && fotos.length === 0 && (
        <div className="text-slate-400 font-serif text-3xl italic animate-pulse">Esperando los primeros recuerdos...</div>
      )}

      {iniciado && fotos.length > 0 && fotoActual && (
        <div className="relative w-full h-full flex items-center justify-center p-6 md:p-12 cursor-none">
          <div key={fotoActual.id} className="relative max-w-full max-h-full flex items-center justify-center animate-photo">
            {fotoActual.tipo === 'video' ? (
              <video ref={videoRef} src={fotoActual.url} autoPlay muted={isMuted} onEnded={handleVideoEnded} className="max-h-[85vh] max-w-full object-contain rounded-sm shadow-2xl shadow-black/80" />
            ) : (
              <img src={fotoActual.url} alt="Proyección" className="max-h-[85vh] max-w-full object-contain rounded-sm shadow-2xl shadow-black/80" />
            )}
          </div>

          <div className="absolute top-8 right-10 opacity-30 mix-blend-overlay">
            <span className="font-serif text-5xl text-white">M & N</span>
          </div>

          {fotoActual.mensaje && (
            <div key={`msg-${fotoActual.id}`} className="absolute bottom-4 md:bottom-6 left-1/2 w-11/12 max-w-sm text-center z-10 animate-message">
              {/* Tarjeta con color perla azulado */}
              <div className="bg-[#f4f6f9]/95 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-sm shadow-2xl border border-slate-200">
                <span className="font-serif text-2xl text-blue-300 absolute top-1 left-2 opacity-50">"</span>
                <p className="font-serif text-sm md:text-base lg:text-lg text-[#0A1C3A] italic leading-snug mb-2 relative z-10">{fotoActual.mensaje}</p>
                <div className="w-6 h-px bg-slate-300 mx-auto mb-2"></div>
                <p className="text-slate-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase">— {fotoActual.nombre_invitado}</p>
              </div>
            </div>
          )}
          
          {!fotoActual.mensaje && (
             <div key={`name-${fotoActual.id}`} className="absolute bottom-4 md:bottom-6 left-1/2 text-center z-10 animate-name">
                <p className="text-white/90 text-[10px] md:text-xs font-semibold tracking-widest uppercase drop-shadow-lg bg-[#0A1C3A]/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  Por: {fotoActual.nombre_invitado}
                </p>
             </div>
          )}
        </div>
      )}
    </div>
  )
}