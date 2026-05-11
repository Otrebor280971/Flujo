import type { FinancialState, Alert } from '../lib/engine';
import type { Currency, RecurringItem, UserAccount } from '../lib/db';
import { formatMoney } from '../components/Format';

interface Props {
  state: FinancialState | null;
  alerts: Alert[];
  currency: Currency;
  accounts: UserAccount[]; // <-- Nueva propiedad
  onConfirmPending?: (item: RecurringItem) => void;
}

export default function Dashboard({ state, alerts, currency, accounts, onConfirmPending }: Props) {
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
      {/* Main Card */}
      <div className={`rounded-2xl bg-gradient-to-br ${availableBg} border border-white/10 p-6`}>
        <p className="text-sm text-zinc-400 mb-1">Puedes gastar hoy</p>
        <p className={`text-4xl font-bold tracking-tight ${availableColor}`}>
          {formatMoney(state.availableToSpend, currency)}
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          débito + efectivo
        </p>
      </div>

      {/* Pending Confirmations */}
      {state.pendingMovements.length > 0 && onConfirmPending && (
        <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
            <span className="text-lg">🔔</span>
            Pendientes de confirmar
          </div>
          <div className="space-y-2">
            {state.pendingMovements.map((item) => {
              const isOverdue = new Date().getDate() >= item.day;
              return (
                <div key={item.id} className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                    <p className="text-xs text-zinc-500">
                      {isOverdue ? 'Atrasado/Para hoy ' : 'Programado para el '} día {item.day}
                    </p>
                  </div>
                  <button
                    onClick={() => onConfirmPending?.(item)}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    Confirmar {formatMoney(item.amount, currency)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const iconSymbol = alert.type === 'critical' ? '⚠️' : alert.type === 'warning' ? '⚡' : 'ℹ️';
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
                <span className="text-lg shrink-0">{iconSymbol}</span>
                <span>{alert.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Balance Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cuentas Dinámicas */}
        {accounts.map((acc) => {
          // Extraemos el balance desde el estado. Si no existe, es 0.
          const balance = state.accountsBalances?.[acc.id] || 0;
          
          let emoji = '🏦';
          let color = 'text-emerald-400';
          let isNegative = false;

          if (acc.type === 'cash') emoji = '💵';
          else if (acc.type === 'investment') { emoji = '📈'; color = 'text-blue-400'; }
          else if (acc.type === 'credit') { 
            emoji = '💳'; 
            color = 'text-red-400'; 
            // Mostramos el balance como negativo si es deuda de tarjeta
            isNegative = balance > 0; 
          }

          return (
            <MetricCard
              key={acc.id}
              label={acc.name}
              value={balance}
              color={color}
              currency={currency}
              emoji={emoji}
              negative={isNegative}
            />
          );
        })}

        {/* Métricas Globales (Siempre visibles al final de las cuentas) */}
        <MetricCard
          label="Comprometido"
          value={state.committedMoney}
          color="text-amber-400"
          currency={currency}
          emoji="🔒"
        />
        <MetricCard
          label="Inversión libre"
          value={state.freeInvestment}
          color="text-emerald-400"
          currency={currency}
          emoji="🎯"
        />
      </div>

      {/* Card & Income Info */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Límite restante</span>
          <span className="text-sm font-medium text-zinc-200">
            {formatMoney(state.cardRemaining, currency)} / {formatMoney(state.cardLimit, currency)}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (state.cardRemaining / state.cardLimit) * 100)}%`,
              backgroundColor:
                state.cardRemaining / state.cardLimit > 0.5
                  ? '#10b981'
                  : state.cardRemaining / state.cardLimit > 0.2
                    ? '#f59e0b'
                    : '#ef4444',
            }}
          />
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400 flex items-center gap-2">
              💳 Próximo pago tarjeta
            </span>
            <span className="text-sm font-medium text-zinc-200">
              {state.daysUntilPayment} días
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400 flex items-center gap-2">
              📅 Próximo ingreso
            </span>
            <span className="text-sm font-medium text-emerald-400">
              {formatMoney(state.nextIncomeAmount || 0, currency)} en {state.daysUntilIncome} días
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  negative,
  currency,
  emoji,
}: {
  label: string;
  value: number;
  color: string;
  negative?: boolean;
  currency: Currency;
  emoji?: string; // <-- Propiedad opcional para emojis dinámicos
}) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
      <div className="flex items-center gap-2 text-zinc-500 mb-1 overflow-hidden">
        <span className="text-lg shrink-0">{emoji || '📊'}</span>
        <span className="text-xs truncate" title={label}>{label}</span>
      </div>
      <p className={`text-lg font-semibold ${color} truncate`}>
        {negative ? '-' : ''}
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}