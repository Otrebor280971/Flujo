import type { FinancialState } from '../lib/engine';
import type { Currency } from '../lib/db';
import { formatMoney } from '../components/Format';
import { CreditCard, TrendingDown, Shield, Calendar } from 'lucide-react';

interface Props {
  state: FinancialState | null;
  currency: Currency;
}

export default function CardScreen({ state, currency }: Props) {
  if (!state) return null;

  const usagePercent = (state.creditDebt / state.cardLimit) * 100;
  const barColor =
    usagePercent < 50 ? '#10b981' : usagePercent < 80 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4 pb-4">
      {/* Card Visual */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">💳</span>
          <span className="text-sm text-zinc-400">Tarjeta de crédito</span>
        </div>
        <p className="text-3xl font-bold text-red-400 mb-1">
          {formatMoney(state.creditDebt, currency)}
        </p>
        <p className="text-xs text-zinc-500">Deuda actual</p>
      </div>

      {/* Usage Bar */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Uso del limite</span>
          <span className="text-zinc-200 font-medium">{usagePercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, usagePercent)}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{formatMoney(state.creditDebt, currency)} usado</span>
          <span>{formatMoney(state.cardRemaining, currency)} disponible</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCard
          icon={<CreditCard size={16} />}
          label="Limite total"
          value={formatMoney(state.cardLimit, currency)}
          valueColor="text-zinc-200"
        />
        <DetailCard
          icon={<TrendingDown size={16} />}
          label="Limite restante"
          value={formatMoney(state.cardRemaining, currency)}
          valueColor={state.cardRemaining > state.cardLimit * 0.3 ? 'text-emerald-400' : 'text-red-400'}
        />
        <DetailCard
          icon={<Shield size={16} />}
          label="Dinero comprometido"
          value={formatMoney(state.committedMoney, currency)}
          valueColor="text-amber-400"
        />
        <DetailCard
          icon={<Calendar size={16} />}
          label="Dias para pago"
          value={`${state.daysUntilPayment}`}
          valueColor={(state.daysUntilPayment ?? 0) <= 5 ? 'text-red-400' : 'text-zinc-200'}
        />
      </div>

      {/* Projection */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4">
        <p className="text-sm text-zinc-400 mb-2">Proyeccion al corte</p>
        <p className="text-lg font-semibold text-zinc-200">
          Deuda al cierre: {formatMoney(state.creditDebt, currency)}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Deberias reservar {formatMoney(state.committedMoney, currency)} para el pago
        </p>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
      <div className="flex items-center gap-2 text-zinc-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}