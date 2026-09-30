'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  User,
  Calendar,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  BookingRecord,
  formatDateBrazilian,
  getABCDECompletionStats
} from '@/lib/booking-store';

interface AdminCertificatesViewProps {
  bookings: BookingRecord[];
  onOpenCertificateModal: (booking: BookingRecord) => void;
  onNavigateToStudent: (booking: BookingRecord) => void;
}

export function AdminCertificatesView({
  bookings,
  onOpenCertificateModal,
  onNavigateToStudent
}: AdminCertificatesViewProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Agrupar bookings por aluno único mais recente
  const studentRecords = useMemo(() => {
    const studentMap = new Map<string, BookingRecord>();
    bookings.forEach((b) => {
      const key = (b.student?.whatsapp || '').replace(/\D/g, '') || b.student?.cpf || b.student?.fullName || b.id;
      const existing = studentMap.get(key);
      if (!existing || (b.createdAt || '') > (existing.createdAt || '')) {
        studentMap.set(key, b);
      }
    });

    return Array.from(studentMap.values()).map((b) => {
      const stats = getABCDECompletionStats(b);
      return {
        booking: b,
        stats,
        isReady: stats.isFullyCompleted,
        totalPercentage: stats.percent
      };
    });
  }, [bookings]);

  // Filtragem
  const filtered = useMemo(() => {
    return studentRecords.filter((item) => {
      const b = item.booking;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (b.student?.fullName || '').toLowerCase().includes(term) ||
        (b.student?.whatsapp || '').includes(term) ||
        (b.student?.cpf || '').includes(term) ||
        b.id.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterMode === 'ready') {
        return item.isReady;
      }
      if (filterMode === 'pending') {
        return !item.isReady;
      }
      return true;
    });
  }, [studentRecords, searchTerm, filterMode]);

  const readyCount = studentRecords.filter((s) => s.isReady).length;
  const pendingCount = studentRecords.filter((s) => !s.isReady).length;

  return (
    <div className="space-y-6 animate-in fade-in" id="admin-certificates-view">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
              Certificação Método ABCDE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total de alunos: {studentRecords.length}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Gestão e Emissão de Certificados</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Certificados oficiais de conclusão do Método ABCDE emitidos mediante o cumprimento das 20 habilidades motoras consolidadas.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
            <span className="text-lg font-black block text-emerald-400">{readyCount}</span>
            Disponíveis para Emissão
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono font-bold">
            <span className="text-lg font-black block text-white">{pendingCount}</span>
            Em Desenvolvimento
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, WhatsApp ou CPF..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-mono text-slate-500">Filtrar:</span>
          {[
            { id: 'all', label: `Todos (${studentRecords.length})` },
            { id: 'ready', label: `Disponíveis (${readyCount})` },
            { id: 'pending', label: `Em Andamento (${pendingCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <Award className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
          <p className="text-sm font-bold text-slate-400">Nenhum certificado encontrado para o filtro selecionado.</p>
          <p className="text-xs text-slate-600">Altere a busca ou o status para encontrar os registros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ booking: b, stats, isReady, totalPercentage }) => {
            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-lg ${
                  isReady
                    ? 'bg-slate-950/90 border-amber-500/50 shadow-amber-950/10 ring-1 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      Inscrição #{b.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isReady
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isReady ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Elegível (100%)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{totalPercentage}% Concluído</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base leading-snug">
                      {b.student?.fullName || 'Aluno'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      WhatsApp: {b.student?.whatsapp || 'Não informado'}
                    </p>
                    {b.student?.guardian && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        Resp: {b.student.guardian.fullName} ({b.student.guardian.relation})
                      </p>
                    )}
                  </div>

                  {/* Barra de progresso */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Progresso Pedagógico:</span>
                      <span className={`font-bold ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {stats.conqueredCount} de {stats.totalSkills} habilidades
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isReady ? 'bg-gradient-to-r from-emerald-500 to-amber-400' : 'bg-pink-600'
                        }`}
                        style={{ width: `${totalPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Resumo das etapas */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
                    <span className="text-slate-400">Etapa Atual:</span>
                    <span className="text-pink-400 font-bold">
                      {b.currentABCDE || 'A - Autoconhecimento'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 mt-4">
                  {isReady ? (
                    <button
                      type="button"
                      onClick={() => onOpenCertificateModal(b)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-slate-950" />
                      <span>Visualizar Certificado</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigateToStudent(b)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      <span>Gerenciar Habilidades</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
