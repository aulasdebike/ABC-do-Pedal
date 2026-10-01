'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff, 
  Link as LinkIcon, 
  Video, 
  Image as ImageIcon, 
  Check, 
  X, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Sliders,
  Layers,
  HelpCircle,
  VolumeX,
  Volume2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  GalleryItem, 
  GalleryAspectRatio, 
  GalleryMediaType,
  getStoredGalleryItems, 
  saveStoredGalleryItems, 
  saveGalleryItemToFirestore, 
  deleteGalleryItemFromFirestore,
  extractYouTubeId,
  detectMediaType,
  getGalleryFromFirestore,
  subscribeToGalleryFirestore
} from '@/lib/gallery-store';

export function AdminGalleryView() {
  const [items, setItems] = useState<GalleryItem[]>(() => {
    return getStoredGalleryItems();
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video' | 'testimonials' | 'hidden'>('all');

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Form fields
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formAspectRatio, setFormAspectRatio] = useState<GalleryAspectRatio>('normal');
  const [formHidden, setFormHidden] = useState(false);
  const [formAudioBlocked, setFormAudioBlocked] = useState(false);
  const [formShowInTestimonials, setFormShowInTestimonials] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Derived media type from url
  const detectedType = useMemo(() => {
    return detectMediaType(formUrl);
  }, [formUrl]);

  const detectedYouTubeId = useMemo(() => {
    return extractYouTubeId(formUrl);
  }, [formUrl]);

  // Load and subscribe
  useEffect(() => {
    let isMounted = true;

    // Initial fetch from Firestore
    getGalleryFromFirestore().then((fsItems) => {
      if (!isMounted || !fsItems || fsItems.length === 0) return;
      setItems((prev) => {
        const map = new Map<string, GalleryItem>();
        prev.forEach((i) => map.set(i.id, i));
        fsItems.forEach((i) => map.set(i.id, i));
        const merged = Array.from(map.values()).sort((a, b) => a.order - b.order);
        saveStoredGalleryItems(merged);
        return merged;
      });
    }).catch(() => {});

    // Listen to firestore snapshot
    const unsubscribeFs = subscribeToGalleryFirestore((fsItems) => {
      if (!isMounted || !fsItems || fsItems.length === 0) return;
      setItems((prev) => {
        const map = new Map<string, GalleryItem>();
        prev.forEach((i) => map.set(i.id, i));
        fsItems.forEach((i) => map.set(i.id, i));
        const merged = Array.from(map.values()).sort((a, b) => a.order - b.order);
        return merged;
      });
    });

    return () => {
      isMounted = false;
      unsubscribeFs();
    };
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType === 'photo' && item.type !== 'photo') return false;
      if (filterType === 'video' && item.type !== 'video') return false;
      if (filterType === 'testimonials' && (!item.showInTestimonials || item.type !== 'video' || item.hidden)) return false;
      if (filterType === 'hidden' && !item.hidden) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchCaption = (item.caption || '').toLowerCase().includes(q);
        const matchUrl = item.url.toLowerCase().includes(q);
        if (!matchTitle && !matchCaption && !matchUrl) return false;
      }

      return true;
    });
  }, [items, filterType, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const photos = items.filter((i) => i.type === 'photo').length;
    const videos = items.filter((i) => i.type === 'video').length;
    const hidden = items.filter((i) => i.hidden).length;
    const visible = total - hidden;
    const testimonials = items.filter((i) => i.type === 'video' && !i.hidden && i.showInTestimonials).length;
    return { total, photos, videos, hidden, visible, testimonials };
  }, [items]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormUrl('');
    setFormTitle('');
    setFormCaption('');
    setFormAspectRatio('normal');
    setFormHidden(false);
    setFormAudioBlocked(false);
    setFormShowInTestimonials(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormUrl(item.url);
    setFormTitle(item.title || '');
    setFormCaption(item.caption || '');
    setFormAspectRatio(item.aspectRatio || 'normal');
    setFormHidden(item.hidden);
    setFormAudioBlocked(!!item.audioBlocked);
    setFormShowInTestimonials(!!item.showInTestimonials);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save / Update Item
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = formUrl.trim();
    if (!trimmedUrl) {
      setFormError('Informe o link da foto ou do vídeo.');
      return;
    }

    // Validação formal de URL e formatos aceitos
    try {
      const parsed = new URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setFormError('Protocolo de link inválido. Utilize um endereço que inicie com http:// ou https://');
        return;
      }
    } catch {
      // Se não for URL absoluta com protocolo, checar se é um ID direto do YouTube de 11 caracteres
      if (!/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
        setFormError('Link inválido. Insira uma URL completa (ex: https://...) ou um link de vídeo do YouTube.');
        return;
      }
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const type = detectMediaType(trimmedUrl);
      const ytId = extractYouTubeId(trimmedUrl);

      const itemToSave: GalleryItem = {
        id: editingItem ? editingItem.id : `gal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        url: trimmedUrl,
        youtubeId: ytId || undefined,
        title: formTitle.trim() || undefined,
        caption: formCaption.trim() || undefined,
        aspectRatio: formAspectRatio,
        hidden: formHidden,
        audioBlocked: type === 'video' ? formAudioBlocked : false,
        showInTestimonials: type === 'video' ? formShowInTestimonials : false,
        order: editingItem ? editingItem.order : items.length + 1,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = editingItem
        ? items.map((i) => (i.id === itemToSave.id ? itemToSave : i))
        : [itemToSave, ...items];

      setItems(updated);
      saveStoredGalleryItems(updated);

      // Async sync to Firestore
      try {
        await saveGalleryItemToFirestore(itemToSave);
      } catch (fsErr) {
        console.warn('Erro ao salvar no Firestore (mantido localmente):', fsErr);
      }

      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar conteúdo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reordenação de Conteúdos (Mover para Cima ou para Baixo)
  const handleMoveOrder = async (item: GalleryItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[currentIndex];
    newItems[currentIndex] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reordered = newItems.map((it, idx) => ({
      ...it,
      order: idx + 1,
      updatedAt: new Date().toISOString()
    }));

    setItems(reordered);
    saveStoredGalleryItems(reordered);

    try {
      await Promise.all([
        saveGalleryItemToFirestore(reordered[currentIndex]),
        saveGalleryItemToFirestore(reordered[targetIndex])
      ]);
    } catch (fsErr) {
      console.warn('Erro ao atualizar ordenação no Firestore:', fsErr);
    }
  };

  // Toggle Show in Testimonials (Exibir nos depoimentos da Home)
  const handleToggleShowInTestimonials = async (item: GalleryItem) => {
    const updatedItem: GalleryItem = {
      ...item,
      showInTestimonials: !item.showInTestimonials,
      updatedAt: new Date().toISOString()
    };
    const updatedList = items.map((i) => (i.id === item.id ? updatedItem : i));
    setItems(updatedList);
    saveStoredGalleryItems(updatedList);

    try {
      await saveGalleryItemToFirestore(updatedItem);
    } catch (fsErr) {
      console.warn('Erro ao atualizar showInTestimonials no Firestore:', fsErr);
    }
  };

  // Toggle Audio Block (Restrito ao Painel do Instrutor)
  const handleToggleAudioBlocked = async (item: GalleryItem) => {
    const updatedItem = { ...item, audioBlocked: !item.audioBlocked, updatedAt: new Date().toISOString() };
    const updatedList = items.map((i) => (i.id === item.id ? updatedItem : i));
    setItems(updatedList);
    saveStoredGalleryItems(updatedList);

    try {
      await saveGalleryItemToFirestore(updatedItem);
    } catch (fsErr) {
      console.warn('Erro ao atualizar bloqueio de áudio no Firestore:', fsErr);
    }
  };

  // Toggle Visibility (Ocultar / Exibir)
  const handleToggleVisibility = async (item: GalleryItem) => {
    const updatedItem = { ...item, hidden: !item.hidden, updatedAt: new Date().toISOString() };
    const updatedList = items.map((i) => (i.id === item.id ? updatedItem : i));
    setItems(updatedList);
    saveStoredGalleryItems(updatedList);

    try {
      await saveGalleryItemToFirestore(updatedItem);
    } catch (fsErr) {
      console.warn('Erro ao atualizar visibilidade no Firestore:', fsErr);
    }
  };

  // Delete Item
  const handleDelete = async (item: GalleryItem) => {
    const confirmDelete = window.confirm(
      `Deseja realmente remover o conteúdo "${item.title || item.url}" da Galeria Viva?`
    );
    if (!confirmDelete) return;

    const updatedList = items.filter((i) => i.id !== item.id);
    setItems(updatedList);
    saveStoredGalleryItems(updatedList);

    try {
      await deleteGalleryItemFromFirestore(item.id);
    } catch (fsErr) {
      console.warn('Erro ao excluir do Firestore:', fsErr);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400">
                Gerenciamento de Conteúdos
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Painel da Galeria Viva
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Cadastre fotos e vídeos do YouTube através de links externos. O sistema armazena apenas as URLs necessárias, mantendo o carregamento progressivo e ultrarrápido.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-[#ff007f] hover:from-pink-500 hover:to-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-900/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Conteúdo</span>
          </button>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-900">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total no Catálogo</span>
            <p className="text-lg font-black text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-pink-400">Fotos Ativas</span>
            <p className="text-lg font-black text-pink-400">{stats.photos}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-rose-400">Vídeos YouTube</span>
            <p className="text-lg font-black text-rose-400">{stats.videos}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-amber-400">Ocultos / Rascunhos</span>
            <p className="text-lg font-black text-amber-400">{stats.hidden}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou link..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Todos (${stats.total})` },
            { id: 'photo', label: `Fotos (${stats.photos})` },
            { id: 'video', label: `Vídeos (${stats.videos})` },
            { id: 'testimonials', label: `Depoimentos Home (${stats.testimonials}/5)` },
            { id: 'hidden', label: `Ocultos (${stats.hidden})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid View */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-950 p-12 text-center rounded-2xl border border-slate-800">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Nenhum conteúdo encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Clique em "Adicionar Novo Conteúdo" para cadastrar seu primeiro link de foto ou vídeo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isVideo = item.type === 'video';
            const ytId = item.youtubeId;

            return (
              <div
                key={item.id}
                className={`bg-slate-950 rounded-xl border overflow-hidden flex flex-col transition-all ${
                  item.hidden
                    ? 'border-amber-900/40 opacity-70'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video bg-black overflow-hidden group">
                  {isVideo && ytId ? (
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={item.title || 'Vídeo YouTube'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || 'Foto'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600';
                      }}
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-white backdrop-blur-sm border border-white/10 flex items-center gap-1">
                      {isVideo ? <Video className="w-3 h-3 text-rose-400" /> : <ImageIcon className="w-3 h-3 text-pink-400" />}
                      <span>{isVideo ? 'Vídeo' : 'Foto'}</span>
                    </span>

                    {item.aspectRatio && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900/90 text-slate-300 border border-slate-700">
                        {item.aspectRatio}
                      </span>
                    )}

                    {isVideo && item.audioBlocked && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <VolumeX className="w-2.5 h-2.5" />
                        <span>Mudo</span>
                      </span>
                    )}

                    {isVideo && item.showInTestimonials && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-pink-600/90 text-white border border-pink-400/50 flex items-center gap-1 font-bold shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-pink-200" />
                        <span>Home</span>
                      </span>
                    )}
                  </div>

                  {item.hidden && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Oculto
                    </div>
                  )}

                  {/* Hover Quick Action */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-xs text-white font-mono font-bold transition-opacity"
                  >
                    <span>Abrir Link Original</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Details Box */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      {item.title || 'Sem título definido'}
                    </h3>
                    {item.caption && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {item.caption}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-1.5">
                      {item.url}
                    </p>
                  </div>

                  {/* Controle: Exibir nos depoimentos da Home */}
                  {isVideo && (
                    <div className="pt-2 border-t border-slate-900/90">
                      <button
                        type="button"
                        onClick={() => handleToggleShowInTestimonials(item)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                          item.showInTestimonials
                            ? 'bg-pink-600/20 text-pink-200 border-pink-500/50 hover:bg-pink-600/30'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={item.showInTestimonials ? 'Clique para desativar dos depoimentos da Home' : 'Clique para ativar nos depoimentos da Home'}
                      >
                        <span className="flex items-center gap-2 font-bold text-[11px] text-left">
                          <input
                            type="checkbox"
                            checked={!!item.showInTestimonials}
                            readOnly
                            className="rounded text-pink-600 focus:ring-0 cursor-pointer pointer-events-none w-3.5 h-3.5 shrink-0"
                          />
                          <span>Exibir nos depoimentos da Home</span>
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${
                          item.showInTestimonials ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.showInTestimonials ? 'Ativado' : 'Desativado'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(item)}
                        title={item.hidden ? 'Exibir na Galeria Viva' : 'Ocultar da Galeria'}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                          item.hidden
                            ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{item.hidden ? 'Oculto' : 'Visível'}</span>
                      </button>

                      {isVideo && (
                        <button
                          type="button"
                          onClick={() => handleToggleAudioBlocked(item)}
                          title={item.audioBlocked ? 'Áudio bloqueado (Clique para liberar som)' : 'Áudio ativo (Clique para bloquear áudio)'}
                          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                            item.audioBlocked
                              ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                              : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
                          }`}
                        >
                          {item.audioBlocked ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                          <span className="text-[10px] hidden sm:inline">{item.audioBlocked ? 'Mudo' : 'Som'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(item, 'up')}
                        disabled={items.indexOf(item) === 0}
                        title="Mover para cima na Galeria"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveOrder(item, 'down')}
                        disabled={items.indexOf(item) === items.length - 1}
                        title="Mover para baixo na Galeria"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Editar Informações ou Substituir Mídia"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        title="Remover Conteúdo"
                        className="p-1.5 rounded-lg bg-slate-900 text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 
        =========================================================
        MODAL: ADICIONAR / EDITAR CONTEÚDO POR LINK
        =========================================================
      */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <h3 className="text-base font-black text-white">
                  {editingItem ? 'Editar Conteúdo' : 'Adicionar Conteúdo por Link'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Link Input */}
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>Link da Foto ou Vídeo do YouTube *</span>
                  <span className="text-[10px] text-pink-400 font-normal">
                    {detectedType === 'video' ? 'Vídeo YouTube detectado' : 'Foto detectada'}
                  </span>
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://images.../foto.jpg"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Aceita links do YouTube (padrão, shorts, compartilhamento youtu.be) ou URLs diretas de imagens (Unsplash, Imgur, Postimg, etc.).
                </p>
              </div>

              {/* Live Preview if valid link */}
              {formUrl.trim() && (
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Pré-visualização do Link:
                  </span>
                  {detectedType === 'video' && detectedYouTubeId ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black max-w-xs mx-auto">
                      <img
                        src={`https://img.youtube.com/vi/${detectedYouTubeId}/hqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-white bg-black/80 px-2 py-1 rounded">
                          YouTube ID: {detectedYouTubeId}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black max-w-xs mx-auto">
                      <img
                        src={formUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-slate-300">
                  Título ou Destaque (Opcional)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Primeiras pedaladas no Ibirapuera"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs"
                />
              </div>

              {/* Caption Input */}
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-slate-300">
                  Legenda / História do Momento (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Ex: Aluna superou o receio após 20 anos e pedalou com autonomia."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs resize-none"
                />
              </div>

              {/* Aspect Ratio in Mosaic */}
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-slate-300">
                  Tamanho / Proporção no Mosaico
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'normal', label: 'Padrão (1x1)' },
                    { id: 'wide', label: 'Largo (2x1)' },
                    { id: 'tall', label: 'Alto / 9:16' },
                    { id: 'large', label: 'Grande (2x2)' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setFormAspectRatio(ratio.id as GalleryAspectRatio)}
                      className={`py-2 px-2.5 rounded-lg text-[11px] font-mono transition-colors border cursor-pointer ${
                        formAspectRatio === ratio.id
                          ? 'bg-pink-600/30 text-pink-300 border-pink-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div>
                  <span className="font-mono font-bold text-slate-200 block">
                    Visível na Galeria Viva
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Se desmarcado, o item fica salvo como rascunho e não aparece para o público.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormHidden(!formHidden)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    !formHidden ? 'bg-pink-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      !formHidden ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Exclusive Instructor Audio Blocking Switch */}
              {detectedType === 'video' && (
                <div className="pt-3 flex items-center justify-between border-t border-slate-800 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <VolumeX className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-amber-200 block text-xs">
                        Bloquear Áudio do Vídeo (Mudo Restrito)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 block mt-0.5 leading-relaxed">
                      Função restrita ao painel do instrutor: força o vídeo a rodar 100% mudo no mosaico e na visualização ampliada, impedindo que o visitante ative o som.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormAudioBlocked(!formAudioBlocked)}
                    className={`w-11 h-6 shrink-0 rounded-full transition-colors relative cursor-pointer ${
                      formAudioBlocked ? 'bg-amber-600' : 'bg-slate-800'
                    }`}
                    aria-label="Bloquear áudio do vídeo"
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        formAudioBlocked ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Exibir nos depoimentos da Home Switch */}
              {detectedType === 'video' && (
                <div className="pt-3 flex items-center justify-between border-t border-slate-800 bg-pink-500/5 p-3 rounded-xl border border-pink-500/20">
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span className="font-mono font-bold text-pink-200 block text-xs">
                        Exibir nos depoimentos da Home
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 block mt-0.5 leading-relaxed">
                      Quando ativado, este vídeo será exibido na nova seção de depoimentos da página inicial (máximo de 5 vídeos na Home).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormShowInTestimonials(!formShowInTestimonials)}
                    className={`w-11 h-6 shrink-0 rounded-full transition-colors relative cursor-pointer ${
                      formShowInTestimonials ? 'bg-pink-600' : 'bg-slate-800'
                    }`}
                    aria-label="Exibir nos depoimentos da Home"
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        formShowInTestimonials ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 font-mono text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs shadow-lg shadow-pink-900/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingItem ? 'Atualizar Conteúdo' : 'Salvar na Galeria'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
