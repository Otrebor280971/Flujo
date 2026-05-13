import type { FinancialState, Alert } from '../lib/engine';
import type { Currency, RecurringItem, UserAccount } from '../lib/db';
import { formatMoney } from '../components/Format';

import {
  BellRing,
  AlertTriangle,
  Zap,
  Info,
  Landmark,
  Banknote,
  TrendingUp,
  CreditCard,
  Lock,
  Target,
  CalendarDays,
} from 'lucide-react';

interface Props {
  state: FinancialState | null;
  alerts: Alert[];
  currency: Currency;
  accounts: UserAccount[];
  onConfirmPending?: (item: RecurringItem) => void;
}

export default function Dashboard({
  state,
  alerts,
  currency,
  accounts,
  onConfirmPending,
}: Props) {
  if (!state) return null;

  const availableColor =
    state.availableToSpend > 500
      ? 'text-emerald-400'
      : state.availableToSpend > 200
        ? 'text-amber-400'
        : 'text-red-400';

  const availableBg =
    state.availableToSpend > 500
      ? 'from-emerald-500/20 to-emerald-600/5'
      : state.availableToSpend > 200
        ? 'from-amber-500/20 to-amber-600/5'
        : 'from-red-500/20 to-red-600/5';

  return (
    <div className="space-y-4 pb-4">
      {/* MAIN CARD */}
      <div
        className={`rounded-2xl bg-gradient-to-br ${availableBg} border border-white/10 p-6`}
      >
        <p className="text-sm text-zinc-400 mb-1">
          Puedes gastar hoy
        </p>

        <p
          className={`text-4xl font-bold tracking-tight ${availableColor}`}
        >
          {formatMoney(
            state.availableToSpend,
            currency
          )}
        </p>

        <p className="text-xs text-zinc-500 mt-2">
          débito + efectivo
        </p>
      </div>

      {/* PENDIENTES */}
      {state.pendingMovements.length > 0 &&
        onConfirmPending && (
          <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
              <BellRing size={18} />
              Pendientes de confirmar
            </div>

            <div className="space-y-2">
              {state.pendingMovements.map((item) => {
                // Calcular días faltantes reales para saber si mostrar el botón
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetDate = new Date();
                targetDate.setHours(0, 0, 0, 0);
                targetDate.setDate(item.day);
                
                const diffTime = targetDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const isOverdue = diffDays <= 0;
                const showButton = diffDays <= 10;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-3 border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {item.label}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {isOverdue
                          ? 'Atrasado/Para hoy'
                          : `En ${diffDays} días (día ${item.day})`}
                      </p>
                    </div>

                    {showButton && (
                      <button
                        onClick={() =>
                          onConfirmPending?.(item)
                        }
                        className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                      >
                        Confirmar{' '}
                        {formatMoney(
                          item.amount,
                          currency
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* ALERTAS */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const AlertIcon =
              alert.type === 'critical'
                ? AlertTriangle
                : alert.type === 'warning'
                  ? Zap
                  : Info;

            return (
              <div
                key={alert.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${alert.type === 'critical'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : alert.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
              >
                <AlertIcon
                  size={18}
                  className="shrink-0"
                />

                <span>{alert.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* BALANCES */}
      <div className="grid grid-cols-2 gap-3">
        {accounts.map((acc) => {
          const balance =
            state.accountsBalances?.[acc.id] || 0;

          let icon = Landmark;
          let color = 'text-emerald-400';
          let displayValue = balance;

          if (acc.type === 'cash') {
            icon = Banknote;
          }

          else if (acc.type === 'investment') {
            icon = TrendingUp;
            color = 'text-blue-400';
          }

          else if (acc.type === 'credit') {
            icon = CreditCard;
            color = 'text-red-400';
            displayValue = Math.abs(balance);
          }

          return (
            <MetricCard
              key={acc.id}
              label={acc.name}
              value={displayValue}
              color={color}
              currency={currency}
              icon={icon}
              negative={acc.type === 'credit'}
            />
          );
        })}

        {state.creditCards.length > 0 && (
          <MetricCard
            label="Comprometido"
            value={state.committedMoney}
            color="text-amber-400"
            currency={currency}
            icon={Lock}
          />
        )}

        {state.totalInvestment > 0 && (
          <MetricCard
            label="Inversión libre"
            value={state.freeInvestment}
            color="text-emerald-400"
            currency={currency}
            icon={Target}
          />
        )}
      </div>

      {/* TARJETAS */}
      {state.creditCards.length > 0 && (
        <div className="space-y-3">
          {state.creditCards.map((card) => {
            const usagePercent =
              card.limit > 0
                ? (card.debt / card.limit) * 100
                : 0;

            const usageColor =
              usagePercent < 50
                ? '#10b981'
                : usagePercent < 80
                  ? '#f59e0b'
                  : '#ef4444';

            return (
              <div
                key={card.id}
                className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-300 font-medium">
                      {card.name}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Corte día {card.cutoffDay} · Pago día{' '}
                      {card.paymentDay}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-zinc-400">
                      Disponible
                    </p>

                    <p className="text-sm font-semibold text-zinc-200">
                      {formatMoney(
                        card.remaining,
                        currency
                      )}
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        usagePercent,
                        100
                      )}%`,
                      backgroundColor: usageColor,
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-zinc-500">
                  <span>
                    {formatMoney(card.debt, currency)}{' '}
                    usado
                  </span>

                  <span>
                    {usagePercent.toFixed(0)}%
                  </span>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <CreditCard size={16} />
                      Próximo pago
                    </span>

                    <span className="text-sm font-medium text-zinc-200">
                      {card.daysUntilPayment} días
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <CalendarDays size={16} />
                      Próximo corte
                    </span>

                    <span className="text-sm font-medium text-zinc-200">
                      {card.daysUntilCutoff} días
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRÓXIMO INGRESO (Se oculta si no hay ingresos en el horizonte) */}
      {state.nextIncomeAmount !== undefined &&
        state.nextIncomeAmount > 0 && 
        state.daysUntilIncome !== undefined && (
          <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400 flex items-center gap-2">
                <CalendarDays size={16} />
                Próximo ingreso
              </span>

              <span className="text-sm font-medium text-emerald-400">
                {formatMoney(
                  state.nextIncomeAmount || 0,
                  currency
                )}{' '}
                en {state.daysUntilIncome || 0} días
              </span>
            </div>
          </div>
        )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  negative,
  currency,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  negative?: boolean;
  currency: Currency;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
      <div className="flex items-center gap-2 text-zinc-500 mb-1 overflow-hidden">
        {Icon && (
          <Icon size={16} className="shrink-0" />
        )}

        <span
          className="text-xs truncate"
          title={label}
        >
          {label}
        </span>
      </div>

      <p
        className={`text-lg font-semibold tracking-tight ${color} truncate`}
      >
        {negative ? '-' : ''}
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}