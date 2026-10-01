'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Sparkles, 
  VolumeX, 
  ChevronRight, 
  X, 
  Maximize2,
  Video as VideoIcon,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { 
  GalleryItem, 
  getStoredGalleryItems, 
  subscribeToGalleryFirestore, 
  getGalleryFromFirestore, 
  extractYouTubeId 
} from '@/lib/gallery-store';

interface HomeVideoTestimonialsProps {
  onGoToGallery?: () => void;
  onGoToBooking?: () => void;
}

export function HomeVideoTestimonials({ onGoToGallery, onGoToBooking }: HomeVideoTestimonialsProps) {
  // Sincronização reativa usando a mesma store da Galeria Viva
  const [items, setItems] = useState<GalleryItem[]>(() => {
    return getStoredGalleryItems();
  });

  // Estado de reprodução manual (Garante que nenhum vídeo inicie automaticamente com som)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Modal Lightbox para visualização ampliada (reutilizando a lógica da Galeria Viva)
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Sincronização em tempo real (localStorage, broadcast event e Firestore)
  useEffect(() => {
    let isMounted = true;

    // Busca assíncrona do Firestore
    getGalleryFromFirestore().then((fsItems) => {
      if (!isMounted || !fsItems || fsItems.length === 0) return;
      setItems((prev) => {
        const map = new Map<string, GalleryItem>();
        prev.forEach((i) => map.set(i.id, i));
        fsItems.forEach((i) => map.set(i.id, i));
        return Array.from(map.values()).sort((a, b) => a.order - b.order);
      });
    }).catch(() => {});

    // Inscrição em tempo real no Firestore
    const unsubscribeFs = subscribeToGalleryFirestore((fsItems) => {
      if (!isMounted || !fsItems || fsItems.length === 0) return;
      setItems((prev) => {
        const map = new Map<string, GalleryItem>();
        prev.forEach((i) => map.set(i.id, i));
        fsItems.forEach((i) => map.set(i.id, i));
        return Array.from(map.values()).sort((a, b) => a.order - b.order);
      });
    });

    // Evento de atualização local (disparado pelo AdminGalleryView ao salvar no Portal do Instrutor)
    const handleLocalUpdate = (e: any) => {
      if (!isMounted) return;
      const latest = e.detail || getStoredGalleryItems();
      setItems(latest);
    };
    window.addEventListener('abc_gallery_updated', handleLocalUpdate);

    return () => {
      isMounted = false;
      unsubscribeFs();
      window.removeEventListener('abc_gallery_updated', handleLocalUpdate);
    };
  }, []);

  // Filtro estrito conforme regras da especificação:
  // 1. Tipo vídeo
  // 2. URL válida
  // 3. Publicado (não oculto)
  // 4. Marcado pelo instrutor para exibição nos depoimentos da Home (showInTestimonials === true)
  // 5. Máximo de 5 vídeos na Home
  const testimonialVideos = useMemo(() => {
    return items
      .filter((item) => {
        if (item.type !== 'video') return false;
        if (!item.url || !item.url.trim()) return false;
        if (item.hidden) return false;
        return !!item.showInTestimonials;
      })
      .slice(0, 5);
  }, [items]);

  // Se não houver nenhum vídeo ativado, ocultar a seção sem criar nenhum conteúdo fictício
  if (testimonialVideos.length === 0) {
    return null;
  }

  // Direcionamento oficial para a Galeria Viva
  const handleNavigateToGallery = () => {
    if (onGoToGallery) {
      onGoToGallery();
    }
  };

  return (
    <section 
      id="depoimentos-home" 
      aria-label="Depoimentos em Vídeo de Alunos do ABC do Pedal"
      className="py-20 sm:py-24 bg-gradient-to-b from-[#060608] via-[#08080d] to-[#040406] border-y border-pink-500/10 relative overflow-hidden"
    >
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-pink-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-[92vw] lg:w-[80vw] max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho da Seção com Título Obrigatório */}
        <div className="text-center space-y-4 mb-12 sm:mb-16 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prova Real de Transformação & Superação</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
            Depoimentos de quem aprendeu com o ABC do Pedal
          </h2>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            Histórias reais de quem acreditava não conseguir e hoje pedala com segurança, autonomia e liberdade nos parques e ciclovias de São Paulo e Grande ABC.
          </p>
        </div>

        {/* 
          Grid Responsivo:
          - Desktop: Horizontal, cartões uniformes com espaçamento consistente (até 5 colunas)
          - Tablet / Mobile: Carrossel com scroll lateral suave touch-friendly, sem ultrapassar a tela
        */}
        <div className="relative">
          <div 
            className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 px-2 sm:px-0 -mx-2 sm:mx-0 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {testimonialVideos.map((video, idx) => {
              const ytId = video.youtubeId || extractYouTubeId(video.url);
              const isPlaying = playingVideoId === video.id;

              return (
                <div
                  key={video.id}
                  className="min-w-[280px] max-w-[320px] sm:min-w-0 sm:max-w-none w-full snap-center shrink-0 sm:shrink flex flex-col bg-slate-950/90 border border-slate-800/90 hover:border-pink-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl group hover:-translate-y-1"
                >
                  {/* Container de Reprodução Manual / Miniatura */}
                  <div className="relative aspect-video bg-black overflow-hidden shrink-0 select-none">
                    {isPlaying ? (
                      /* Player ativado manualmente pelo usuário (sem autoplay inicial indesejado) */
                      <div className="relative w-full h-full">
                        {ytId ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${video.audioBlocked ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
                            title={video.title || 'Depoimento Aluno ABC do Pedal'}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={video.url}
                            controls
                            autoPlay
                            muted={!!video.audioBlocked}
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        )}

                        {/* Botão de Fechar Reprodução */}
                        <button
                          type="button"
                          onClick={() => setPlayingVideoId(null)}
                          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/80 text-white hover:bg-pink-600 transition-colors cursor-pointer border border-white/20 shadow-lg"
                          title="Voltar para miniatura"
                          aria-label="Voltar para miniatura do vídeo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Miniatura com Botão de Play Manual e Controles Acessíveis */
                      <div className="relative w-full h-full group/thumb cursor-pointer" onClick={() => setPlayingVideoId(video.id)}>
                        {ytId ? (
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            alt={video.title || 'Depoimento em vídeo de aluno do ABC do Pedal'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                            <VideoIcon className="w-10 h-10" />
                          </div>
                        )}

                        {/* Máscara de gradiente suave */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/30 to-black/50 group-hover/thumb:via-black/20 transition-all duration-300" />

                        {/* Botão de Play Central com feedback tátil */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div 
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-pink-600/90 group-hover/thumb:bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-600/40 transition-all duration-300 group-hover/thumb:scale-110 ring-4 ring-white/10"
                            role="button"
                            aria-label={`Reproduzir depoimento em vídeo: ${video.title || 'Depoimento de aluno'}`}
                          >
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Badges superiores informativas */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 pointer-events-none">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/85 text-pink-300 border border-pink-500/30 backdrop-blur-sm flex items-center gap-1">
                            <VideoIcon className="w-3 h-3 text-pink-400" />
                            <span>Depoimento #{idx + 1}</span>
                          </span>

                          {video.audioBlocked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950/90 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <VolumeX className="w-2.5 h-2.5" />
                              <span>Mudo</span>
                            </span>
                          )}
                        </div>

                        {/* Botão de Tela Cheia / Ampliar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxItem(video);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-slate-300 hover:text-white transition-all border border-white/10 opacity-80 hover:opacity-100 cursor-pointer z-10"
                          title="Assistir em tela cheia"
                          aria-label="Abrir vídeo em tela cheia"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Corpo do Cartão: Título, Legenda e Ação */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-pink-300 transition-colors">
                        {video.title || 'Superação real no aprendizado da bicicleta'}
                      </h3>
                      {video.caption && (
                        <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">
                          {video.caption}
                        </p>
                      )}
                    </div>

                    {/* Botão de ação do cartão */}
                    <div className="pt-2 border-t border-slate-900/90 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaying) {
                            setPlayingVideoId(null);
                          } else {
                            setPlayingVideoId(video.id);
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                            : 'bg-pink-600/15 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 shadow-sm'
                        }`}
                        aria-label={isPlaying ? 'Pausar vídeo' : 'Assistir depoimento'}
                      >
                        <Play className={`w-3 h-3 ${isPlaying ? 'rotate-90' : 'fill-current'}`} />
                        <span>{isPlaying ? 'Fechar vídeo' : 'Assistir vídeo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLightboxItem(video)}
                        className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Ampliar visualização"
                        aria-label="Ampliar depoimento"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica visual de rolagem para mobile / tablet */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono mt-3">
            <span>← Deslize para ver mais depoimentos →</span>
          </div>
        </div>

        {/* 
          Botão Obrigatório ao final da seção:
          “Ver mais depoimentos na Galeria Viva”
          Direciona para a Galeria Viva já existente no site (rota /galeria-viva ou aba galeria)
        */}
        <div className="mt-12 sm:mt-14 text-center">
          <Link
            href="/galeria-viva"
            onClick={(e) => {
              if (onGoToGallery) {
                e.preventDefault();
                handleNavigateToGallery();
              }
            }}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-[#ff007f] hover:from-pink-500 hover:to-[#ff2a85] text-white text-sm sm:text-base font-mono font-bold shadow-[0_0_25px_rgba(236,72,153,0.35)] hover:shadow-[0_0_35px_rgba(236,72,153,0.55)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-pink-200" />
            <span>Ver mais depoimentos na Galeria Viva</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </Link>
        </div>

      </div>

      {/* 
        =========================================================
        MODAL LIGHTBOX AMPLIADO (REUTILIZA A ESTRUTURA DA GALERIA VIVA)
        =========================================================
      */}
      {lightboxItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxItem(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1.5">
                  <VideoIcon className="w-3.5 h-3.5" />
                  <span>Depoimento em Vídeo</span>
                </span>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  • ABC do Pedal
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
                aria-label="Fechar vídeo ampliado"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Player de Vídeo em Alta Resolução */}
            <div className="relative aspect-video w-full bg-black">
              {(() => {
                const ytId = lightboxItem.youtubeId || extractYouTubeId(lightboxItem.url);
                if (ytId) {
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${lightboxItem.audioBlocked ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
                      title={lightboxItem.title || 'Depoimento em vídeo'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <video
                    src={lightboxItem.url}
                    controls
                    autoPlay
                    muted={!!lightboxItem.audioBlocked}
                    playsInline
                    className="w-full h-full object-contain"
                  />
                );
              })()}

              {lightboxItem.audioBlocked && (
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-amber-200 border border-amber-500/30 text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span>Áudio restrito pelo instrutor</span>
                </div>
              )}
            </div>

            {/* Rodapé do Modal com Título, Legenda e Ação */}
            <div className="p-4 sm:p-6 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {lightboxItem.title || 'Superação real no aprendizado da bicicleta'}
                </h4>
                {lightboxItem.caption && (
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {lightboxItem.caption}
                  </p>
                )}
              </div>

              {onGoToBooking && (
                <button
                  type="button"
                  onClick={() => {
                    setLightboxItem(null);
                    onGoToBooking();
                  }}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Quero Agendar Minha Aula</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
