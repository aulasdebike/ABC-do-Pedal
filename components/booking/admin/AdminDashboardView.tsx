'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  DollarSign,
  FileText,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  ChevronRight,
  Award,
  CreditCard,
  Bell,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import {
  BookingRecord,
  formatDateBrazilian,
  getWeekdayName,
  getBookingVoucherUrl,
  isBookingVoucherPending,
  getABCDECompletionStats
} from '@/lib/booking-store';

interface AdminDashboardViewProps {
  bookings: BookingRecord[];
  onNavigate: (tab: any) => void;
  onSelectBooking: (booking: BookingRecord) => void;
  onApproveVoucher: (booking: BookingRecord) => void;
  onRequestReproveVoucher: (booking: BookingRecord) => void;
  onOpenVoucherModal: (url: string) => void;
}

export function AdminDashboardView({
  bookings,
  onNavigate,
  onSelectBooking,
  onApproveVoucher,
  onRequestReproveVoucher,
  onOpenVoucherModal
}: AdminDashboardViewProps) {
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Aulas de hoje
  const todaysClasses = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.slot?.date === todayStr &&
        b.status !== 'cancelado' &&
        b.status !== 'reserva-expirada'
    );
  }, [bookings, todayStr]);

  // 2. Próximas aulas
  const upcomingClasses = useMemo(() => {
    return bookings.filter(
      (b) =>
        (b.slot?.date || '') > todayStr &&
        b.status !== 'cancelado' &&
        b.status !== 'reserva-expirada'
    );
  }, [bookings, todayStr]);

  // 3. Reservas pendentes (aguardando agendamento ou pré-agendadas)
  const pendingReservations = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === 'pre-agendado' ||
        b.status === 'reserva-temporaria' ||
        b.status === 'aguardando-pagamento'
    );
  }, [bookings]);

  // 4. Comprovantes pendentes (em análise)
  const pendingVouchers = useMemo(() => {
    return bookings.filter((b) => isBookingVoucherPending(b));
  }, [bookings]);

  // 5. Alunos cadastrados
  const uniqueStudents = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      const key = (b.student?.whatsapp || '').replace(/\D/g, '') || b.student?.cpf || b.student?.fullName || b.id;
      set.add(key);
    });
    return Array.from(set);
  }, [bookings]);

  // 6. Certificados pendentes (alunos que atingiram 100% de conclusão no Método ABCDE)
  const readyCertificates = useMemo(() => {
    const studentMap = new Map<string, BookingRecord>();
    bookings.forEach((b) => {
      const key = (b.student?.whatsapp || '').replace(/\D/g, '') || b.student?.cpf || b.student?.fullName || b.id;
      if (!studentMap.has(key)) {
        studentMap.set(key, b);
      }
    });

    return Array.from(studentMap.values()).filter((b) => {
      const stats = getABCDECompletionStats(b);
      return stats.isFullyCompleted;
    });
  }, [bookings]);

  // 7. Faturamento total e do mês
  const financialSummary = useMemo(() => {
    const confirmedBookings = bookings.filter((b) =>
      ['pagamento-confirmado', 'agendamento-confirmado', 'confirmado', 'concluido'].includes(b.status)
    );

    const totalRevenue = confirmedBookings.reduce(
      (acc, b) => acc + (b.price || b.location?.price || 499),
      0
    );

    const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM
    const currentMonthRevenue = confirmedBookings
      .filter((b) => (b.slot?.date || b.createdAt || '').startsWith(currentMonthPrefix))
      .reduce((acc, b) => acc + (b.price || b.location?.price || 499), 0);

    return {
      totalRevenue,
      currentMonthRevenue,
      totalConfirmed: confirmedBookings.length
    };
  }, [bookings, todayStr]);

  // 8. Alertas operacionais (comprovantes rejeitados, aguardando novo pagamento ou 24h)
  const operationalAlerts = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === 'comprovante-rejeitado' ||
        b.status === 'comprovante-reprovado' ||
        b.status === 'aguardando-novo-pagamento'
    );
  }, [bookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="admin-dashboard-overview">
      {/* Top Banner Resumido */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-pink-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-mono text-[11px] font-bold border border-pink-500/30">
              Painel Operacional • ABC do Pedal
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Hoje: {formatDateBrazilian(todayStr)} ({getWeekdayName(todayStr)})
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
            Visão Geral dos Indicadores
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Painel resumido da operação. Clique em qualquer indicador para acessar diretamente a área correspondente.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('agenda')}
            className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-pink-950 flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver Agenda</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reservas')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Ver Reservas</span>
          </button>
        </div>
      </div>

      {/* Grid com os 8 Indicadores Resumidos Exatos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Aulas de Hoje */}
        <div
          onClick={() => onNavigate('agenda')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          id="card-indicador-aulas-hoje"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Aulas de Hoje</span>
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {todaysClasses.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-pink-400 flex items-center justify-between font-mono">
            <span>Acessar agenda de hoje</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Próximas Aulas */}
        <div
          onClick={() => onNavigate('agenda')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          id="card-indicador-proximas-aulas"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Próximas Aulas</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {upcomingClasses.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-indigo-400 flex items-center justify-between font-mono">
            <span>Ver próximos horários</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. Reservas Pendentes */}
        <div
          onClick={() => onNavigate('reservas')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          id="card-indicador-reservas-pendentes"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Reservas Pendentes</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {pendingReservations.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-sky-400 flex items-center justify-between font-mono">
            <span>Pré-agendamentos ativos</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Comprovantes Pendentes */}
        <div
          onClick={() => onNavigate('reservas')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm flex flex-col justify-between ${
            pendingVouchers.length > 0
              ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/20'
              : 'bg-slate-950 border-slate-800 hover:border-pink-500/60'
          }`}
          id="card-indicador-comprovantes-pendentes"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Comprovantes Pendentes</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                pendingVouchers.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <FileCheck className={`w-4 h-4 ${pendingVouchers.length > 0 ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className={`text-3xl font-black font-mono ${
              pendingVouchers.length > 0 ? 'text-amber-300' : 'text-white'
            }`}>
              {pendingVouchers.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-amber-400 flex items-center justify-between font-mono">
            <span>Aguardando análise</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 5. Alunos Cadastrados */}
        <div
          onClick={() => onNavigate('alunos')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          id="card-indicador-alunos-cadastrados"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Alunos Cadastrados</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {uniqueStudents.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-blue-400 flex items-center justify-between font-mono">
            <span>Gerenciar cadastros</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 6. Certificados Pendentes */}
        <div
          onClick={() => onNavigate('certificados')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          id="card-indicador-certificados-pendentes"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Certificados Disponíveis</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {readyCertificates.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-amber-400 flex items-center justify-between font-mono">
            <span>Emitir certificados</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 7. Faturamento */}
        <div
          onClick={() => onNavigate('relatorios')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          id="card-indicador-faturamento"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Faturamento no Mês</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              R$ {financialSummary.currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Total: R$ {financialSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 8. Alertas Operacionais */}
        <div
          onClick={() => onNavigate('reservas')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm flex flex-col justify-between ${
            operationalAlerts.length > 0
              ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/20'
              : 'bg-slate-950 border-slate-800 hover:border-pink-500/60'
          }`}
          id="card-indicador-alertas-operacionais"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-medium">Alertas Operacionais</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                operationalAlerts.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${operationalAlerts.length > 0 ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className={`text-3xl font-black font-mono ${
              operationalAlerts.length > 0 ? 'text-rose-400' : 'text-white'
            }`}>
              {operationalAlerts.length}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-rose-400 flex items-center justify-between font-mono">
            <span>Reprovações & Prazo 24h</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
