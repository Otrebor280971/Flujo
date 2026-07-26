import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FinancialState } from '../lib/engine';
import type { Currency, UserAccount } from '../lib/db';
import { formatMoney } from '../components/Format';
import {
  CreditCard,
  TrendingDown,
  Shield,
  Calendar,
  Wallet,
} from 'lucide-react';

interface Props {
  state: FinancialState | null;
  currency: Currency;
  accounts: UserAccount[];
  onPayCard: (payment: {
    account: string;
    destination: string;
    amount: number;
    note: string;
    date: string;
  }) => void;
}

export default function CardScreen({
  state,
  currency,
  accounts,
  onPayCard,
}: Props) {
  const { t } = useTranslation();
  const [payingCardId, setPayingCardId] =
    useState<string | null>(null);

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

  const payingCard = state.creditCards.find(
    (card) => card.id === payingCardId
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
        const statementRemaining = cardState?.statementRemaining ?? 0;
        const openCycleBalance = cardState?.openCycleBalance ?? 0;
        const minimumPayment = cardState?.minimumPayment ?? 0;
        const estimatedInterest = cardState?.estimatedMonthlyInterest ?? 0;

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
                icon={<Calendar size={16} />}
                label={t('cardScreen.statementDue')}
                value={formatMoney(
                  statementRemaining,
                  currency
                )}
                valueColor={
                  statementRemaining > 0
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }
              />

              <DetailCard
                icon={<Wallet size={16} />}
                label={t('cardScreen.openCycle')}
                value={formatMoney(
                  openCycleBalance,
                  currency
                )}
                valueColor="text-zinc-200"
              />

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

            {(minimumPayment > 0 || estimatedInterest > 0) && (
              <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3 grid grid-cols-2 gap-3">
                <DetailInline
                  label={t('cardScreen.minimumPayment')}
                  value={formatMoney(
                    minimumPayment,
                    currency
                  )}
                />
                <DetailInline
                  label={t('cardScreen.estimatedInterest')}
                  value={formatMoney(
                    estimatedInterest,
                    currency
                  )}
                />
              </div>
            )}

            <button
              onClick={() => setPayingCardId(card.id)}
              disabled={debt <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              {t('cardScreen.payCard')}
            </button>
          </div>
        );
      })}

      {payingCard && (
        <PayCardModal
          card={payingCard}
          accounts={accounts}
          currency={currency}
          onClose={() => setPayingCardId(null)}
          onSubmit={(payment) => {
            onPayCard(payment);
            setPayingCardId(null);
          }}
        />
      )}
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

function DetailInline({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function PayCardModal({
  card,
  accounts,
  currency,
  onClose,
  onSubmit,
}: {
  card: FinancialState['creditCards'][number];
  accounts: UserAccount[];
  currency: Currency;
  onClose: () => void;
  onSubmit: (payment: {
    account: string;
    destination: string;
    amount: number;
    note: string;
    date: string;
  }) => void;
}) {
  const { t } = useTranslation();
  const fundingAccounts = accounts.filter(
    (account) => account.type !== 'credit'
  );
  const today = getLocalToday();
  const [sourceAccount, setSourceAccount] =
    useState(fundingAccounts[0]?.id || '');
  const [amount, setAmount] = useState(
    String(card.statementRemaining || card.debt)
  );

  const setPreset = (value: number) => {
    setAmount(value > 0 ? String(value) : '');
  };

  const numericAmount = Number(amount);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-zinc-950 border-t border-white/10 rounded-t-3xl p-6 pb-8 space-y-4">
        <div>
          <p className="text-xs text-zinc-500">
            {card.name}
          </p>
          <h2 className="text-lg font-semibold text-zinc-100">
            {t('cardScreen.payCard')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              setPreset(card.statementRemaining)
            }
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left"
          >
            <p className="text-xs text-zinc-500">
              {t('cardScreen.statementBalance')}
            </p>
            <p className="text-sm font-semibold text-zinc-100">
              {formatMoney(
                card.statementRemaining,
                currency
              )}
            </p>
          </button>
          <button
            onClick={() => setPreset(card.debt)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left"
          >
            <p className="text-xs text-zinc-500">
              {t('cardScreen.totalDebt')}
            </p>
            <p className="text-sm font-semibold text-zinc-100">
              {formatMoney(card.debt, currency)}
            </p>
          </button>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            {t('cardScreen.customAmount')}
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-2xl font-semibold text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            {t('cardScreen.payFrom')}
          </label>
          <select
            value={sourceAccount}
            onChange={(e) =>
              setSourceAccount(e.target.value)
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50"
          >
            {fundingAccounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
              >
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            onSubmit({
              account: sourceAccount,
              destination: card.id,
              amount: numericAmount,
              note: t('cardScreen.paymentNote', {
                name: card.name,
              }),
              date: today,
            })
          }
          disabled={
            !sourceAccount ||
            !numericAmount ||
            numericAmount <= 0
          }
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {t('cardScreen.confirmPayment')}
        </button>
      </div>
    </div>
  );
}

function getLocalToday() {
  const now = new Date();
  return new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split('T')[0];
}
