import type { FinancialState } from '../lib/engine';
import type { AppConfig, Currency } from '../lib/db';
import { formatMoney } from '../components/Format';
import { TrendingUp, Percent, Calendar, Unlock, Lock, Shield, Target, ArrowUpRight } from 'lucide-react';

interface Props {
  state: FinancialState | null;
  config: AppConfig;
  currency: Currency;
}

export default function InvestmentScreen({ state, config, currency }: Props) {
  if (!state) return null;

  if (state.investment <= 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <TrendingUp size={28} className="text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-2">Sin inversiones registradas</h2>
        <p className="text-sm text-subtle max-w-xs leading-relaxed">
          Agrega una cuenta de tipo inversión y registra movimientos para visualizar rendimiento, capital libre y proyecciones.
        </p>
      </div>
    );
  }

  const freePercent = state.investment > 0 ? (state.freeInvestment / state.investment) * 100 : 100;
  const committedPercent = 100 - freePercent;
  const yieldRate = config.investment_annual_yield;

  const goal = config.investment_monthly_goal || 0;
  const contributed = state.monthlyInvestmentContributions;
  const goalPct = goal > 0 ? Math.min(100, (contributed / goal) * 100) : 0;
  const goalMet = goal > 0 && contributed >= goal;
  const stillNeeded = Math.max(0, goal - contributed);

  return (
    <div className="space-y-4 pb-4">

      {/* Total */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-blue-400" />
          <span className="text-sm text-zinc-400">Inversión total</span>
        </div>
        <p className="text-3xl font-bold text-blue-400 mb-1">
          {formatMoney(state.investment, currency)}
        </p>
      </div>

      {/* ── META MENSUAL DE INVERSIÓN ── */}
      {goal > 0 && (
          <div className={`rounded-2xl border p-4 space-y-3 ${goalMet ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-app-elevated/90 border-app-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Target size={16} className={goalMet ? 'text-emerald-400' : 'text-zinc-400'} />
              Meta mensual
            </div>
            {goalMet && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                ¡Alcanzada!
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-subtle mb-1.5">
              <span>{formatMoney(contributed, currency)} enviados</span>
              <span>meta: {formatMoney(goal, currency)}</span>
            </div>
            <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${goalMet ? 'bg-emerald-400' : 'bg-blue-500'}`}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>

          {!goalMet && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <ArrowUpRight size={14} className="text-amber-400" />
              <span>Aún necesitas enviar <span className="text-amber-400 font-semibold">{formatMoney(stillNeeded, currency)}</span> este mes</span>
            </div>
          )}
        </div>
      )}

      {/* Aportaciones este mes (cuando no hay meta configurada) */}
      {goal === 0 && (
        <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
            <ArrowUpRight size={14} className="text-blue-400" />
            <span>Enviado a inversión este mes</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {formatMoney(contributed, currency)}
          </p>
          <p className="text-xs text-subtle mt-1">
            Configura una meta mensual en Ajustes para hacer seguimiento
          </p>
        </div>
      )}

      {/* Rendimiento anual */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Percent size={14} className="text-emerald-400" />
          <span>Rendimiento anual ({yieldRate}%)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-app-surface/80 p-3">
            <p className="text-xs text-subtle mb-1">Mensual estimado</p>
            <p className="text-lg font-semibold text-emerald-400">
              +{formatMoney(state.investmentYieldMonthly, currency)}
            </p>
          </div>
          <div className="rounded-xl bg-app-surface/80 p-3">
            <p className="text-xs text-subtle mb-1">Anual estimado</p>
            <p className="text-lg font-semibold text-emerald-400">
              +{formatMoney(state.investmentYield, currency)}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Calendar size={12} />
            <span>Proyección a 12 meses</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 mt-1">
            {formatMoney(state.investment, currency)} →{' '}
            <span className="text-emerald-400">{formatMoney(state.investment + state.investmentYield, currency)}</span>
          </p>
        </div>
      </div>

      {/* Distribución libre vs comprometido */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-3">
        <p className="text-sm text-zinc-400">Distribución</p>
        <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${freePercent}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${committedPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-400">Libre {freePercent.toFixed(0)}%</span>
          <span className="text-amber-400">Comprometido {committedPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-app-elevated/80 border border-app-border p-3">
          <div className="flex items-center gap-2 text-subtle mb-1">
            <Unlock size={16} />
            <span className="text-xs">Inversión libre</span>
          </div>
          <p className="text-lg font-semibold text-emerald-400">{formatMoney(state.freeInvestment, currency)}</p>
          <p className="text-xs text-subtle mt-1">Disponible para usar</p>
        </div>
        <div className="rounded-xl bg-app-elevated/80 border border-app-border p-3">
          <div className="flex items-center gap-2 text-subtle mb-1">
            <Lock size={16} />
            <span className="text-xs">Comprometido</span>
          </div>
          <p className="text-lg font-semibold text-amber-400">{formatMoney(state.committedMoney, currency)}</p>
          <p className="text-xs text-subtle mt-1">Reservado para tarjeta</p>
        </div>
      </div>

      {/* Resumen neto */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-2">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Shield size={14} />
          <span>Resumen</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-subtle">Total en inversión</span>
          <span className="text-zinc-200 font-medium">{formatMoney(state.investment, currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-subtle">Deuda tarjeta</span>
          <span className="text-red-400 font-medium">-{formatMoney(state.creditDebt, currency)}</span>
        </div>
        <div className="border-t border-app-border pt-2 flex justify-between text-sm">
          <span className="text-zinc-400">Neto libre</span>
          <span className="text-emerald-400 font-semibold">{formatMoney(state.freeInvestment, currency)}</span>
        </div>
      </div>
    </div>
  );
}