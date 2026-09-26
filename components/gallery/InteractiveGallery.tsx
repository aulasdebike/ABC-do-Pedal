'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  Layers, 
  Share2, 
  Check, 
  Bike 
} from 'lucide-react';
import { 
  GalleryItem, 
  getStoredGalleryItems, 
  subscribeToGalleryFirestore, 
  getGalleryFromFirestore 
} from '@/lib/gallery-store';
import { GalleryPagination } from './GalleryPagination';

export interface InteractiveGalleryProps {
  items?: GalleryItem[];
  initialPageSize?: number;
  showPagination?: boolean;
  showFilters?: boolean;
  onGoToBooking?: () => void;
  className?: string;
}

export function InteractiveGallery({
  items: initialItems,
  initialPageSize = 12,
  showPagination = true,
  showFilters = true,
  onGoToBooking,
  className = ''
}: InteractiveGalleryProps) {
  // Items state: either passed via props or synchronized from gallery-store
  const [items, setItems] = useState<GalleryItem[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    return getStoredGalleryItems();
  });

  // Filter & Pagination state
  const [activeFilter, setActiveFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Lightbox Modal state
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const galleryTopRef = useRef<HTMLDivElement>(null);

  // Synchronize with Firestore snapshot if initialItems was not provided
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      return;
    }

    let isMounted = true;
    getGalleryFromFirestore().then((fsItems) => {
      if (isMounted && fsItems && fsItems.length > 0) {
        setItems(fsItems.sort((a, b) => a.order - b.order));
      }
    }).catch(() => {});

    const unsubscribe = subscribeToGalleryFirestore((fsItems) => {
      if (isMounted && fsItems && fsItems.length > 0) {
        setItems(fsItems.sort((a, b) => a.order - b.order));
      }
    });

    const handleLocal = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setItems(e.detail);
      }
    };
    window.addEventListener('abc_gallery_updated', handleLocal);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('abc_gallery_updated', handleLocal);
    };
  }, [initialItems]);

  // Filter items (only visible items and matching filter)
  const filteredItems = useMemo(() => {
    const sourceItems = (initialItems && initialItems.length > 0) ? initialItems : items;
    return sourceItems.filter((item) => {
      if (item.hidden) return false;
      if (activeFilter === 'photo' && item.type !== 'photo') return false;
      if (activeFilter === 'video' && item.type !== 'video') return false;
      return true;
    });
  }, [items, initialItems, activeFilter]);

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pagedItems = useMemo(() => {
    if (!showPagination) return filteredItems;
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize, showPagination]);

  // Client-side page change without full-page reload
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (galleryTopRef.current) {
      galleryTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // Lightbox next/prev navigation
  const currentIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return filteredItems.findIndex((i) => i.id === selectedItem.id);
  }, [selectedItem, filteredItems]);

  const handleNext = useCallback(() => {
    if (filteredItems.length === 0 || currentIndex === -1) return;
    const nextIdx = (currentIndex + 1) % filteredItems.length;
    setSelectedItem(filteredItems[nextIdx]);
  }, [filteredItems, currentIndex]);

  const handlePrev = useCallback(() => {
    if (filteredItems.length === 0 || currentIndex === -1) return;
    const prevIdx = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setSelectedItem(filteredItems[prevIdx]);
  }, [filteredItems, currentIndex]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!selectedItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedItem, handleNext, handlePrev]);

  // Share link handler
  const handleShare = (item: GalleryItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.title || 'ABC do Pedal - Galeria Viva',
        text: item.caption || 'Veja este momento na escola ABC do Pedal!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div ref={galleryTopRef} className={`w-full ${className}`}>
      {/* Top Controls: Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-900/60">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-pink-500" />
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-900">
              {[
                { id: 'all', label: 'Todos os Momentos' },
                { id: 'video', label: 'Vídeos Reais' },
                { id: 'photo', label: 'Fotos das Aulas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500">
            {filteredItems.length} momentos disponíveis
          </div>
        </div>
      )}

      {/* Grid of Images and Videos */}
      {pagedItems.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
          <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
          <p className="text-sm font-bold text-slate-300">Nenhum momento encontrado nesta categoria.</p>
          <p className="text-xs text-slate-500 mt-1">Selecione &quot;Todos os Momentos&quot; para visualizar a coleção completa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[220px] sm:auto-rows-[250px] lg:auto-rows-[270px]">
          {pagedItems.map((item, idx) => {
            const isHovered = hoveredItemId === item.id;
            const isVideo = item.type === 'video';

            // Organic visual span
            let spanClass = 'sm:col-span-1 sm:row-span-1';
            if (item.aspectRatio === 'large') spanClass = 'sm:col-span-2 sm:row-span-2';
            else if (item.aspectRatio === 'wide') spanClass = 'sm:col-span-2 sm:row-span-1';
            else if (item.aspectRatio === 'tall') spanClass = 'sm:col-span-1 sm:row-span-2';
            else if (idx % 8 === 0) spanClass = 'sm:col-span-2 sm:row-span-2';
            else if (idx % 8 === 3) spanClass = 'sm:col-span-2 sm:row-span-1';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className={`relative group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-md cursor-pointer transition-all duration-300 ${spanClass} ${
                  isHovered ? 'z-20 shadow-2xl shadow-pink-950/40 ring-2 ring-pink-500/60 scale-[1.02]' : 'hover:border-pink-500/30'
                }`}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                onClick={() => setSelectedItem(item)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Media Container: High Performance Facade */}
                {isVideo && item.youtubeId ? (
                  <div className="w-full h-full absolute inset-0 overflow-hidden bg-black pointer-events-none gpu-smooth">
                    {isHovered ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?enablejsapi=1&autoplay=1&mute=${item.audioBlocked ? 1 : 0}&loop=1&playlist=${item.youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                        title={item.title || 'Vídeo da Galeria'}
                        className="w-[140%] h-[140%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none pointer-events-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <img
                        src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                        alt={item.title || 'Vídeo ABC do Pedal'}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none select-none"
                      />
                    )}
                  </div>
                ) : isVideo && !item.youtubeId ? (
                  <div className="w-full h-full absolute inset-0 overflow-hidden bg-black pointer-events-none gpu-smooth">
                    <video
                      src={item.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      controlsList="nodownload"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full absolute inset-0 overflow-hidden bg-slate-900 pointer-events-none gpu-smooth">
                    <img
                      src={item.url}
                      alt={item.title || 'Foto da Galeria Viva'}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none select-none"
                    />
                  </div>
                )}

                {/* Ambient Bottom Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none flex flex-col justify-end p-3.5">
                  {item.title && (
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-md">
                      {item.title}
                    </p>
                  )}
                  {item.caption && (
                    <p className="text-[10px] sm:text-xs text-slate-300 line-clamp-1 font-light mt-0.5 drop-shadow">
                      {item.caption}
                    </p>
                  )}
                </div>

                {/* Audio Status Pill */}
                {isHovered && isVideo && !item.audioBlocked && (
                  <div className="absolute top-2.5 right-2.5 z-20 bg-pink-600/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md pointer-events-none">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Áudio ativo</span>
                  </div>
                )}

                {isHovered && isVideo && item.audioBlocked && (
                  <div className="absolute top-2.5 right-2.5 z-20 bg-slate-900/95 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md pointer-events-none">
                    <VolumeX className="w-3 h-3 text-amber-400" />
                    <span>Áudio restrito</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Zero-Reload Interactive Pagination */}
      {showPagination && (
        <div className="mt-8 pt-4 border-t border-slate-900">
          <GalleryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6"
            onClick={() => setSelectedItem(null)}
          >
            {/* Top Bar */}
            <div
              className="w-full max-w-5xl mx-auto flex items-center justify-between z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white">
                <Bike className="w-5 h-5 text-pink-500" />
                <span className="text-xs sm:text-sm font-bold line-clamp-1">
                  {selectedItem.title || 'ABC do Pedal • Galeria Viva'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShare(selectedItem)}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                  title="Compartilhar momento"
                >
                  {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-900/90 hover:bg-pink-600 text-white border border-slate-800 transition-all cursor-pointer"
                  aria-label="Fechar ampliação"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Media Content */}
            <div
              className="relative w-full max-w-5xl mx-auto flex-1 flex items-center justify-center my-3 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev / Next buttons */}
              {filteredItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-2 sm:left-4 z-30 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-pink-600 text-white border border-slate-800 transition-all cursor-pointer backdrop-blur-sm"
                    aria-label="Item anterior"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 sm:right-4 z-30 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-pink-600 text-white border border-slate-800 transition-all cursor-pointer backdrop-blur-sm"
                    aria-label="Próximo item"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}

              {/* Media element */}
              {selectedItem.type === 'video' && selectedItem.youtubeId ? (
                <div className="w-full h-full max-h-[75vh] aspect-[16/9] max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black relative border border-slate-800">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedItem.youtubeId}?autoplay=1&mute=${selectedItem.audioBlocked ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
                    title={selectedItem.title || 'Vídeo ABC do Pedal'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {selectedItem.audioBlocked && (
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-amber-200 border border-amber-500/30 text-[11px] font-mono px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg pointer-events-none z-20">
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                      <span>Áudio restrito pelo instrutor</span>
                    </div>
                  )}
                </div>
              ) : selectedItem.type === 'video' && !selectedItem.youtubeId ? (
                <div className="w-full h-full max-h-[75vh] aspect-[16/9] max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black relative border border-slate-800">
                  <video
                    src={selectedItem.url}
                    controls={!selectedItem.audioBlocked}
                    muted={!!selectedItem.audioBlocked}
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="relative w-full h-full max-h-[78vh] flex items-center justify-center"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.title || 'Foto da Galeria Viva'}
                    className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800 select-none pointer-events-none"
                  />
                </div>
              )}
            </div>

            {/* Bottom Info Bar */}
            <div
              className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left z-20 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {selectedItem.title || 'Momento Exclusivo ABC do Pedal'}
                </h3>
                {selectedItem.caption && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 max-w-2xl">
                    {selectedItem.caption}
                  </p>
                )}
              </div>

              {onGoToBooking && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    onGoToBooking();
                  }}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-[#ff007f] hover:from-pink-500 hover:to-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Quero Agendar Minha Aula</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
