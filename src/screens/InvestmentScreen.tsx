import type { FinancialState } from '../lib/engine';
import type { AppConfig, Currency } from '../lib/db';
import { formatMoney } from '../components/Format';
import { TrendingUp, Percent, Calendar, Unlock, Lock, Shield } from 'lucide-react';

interface Props {
  state: FinancialState | null;
  config: AppConfig;
  currency: Currency;
}

export default function InvestmentScreen({ state, config, currency }: Props) {
  if (!state) return null;

  // NUEVO:
  if (state.investment <= 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <TrendingUp size={28} className="text-blue-400" />
        </div>

        <h2 className="text-lg font-semibold text-zinc-200 mb-2">
          Sin inversiones registradas
        </h2>

        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          Agrega una cuenta de tipo inversión y registra movimientos
          para visualizar rendimiento, capital libre y proyecciones.
        </p>
      </div>
    );
  }

  const freePercent =
    state.investment > 0
      ? (state.freeInvestment / state.investment) * 100
      : 100;

  const committedPercent = 100 - freePercent;

  const yieldRate = config.investment_annual_yield;

  return (
    <div className="space-y-4 pb-4">
      {/* Total */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-blue-400" />
          <span className="text-sm text-zinc-400">Inversion total</span>
        </div>
        <p className="text-3xl font-bold text-blue-400 mb-1">
          {formatMoney(state.investment, currency)}
        </p>
      </div>

      {/* Annual Yield Section */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Percent size={14} className="text-emerald-400" />
          <span>Rendimiento anual ({yieldRate}%)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500 mb-1">Mensual estimado</p>
            <p className="text-lg font-semibold text-emerald-400">
              +{formatMoney(state.investmentYieldMonthly, currency)}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500 mb-1">Anual estimado</p>
            <p className="text-lg font-semibold text-emerald-400">
              +{formatMoney(state.investmentYield, currency)}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Calendar size={12} />
            <span>Proyeccion a 12 meses</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 mt-1">
            {formatMoney(state.investment, currency)} → <span className="text-emerald-400">{formatMoney(state.investment + state.investmentYield, currency)}</span>
          </p>
        </div>
      </div>

      {/* Free vs Committed */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-3">
        <p className="text-sm text-zinc-400">Distribucion</p>
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${freePercent}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${committedPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-400">Libre {freePercent.toFixed(0)}%</span>
          <span className="text-amber-400">Comprometido {committedPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Unlock size={16} />
            <span className="text-xs">Inversion libre</span>
          </div>
          <p className="text-lg font-semibold text-emerald-400">
            {formatMoney(state.freeInvestment, currency)}
          </p>
          <p className="text-xs text-zinc-600 mt-1">Disponible para usar</p>
        </div>
        <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Lock size={16} />
            <span className="text-xs">Comprometido</span>
          </div>
          <p className="text-lg font-semibold text-amber-400">
            {formatMoney(state.committedMoney, currency)}
          </p>
          <p className="text-xs text-zinc-600 mt-1">Reservado para tarjeta</p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Shield size={14} />
          <span>Resumen</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Total en inversion</span>
          <span className="text-zinc-200 font-medium">{formatMoney(state.investment, currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Deuda tarjeta</span>
          <span className="text-red-400 font-medium">-{formatMoney(state.creditDebt, currency)}</span>
        </div>
        <div className="border-t border-white/5 pt-2 flex justify-between text-sm">
          <span className="text-zinc-400">Neto libre</span>
          <span className="text-emerald-400 font-semibold">{formatMoney(state.freeInvestment, currency)}</span>
        </div>
      </div>
    </div>
  );
}