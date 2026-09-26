'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bike, ShieldCheck, Home } from 'lucide-react';
import { AdminPanel } from '@/components/booking/AdminPanel';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 selection:bg-pink-500 selection:text-white relative">
      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-rose-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#060608]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="font-display font-black text-white text-base tracking-tight uppercase">
                ABC <span className="text-pink-500">do Pedal</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                Portal do Instrutor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/agendamento"
              className="text-xs font-mono font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
            >
              Agendamentos
            </Link>
            <Link
              href="/galeria-viva"
              className="text-xs font-mono font-bold text-pink-400 hover:text-white px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 transition-colors"
            >
              Galeria Viva
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 relative z-10">
        <AdminPanel />
      </main>
    </div>
  );
}
