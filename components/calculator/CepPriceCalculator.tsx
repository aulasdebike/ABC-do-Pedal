'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  ExternalLink 
} from 'lucide-react';

export interface CepPriceCalculatorProps {
  onPriceCalculated?: (result: {
    cep: string;
    price: number;
    formattedPrice: string;
    address: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
  }) => void;
  defaultRegion?: 'sao_paulo' | 'abc_paulista' | 'outras_localidades';
  title?: string;
  subtitle?: string;
  className?: string;
}

export function CepPriceCalculator({
  onPriceCalculated,
  defaultRegion = 'sao_paulo',
  title = 'Calculadora de Preço por CEP',
  subtitle = 'Consulte valores e viabilidade de atendimento para aulas personalizadas.',
  className = ''
}: CepPriceCalculatorProps) {
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [region, setRegion] = useState<'sao_paulo' | 'abc_paulista' | 'outras_localidades'>(defaultRegion);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Auto-format CEP: 00000-000
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (val.length > 5) {
      val = `${val.slice(0, 5)}-${val.slice(5)}`;
    }
    setCep(val);
    if (error) setError(null);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCep = cep.replace(/\D/g, '');

    if (rawCep.length !== 8) {
      setError('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Serverless API call to /api/preco
      const res = await fetch('/api/preco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: rawCep,
          number: number.trim(),
          region: region,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Não foi possível calcular o preço para este CEP.');
        return;
      }

      setResult(data);

      if (data.eligible && onPriceCalculated) {
        onPriceCalculated({
          cep: rawCep,
          price: data.price,
          formattedPrice: data.formattedPrice,
          address: data.address,
          city: data.city,
          neighborhood: data.neighborhood,
          street: data.street,
          number: data.number,
        });
      }
    } catch (err: any) {
      console.error('Erro na chamada da API /api/preco:', err);
      setError('Falha de conexão com a calculadora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-slate-950 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleCalculate} className="space-y-4 mt-5">
        {/* Region Selector */}
        <div>
          <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
            Região de Atendimento:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sao_paulo', label: 'São Paulo' },
              { id: 'abc_paulista', label: 'ABC Paulista' },
              { id: 'outras_localidades', label: 'Outras Regiões' },
            ].map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => {
                  setRegion(reg.id as any);
                  setResult(null);
                  setError(null);
                }}
                className={`py-2 px-2 text-center rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  region === reg.id
                    ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-900/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* CEP and Number Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              CEP do Aluno:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                maxLength={9}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Número:
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ex: 120"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !cep.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-[#ff007f] hover:from-pink-500 hover:to-pink-600 text-white font-mono font-bold text-xs shadow-lg shadow-pink-900/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Calculando via Serverless API...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Consultar Endereço e Preço</span>
            </>
          )}
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div className="mt-5 pt-4 border-t border-slate-800 animate-fadeIn">
          {result.eligible ? (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Região Atendida Diretamente</span>
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {result.formattedPrice}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <p className="font-semibold text-white">{result.address}</p>
                {result.estimatedDistanceKm && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Distância estimada: ~{result.estimatedDistanceKm} km da base central.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>Atendimento Sob Demanda</span>
              </div>
              <p className="text-xs text-slate-300">
                {result.reason || 'Para esta localidade, o atendimento é realizado sob agendamento prévio com confirmação de deslocamento.'}
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/5511950438948?text=${encodeURIComponent(
                    `Olá, ABC do Pedal! Gostaria de consultar aula para o endereço: ${result.address || cep}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-mono font-bold transition-all"
                >
                  <span>Consultar no WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
