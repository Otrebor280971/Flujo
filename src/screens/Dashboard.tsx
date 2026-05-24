import { useTranslation } from 'react-i18next';
import type { FinancialState, Alert } from '../lib/engine';
import type { Currency, RecurringItem, UserAccount, AppConfig } from '../lib/db';
import { formatMoney } from '../components/Format';
import Card from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import Section from '../components/ui/Section';
import {
  BellRing, AlertTriangle, Zap, Info,
  Landmark, Banknote, TrendingUp, CreditCard,
  Target, CalendarDays, ArrowUpRight, PiggyBank,
} from 'lucide-react';

interface Props {
  state: FinancialState | null;
  alerts: Alert[];
  currency: Currency;
  accounts: UserAccount[];
  config: AppConfig;
  onConfirmPending?: (item: RecurringItem) => void;
}

export default function Dashboard({ state, alerts, currency, accounts, config, onConfirmPending }: Props) {
  const { t } = useTranslation();

  if (!state) return null;

  const reallyAvail = state.reallyAvailable;

  const availableColor =
    reallyAvail > 800 ? 'text-cyan-300'
    : reallyAvail > 300 ? 'text-amber-300'
    : 'text-red-400';

  const investGoal = config.investment_monthly_goal || 0;
  const investContrib = state.monthlyInvestmentContributions;
  const investGoalPct = investGoal > 0 ? Math.min(100, (investContrib / investGoal) * 100) : 0;
  const investGoalMet = investGoal > 0 && investContrib >= investGoal;

  return (
    <div className="space-y-5">

      {/* MAIN CARD */}
      <Card highlight className="p-5">
        <p className="section-title mb-2">{t('dashboard.canSpendToday')}</p>
        <p className={`text-4xl font-semibold tracking-tight ${availableColor}`}>
          {formatMoney(reallyAvail, currency)}
        </p>
        {state.upcomingExpensesBeforeIncome > 0 ? (
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            {t('dashboard.includesCommitments', {
              amount: formatMoney(state.upcomingExpensesBeforeIncome, currency),
            })}
          </p>
        ) : (
          <p className="text-sm text-zinc-500 mt-3">
            {t('dashboard.debitPlusCash')} · {t('dashboard.noUpcomingCommitments')}
          </p>
        )}
      </Card>

      {/* PROYECCIÓN */}
      {state.daysUntilIncome !== undefined &&
        state.nextIncomeAmount !== undefined &&
        state.nextIncomeAmount > 0 && (
          <Card elevated className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="section-title">{t('dashboard.projection')}</p>
              <span className="text-xs text-zinc-500">
                {state.daysUntilIncome === 0
                  ? t('dashboard.today')
                  : t('dashboard.inDays', { days: state.daysUntilIncome })}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-zinc-500 mb-1">{t('dashboard.projectedBalance')}</p>
                <p className={`text-2xl font-semibold tracking-tight ${
                  state.projectedBalanceAtNextIncome > 0 ? 'text-zinc-100' : 'text-red-400'
                }`}>
                  {formatMoney(state.projectedBalanceAtNextIncome, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-1">{t('dashboard.nextIncome')}</p>
                <p className="text-sm font-medium text-emerald-300">
                  +{formatMoney(state.nextIncomeAmount, currency)}
                </p>
              </div>
            </div>
            {state.upcomingExpensesBeforeIncome > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t('dashboard.expensesBeforeIncome')}</span>
                <span className="text-red-400 font-medium">
                  -{formatMoney(state.upcomingExpensesBeforeIncome, currency)}
                </span>
              </div>
            )}
          </Card>
        )}

      {/* AHORRO + META */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 text-zinc-500">
            <PiggyBank size={15} className="opacity-70" />
            <span className="text-xs">{t('dashboard.monthlySavings')}</span>
          </div>
          <p className={`text-xl font-semibold tracking-tight ${
            state.monthlySavings >= 0 ? 'text-emerald-300' : 'text-red-400'
          }`}>
            {state.monthlySavings >= 0 ? '+' : ''}
            {formatMoney(state.monthlySavings, currency)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
            {formatMoney(state.monthlyIncome, currency)} {t('dashboard.incomeLabel')} ·{' '}
            {formatMoney(state.monthlyExpense, currency)} {t('dashboard.expenseLabel')}
          </p>
        </Card>

        {investGoal > 0 ? (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3 text-zinc-500">
              <Target size={15} className={investGoalMet ? 'text-violet-300' : 'opacity-70'} />
              <span className="text-xs">{t('dashboard.investmentGoal')}</span>
            </div>
            <p className={`text-xl font-semibold tracking-tight ${investGoalMet ? 'text-violet-300' : 'text-zinc-100'}`}>
              {formatMoney(investContrib, currency)}
            </p>
            <div className="mt-3 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-300 transition-all duration-500"
                style={{ width: `${investGoalPct}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              {investGoalMet
                ? t('dashboard.goalReached')
                : t('dashboard.remaining', { amount: formatMoney(investGoal - investContrib, currency) })}
            </p>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3 text-zinc-500">
              <ArrowUpRight size={15} className="opacity-70" />
              <span className="text-xs">{t('dashboard.toInvestment')}</span>
            </div>
            <p className="text-xl font-semibold tracking-tight text-violet-300">
              {formatMoney(state.monthlyInvestmentContributions, currency)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">{t('dashboard.thisMonth')}</p>
          </Card>
        )}
      </div>

      {/* PENDIENTES */}
      {state.pendingMovements.length > 0 && onConfirmPending && (
        <Section title={t('dashboard.pendingToConfirm')}>
          <Card className="p-4 space-y-3 border-indigo-500/10 bg-indigo-500/[0.03]">
            <div className="flex items-center gap-2 text-indigo-300">
              <BellRing size={16} />
              <span className="text-sm font-medium">{t('dashboard.pendingToConfirm')}</span>
            </div>
            <div className="space-y-2">
              {state.pendingMovements.map((item) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetDate = new Date();
                targetDate.setHours(0, 0, 0, 0);
                targetDate.setDate(item.day);
                const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays <= 0;

                return (
                  <div key={item.id} className="card p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {isOverdue
                          ? t('dashboard.overdue')
                          : t('dashboard.inDaysShort', { days: diffDays })}
                      </p>
                    </div>
                    <button
                      onClick={() => onConfirmPending(item)}
                      className="px-3 py-2 rounded-xl bg-indigo-400 text-black text-xs font-medium active:scale-95 transition-transform"
                    >
                      {t('dashboard.confirm')}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      {/* ALERTAS */}
      {alerts.length > 0 && (
        <Section title={t('dashboard.alerts')}>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const AlertIcon =
                alert.type === 'critical' ? AlertTriangle
                : alert.type === 'warning' ? Zap
                : Info;
              const styles =
                alert.type === 'critical'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : alert.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300';

              return (
                <div key={alert.id} className={`rounded-2xl border p-4 flex items-start gap-3 ${styles}`}>
                  <AlertIcon size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{alert.message}</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* BALANCES */}
      <Section title={t('dashboard.balances')}>
        <div className="grid grid-cols-2 gap-3">
          {accounts.map((acc) => {
            const balance = state.accountsBalances?.[acc.id] || 0;
            let icon: React.ElementType = Landmark;
            let color = 'text-cyan-300';
            let displayValue = balance;

            if (acc.type === 'cash') { icon = Banknote; color = 'text-emerald-300'; }
            else if (acc.type === 'investment') { icon = TrendingUp; color = 'text-violet-300'; }
            else if (acc.type === 'credit') { icon = CreditCard; color = 'text-rose-400'; displayValue = Math.abs(balance); }

            return (
              <MetricCard
                key={acc.id}
                label={acc.name}
                value={displayValue}
                currency={currency}
                icon={icon}
                color={color}
                negative={acc.type === 'credit'}
              />
            );
          })}
          {state.totalInvestment > 0 && (
            <MetricCard
              label={t('dashboard.freeInvestment')}
              value={state.freeInvestment}
              currency={currency}
              icon={Target}
              color="text-violet-300"
            />
          )}
        </div>
      </Section>

      {/* TARJETAS */}
      {state.creditCards.length > 0 && (
        <Section title={t('dashboard.cards')}>
          <div className="space-y-3">
            {state.creditCards.map((card) => {
              const usagePercent = card.limit > 0 ? (card.debt / card.limit) * 100 : 0;
              const usageColor =
                usagePercent < 50 ? '#86EFAC'
                : usagePercent < 80 ? '#FCD34D'
                : '#FB7185';

              return (
                <Card elevated key={card.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{card.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {t('dashboard.cutoffDay', { day: card.cutoffDay })} · {t('dashboard.paymentDay', { day: card.paymentDay })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">{t('dashboard.available')}</p>
                      <p className="text-sm font-medium text-zinc-100">{formatMoney(card.remaining, currency)}</p>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(usagePercent, 100)}%`, backgroundColor: usageColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                    <span>{formatMoney(card.debt, currency)} {t('dashboard.used')}</span>
                    <span>{usagePercent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <CalendarDays size={13} />
                      <span>{t('dashboard.paymentIn', { days: card.daysUntilPayment })}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-400">
                      <CreditCard size={13} />
                      <span>{t('dashboard.cutoffIn', { days: card.daysUntilCutoff })}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}