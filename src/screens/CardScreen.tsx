import { useTranslation } from 'react-i18next';
import type { FinancialState } from '../lib/engine';
import type { Currency, UserAccount } from '../lib/db';
import { formatMoney } from '../components/Format';
import {
  CreditCard,
  TrendingDown,
  Shield,
  Calendar,
} from 'lucide-react';

interface Props {
  state: FinancialState | null;
  currency: Currency;
  accounts: UserAccount[];
}

export default function CardScreen({
  state,
  currency,
  accounts,
}: Props) {
  const { t } = useTranslation();

  if (!state) return null;

  if (state.creditCards.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-900/70 border border-dashed border-white/10 p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
          <CreditCard size={26} className="text-zinc-500" />
        </div>

        <h2 className="text-lg font-semibold text-zinc-200 mb-2">
          {t('cardScreen.noCards')}
        </h2>

        <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
          {t('cardScreen.noCardsDesc')}
        </p>
      </div>
    );
  }

  const creditAccounts = accounts.filter(
    (acc) => acc.type === 'credit'
  );

  return (
    <div className="space-y-4 pb-4">
      {creditAccounts.map((card) => {
        const debt = Math.abs( state.balances[card.id] || 0);
        const limit = card.creditConfig?.limit || 0;
        const remaining = Math.max( 0, limit - debt);
        const usagePercent = limit > 0 ? (debt / limit) * 100 : 0;
        const barColor = usagePercent < 50 ? '#10b981' : usagePercent < 80 ? '#f59e0b' : '#ef4444';

        const cardState = state.creditCards.find(c => c.id === card.id);
        const daysUntilCutoff = cardState?.daysUntilCutoff ?? 0;
        const daysUntilPayment = cardState?.daysUntilPayment ?? 0;

        return (
          <div
            key={card.id}
            className="space-y-4"
          >
            {/* Card Visual */}
            <div className="rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <CreditCard
                    size={22}
                    className="text-red-400"
                  />
                </div>

                <span className="text-sm text-zinc-400">
                  {card.name}
                </span>
              </div>

              <p className="text-3xl font-bold tracking-tight text-red-400">
                {formatMoney(debt, currency)}
              </p>

              <p className="text-xs text-zinc-500">
                {t('cardScreen.currentDebt')}
              </p>
            </div>

            {/* Usage Bar */}
            <div className="rounded-2xl bg-zinc-900/80 border border-white/5 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  {t('cardScreen.limitUsage')}
                </span>

                <span className="text-zinc-200 font-medium">
                  {usagePercent.toFixed(0)}%
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      usagePercent
                    )}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-zinc-500">
                <span>
                  {formatMoney(debt, currency)}{' '}
                  {t('dashboard.used')}
                </span>

                <span>
                  {formatMoney(
                    remaining,
                    currency
                  )}{' '}
                  {t('dashboard.available').toLowerCase()}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              <DetailCard
                icon={<CreditCard size={16} />}
                label={t('cardScreen.totalLimit')}
                value={formatMoney(limit, currency)}
                valueColor="text-zinc-200"
              />

              <DetailCard
                icon={<TrendingDown size={16} />}
                label={t('cardScreen.available')}
                value={formatMoney(
                  remaining,
                  currency
                )}
                valueColor={
                  remaining > limit * 0.3
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              />

              <DetailCard
                icon={<Calendar size={16} />}
                label={t('cardScreen.daysToCutoff')}
                value={`${daysUntilCutoff}`}
                valueColor="text-zinc-200"
              />

              <DetailCard
                icon={<Shield size={16} />}
                label={t('cardScreen.daysToPayment')}
                value={`${daysUntilPayment}`}
                valueColor={
                  daysUntilPayment <= 5
                    ? 'text-red-400'
                    : 'text-zinc-200'
                }
              />
            </div>
          </div>
        );
      })}
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

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className={`text-lg font-semibold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}