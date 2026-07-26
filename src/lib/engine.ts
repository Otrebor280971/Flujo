import i18n from './index';
import type { Movement, AppConfig, RecurringItem } from './db';

export interface CreditCardState {
  id: string;
  name: string;
  limit: number;
  debt: number;
  remaining: number;
  paymentDay: number;
  cutoffDay: number;
  annualInterestRate: number;
  minimumPaymentPercent: number;
  minimumPayment: number;
  estimatedMonthlyInterest: number;
  statementBalance: number;
  statementPaid: number;
  statementRemaining: number;
  openCycleBalance: number;
  lastCutoffDate: string;
  nextCutoffDate: string;
  nextPaymentDate: string;
  daysUntilPayment: number;
  daysUntilCutoff: number;
}

export interface FinancialState {
  accountsBalances: Record<string, number>;
  balances: Record<string, number>;
  totalAvailable: number;
  totalDebt: number;
  totalInvestment: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  monthlyInvestmentContributions: number;
  monthlyInvestmentGoal: number;
  debit: number;
  cash: number;
  availableToSpend: number;
  reallyAvailable: number;
  upcomingExpensesBeforeIncome: number;
  projectedBalanceAtNextIncome: number;
  debitExcess: number;
  creditDebt: number;
  investment: number;
  cardLimit: number;
  cardRemaining: number;
  committedMoney: number;
  freeInvestment: number;
  investmentYield: number;
  investmentYieldMonthly: number;
  pendingMovements: any[];
  creditCards: CreditCardState[];
  nextIncomeDate?: string;
  nextIncomeAmount?: number;
  nextCardPaymentDate?: string;
  daysUntilPayment?: number;
  daysUntilIncome?: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  message: string;
}

export interface TimelineEvent {
  id?: string;
  type?: 'income' | 'expense' | 'transfer';
  category?: string;
  date: string;
  amount: number;
  note: string;
  account: string;
}

export function calculateState(
  movements: Movement[],
  config: AppConfig
): FinancialState {
  const balances: Record<string, number> = {};

  config.userAccounts.forEach((acc) => { balances[acc.id] = 0 });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let monthlyInvestmentContributions = 0;

  const investmentAccountIds = new Set(
    config.userAccounts
      .filter((a) => a.type === 'investment')
      .map((a) => a.id)
  );

  movements.forEach((m) => {
    if (balances[m.account] === undefined) balances[m.account] = 0;

    const mDate = new Date(m.date + 'T12:00:00');

    const isCurrentMonth = mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;

    if (m.category === 'income' || m.category === 'adjustment') {
      balances[m.account] += m.amount;

      if (isCurrentMonth && m.category === 'income') { monthlyIncome += m.amount }
    } else if (m.category === 'expense') {
      balances[m.account] -= m.amount;

      if (isCurrentMonth) { monthlyExpense += m.amount }
    } else if (m.category === 'transfer') {
      balances[m.account] -= m.amount;

      if (m.destination) {
        if (balances[m.destination] === undefined) { balances[m.destination] = 0}
        balances[m.destination] += m.amount;
        if ( isCurrentMonth && investmentAccountIds.has(m.destination)) { 
          monthlyInvestmentContributions += m.amount 
        }
      }
    }
  });

  let totalAvailable = 0;
  let totalDebt = 0;
  let totalInvestment = 0;

  config.userAccounts.forEach((acc) => {
    const balance = balances[acc.id] || 0;

    if (acc.type === 'debit' || acc.type === 'cash') {
      totalAvailable += balance;
    } else if (acc.type === 'credit') {
      totalDebt += Math.abs(balance);
    } else if (acc.type === 'investment') {
      totalInvestment += balance;
    }
  });

  const creditCards: CreditCardState[] = config.userAccounts
    .filter((acc) => acc.type === 'credit')
    .map((acc: any) => {
      const debt = Math.abs(balances[acc.id] || 0);

      const limit = Number(
        acc.creditConfig?.limit ??
        acc.card_limit ??
        0
      );

      const paymentDay = Number(
        acc.creditConfig?.payment_day ??
        acc.card_payment_day ??
        1
      );

      const cutoffDay = Number(
        acc.creditConfig?.cutoff_day ??
        acc.card_cutoff_day ??
        15
      );

      const annualInterestRate = Number(
        acc.creditConfig?.annual_interest_rate ??
        acc.card_annual_interest_rate ??
        0
      );

      const minimumPaymentPercent = Number(
        acc.creditConfig?.minimum_payment_percent ??
        acc.card_minimum_payment_percent ??
        0
      );

      const remaining = Math.max(0, limit - debt);

      const cycle = getCreditCycleDates(
        cutoffDay,
        paymentDay
      );

      const statement = calculateCreditStatement(
        movements,
        acc.id,
        cycle.lastCutoffDate,
        cycle.nextCutoffDate
      );

      const statementRemaining = Math.max(
        0,
        debt - statement.openCycleBalance
      );

      const monthlyInterestRate =
        annualInterestRate > 0
          ? annualInterestRate / 100 / 12
          : 0;

      const estimatedMonthlyInterest =
        statementRemaining *
        monthlyInterestRate;

      const minimumPayment =
        minimumPaymentPercent > 0
          ? Math.min(
              statementRemaining,
              statementRemaining *
                (minimumPaymentPercent / 100)
            )
          : 0;

      const daysUntilPayment =
        calculateDaysUntilDate(
          cycle.nextPaymentDate
        );

      const daysUntilCutoff =
        calculateDaysUntilDate(
          cycle.nextCutoffDate
        );

      return {
        id: acc.id,
        name: acc.name,
        limit,
        debt,
        remaining,
        paymentDay,
        cutoffDay,
        annualInterestRate,
        minimumPaymentPercent,
        minimumPayment,
        estimatedMonthlyInterest,
        statementBalance:
          statementRemaining +
          statement.statementPaid,
        statementPaid:
          statement.statementPaid,
        statementRemaining,
        openCycleBalance: Math.max(
          0,
          Math.min(
            debt,
            statement.openCycleBalance
          )
        ),
        lastCutoffDate: toDateInputValue(
          cycle.lastCutoffDate
        ),
        nextCutoffDate: toDateInputValue(
          cycle.nextCutoffDate
        ),
        nextPaymentDate: toDateInputValue(
          cycle.nextPaymentDate
        ),
        daysUntilPayment,
        daysUntilCutoff,
      };
    });

  const totalCardLimit = creditCards.reduce(
    (acc, c) => acc + c.limit,
    0
  );

  const totalCardRemaining = creditCards.reduce(
    (acc, c) => acc + c.remaining,
    0
  );

  const investmentAccounts = config.userAccounts.filter(
    (account) => account.type === 'investment'
  );

  const hasInvestmentSpecificConfig =
    investmentAccounts.some(
      (account) =>
        account.investmentConfig
          ?.annual_yield !== undefined ||
        account.investmentConfig
          ?.monthly_goal !== undefined
    );

  const monthlyInvestmentGoal =
    hasInvestmentSpecificConfig
      ? investmentAccounts.reduce(
          (sum, account) =>
            sum +
            (account.investmentConfig
              ?.monthly_goal || 0),
          0
        )
      : config.investment_monthly_goal || 0;

  const investmentYield =
    hasInvestmentSpecificConfig
      ? investmentAccounts.reduce(
          (sum, account) => {
            const balance =
              balances[account.id] || 0;

            const annualYieldRate =
              (account.investmentConfig
                ?.annual_yield || 0) / 100;

            return (
              sum +
              balance * annualYieldRate
            );
          },
          0
        )
      : totalInvestment *
        ((config.investment_annual_yield || 0) /
          100);

  const investmentYieldMonthly =
    investmentYield / 12;

  const recurring = config.recurring || [];

  const pendingRec = getPendingRecurring(
    movements,
    recurring
  );

  const pendingMovements = pendingRec.map((r) => ({
    id: r.id,
    type: r.type,
    account: r.account,
    destination: r.destination,
    amount: r.amount,
    day: r.day,
    label: r.label,
  }));

  const incomeRecurring = recurring.filter(
    (r) => r.type === 'income'
  );

  let nextIncomeAmount = 0;
  let daysUntilIncome: number | undefined = undefined;

  if (incomeRecurring.length > 0) {
    let closestDays = Infinity;
    let closestAmount = 0;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    for (const inc of incomeRecurring) {
      const isPending = pendingRec.some(
        (p) => p.id === inc.id
      );

      const target = new Date();

      target.setHours(0, 0, 0, 0);

      target.setDate(inc.day);

      if (!isPending) {
        target.setMonth(target.getMonth() + 1);
      }

      const diffDays = Math.ceil(
        (target.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (
        diffDays >= 0 &&
        diffDays < closestDays
      ) {
        closestDays = diffDays;
        closestAmount = inc.amount;
      }
    }

    if (closestDays !== Infinity) {
      daysUntilIncome = closestDays;
      nextIncomeAmount = closestAmount;
    }
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  let upcomingExpensesBeforeIncome = 0;

  if (
    daysUntilIncome !== undefined &&
    daysUntilIncome > 0
  ) {
    for (const r of pendingRec) {
      if (r.type !== 'expense') continue;

      const expDate = new Date();

      expDate.setHours(0, 0, 0, 0);

      expDate.setDate(r.day);

      if (expDate < today) {
        upcomingExpensesBeforeIncome += r.amount;
        continue;
      }

      const daysUntilExp = Math.ceil(
        (expDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (daysUntilExp < daysUntilIncome) {
        upcomingExpensesBeforeIncome += r.amount;
      }
    }
  }

  const reallyAvailable = Math.max(
    0,
    totalAvailable - upcomingExpensesBeforeIncome
  );

  const projectedBalanceAtNextIncome =
    totalAvailable -
    upcomingExpensesBeforeIncome +
    nextIncomeAmount;

  const debitBalance = config.userAccounts
    .filter((a) => a.type === 'debit')
    .reduce((sum, a) => sum + (balances[a.id] || 0), 0);

  const cashBalance = config.userAccounts
    .filter((a) => a.type === 'cash')
    .reduce((sum, a) => sum + (balances[a.id] || 0), 0);

  const debitMax =
    config.debit_max_balance || 0;

  const debitExcess =
    debitMax > 0
      ? Math.max(0, debitBalance - debitMax)
      : 0;

  const monthlySavings =
    monthlyIncome - monthlyExpense;

  return {
    balances,
    accountsBalances: balances,
    totalAvailable,
    totalDebt,
    totalInvestment,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    monthlyInvestmentContributions,
    monthlyInvestmentGoal,
    debit: debitBalance,
    cash: cashBalance,
    availableToSpend: totalAvailable,
    reallyAvailable,
    upcomingExpensesBeforeIncome,
    projectedBalanceAtNextIncome,
    debitExcess,
    creditDebt: totalDebt,
    investment: totalInvestment,
    cardLimit: totalCardLimit,
    cardRemaining: totalCardRemaining,
    committedMoney: totalDebt,
    freeInvestment: Math.max(
      0,
      totalInvestment - totalDebt
    ),
    investmentYield,
    investmentYieldMonthly,
    pendingMovements,
    creditCards,
    nextIncomeAmount,
    daysUntilIncome,
    daysUntilPayment:
      creditCards[0]?.daysUntilPayment || 0,
  };
}

export function generateAlerts(
  state: FinancialState,
  config?: AppConfig
): Alert[] {
  const alerts: Alert[] = [];

  if (state.debitExcess > 0) {
    alerts.push({
      id: 'debit-excess',
      type: 'info',
      title: i18n.t('alerts.debitExcessTitle'),
      message: i18n.t('alerts.debitExcess', {
        amount: formatAmount(state.debitExcess, config?.currency),
      }),
    });
  }

  if (
    state.reallyAvailable < 200 &&
    state.reallyAvailable > 0
  ) {
    alerts.push({
      id: 'low-balance',
      type: 'critical',
      title: i18n.t('alerts.lowBalanceTitle'),
      message: i18n.t('alerts.lowBalance', {
        amount: formatAmount(state.reallyAvailable, config?.currency),
      }),
    });
  }

  if (state.reallyAvailable <= 0) {
    alerts.push({
      id: 'no-balance',
      type: 'critical',
      title: i18n.t('alerts.noBalanceTitle'),
      message: i18n.t('alerts.noBalance', {
        amount: formatAmount(state.reallyAvailable, config?.currency),
      }),
    });
  }

  if (state.monthlyInvestmentGoal > 0) {
    const goal =
      state.monthlyInvestmentGoal;

    const contributed =
      state.monthlyInvestmentContributions;

    if (contributed < goal * 0.5) {
      alerts.push({
        id: 'investment-goal',
        type: 'info',
        title: i18n.t(
          'alerts.investmentGoalTitle'
        ),
        message: i18n.t(
          'alerts.investmentGoal',
          {
            contributed:
              formatAmount(contributed, config?.currency),
            goal: formatAmount(goal, config?.currency),
          }
        ),
      });
    }
  }

  state.creditCards.forEach((card) => {
    const usage =
      card.limit > 0
        ? card.debt / card.limit
        : 0;

    if (usage >= 0.9) {
      alerts.push({
        id: `credit-${card.id}-critical`,
        type: 'critical',
        title: i18n.t(
          'alerts.cardAtLimitTitle'
        ),
        message: i18n.t(
          'alerts.cardAtLimit',
          {
            name: card.name,
          }
        ),
      });
    } else if (usage >= 0.8) {
      alerts.push({
        id: `credit-${card.id}-warning`,
        type: 'warning',
        title: i18n.t(
          'alerts.cardNearLimitTitle'
        ),
        message: i18n.t(
          'alerts.cardNearLimit',
          {
            name: card.name,
          }
        ),
      });
    }

    if (
      card.daysUntilPayment <= 3 &&
      card.debt > 0
    ) {
      alerts.push({
        id: `payment-${card.id}`,
        type: 'warning',
        title: i18n.t(
          'alerts.paymentDueTitle'
        ),
        message: i18n.t(
          'alerts.paymentDue',
          {
            name: card.name,
            days: card.daysUntilPayment,
          }
        ),
      });
    }
  });

  return alerts;
}

function formatAmount(
  n: number,
  currency = 'MXN'
): string {
  const localeMap: Record<string, string> = {
    MXN: 'es-MX',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
  };

  const locale =
    localeMap[currency] ||
    (i18n.language === 'es'
      ? 'es-MX'
      : i18n.language);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function generateTimeline(
  movements: Movement[],
  config: AppConfig
): TimelineEvent[] {
  const pendingRecurring =
    getPendingRecurring(
      movements,
      config.recurring || []
    );

  const nowDate = new Date();
  const now = new Date(nowDate.getTime() - nowDate.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];

  const futureEvents: TimelineEvent[] =
    pendingRecurring.map((r) => {
      const dateObj = new Date();

      dateObj.setDate(r.day);

      if (dateObj.toISOString().split('T')[0] < now ) {
        dateObj.setMonth( dateObj.getMonth() + 1);
      }

      return {
        type: r.type as any,
        date: dateObj
          .toISOString()
          .split('T')[0],
        amount: r.amount,
        note: r.label,
        account: r.account,
      };
    });

  return futureEvents.sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );
}

function getPendingRecurring(
  movements: Movement[],
  recurring: RecurringItem[]
): RecurringItem[] {
  const now = new Date();

  const currentMonth = now.getMonth();

  const currentYear = now.getFullYear();

  const thisMonthMovements =
    movements.filter((m) => {
      const d = new Date(
        m.date + 'T12:00:00'
      );

      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

  return recurring.filter(
    (r) =>
      !thisMonthMovements.some(
        (m) => m.note?.trim().toLowerCase() === r.label?.trim().toLowerCase()
      )
  );
}

function calculateCreditStatement(
  movements: Movement[],
  cardId: string,
  lastCutoffDate: Date,
  nextCutoffDate: Date
) {
  let closedCharges = 0;
  let openCycleBalance = 0;
  let statementPaid = 0;

  movements.forEach((m) => {
    const date = new Date(
      m.date + 'T12:00:00'
    );

    if (
      m.category === 'expense' &&
      m.account === cardId
    ) {
      if (date <= lastCutoffDate) {
        closedCharges += m.amount;
      } else if (date < nextCutoffDate) {
        openCycleBalance += m.amount;
      }
    }

    if (
      m.category === 'transfer' &&
      m.destination === cardId &&
      date > lastCutoffDate
    ) {
      statementPaid += m.amount;
    }
  });

  return {
    statementBalance: Math.max(0, closedCharges),
    statementPaid: Math.max(0, statementPaid),
    openCycleBalance: Math.max(0, openCycleBalance),
  };
}

function getCreditCycleDates(
  cutoffDay: number,
  paymentDay: number
) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const normalizedCutoffDay =
    normalizeMonthDay(cutoffDay);

  const normalizedPaymentDay =
    normalizeMonthDay(paymentDay);

  const lastCutoffDate =
    buildDateForMonthDay(
      today.getFullYear(),
      today.getMonth(),
      normalizedCutoffDay
    );

  if (lastCutoffDate > today) {
    lastCutoffDate.setMonth(
      lastCutoffDate.getMonth() - 1
    );
  }

  const nextCutoffDate = new Date(
    lastCutoffDate
  );

  nextCutoffDate.setMonth(
    nextCutoffDate.getMonth() + 1
  );

  const nextPaymentDate =
    buildDateForMonthDay(
      lastCutoffDate.getFullYear(),
      lastCutoffDate.getMonth(),
      normalizedPaymentDay
    );

  if (normalizedPaymentDay <= normalizedCutoffDay) {
    nextPaymentDate.setMonth(
      nextPaymentDate.getMonth() + 1
    );
  }

  if (nextPaymentDate < today) {
    nextPaymentDate.setMonth(
      nextPaymentDate.getMonth() + 1
    );
  }

  return {
    lastCutoffDate,
    nextCutoffDate,
    nextPaymentDate,
  };
}

function buildDateForMonthDay(
  year: number,
  month: number,
  day: number
) {
  const date = new Date(year, month, 1);
  const lastDay = new Date(
    year,
    month + 1,
    0
  ).getDate();

  date.setDate(Math.min(day, lastDay));
  date.setHours(0, 0, 0, 0);

  return date;
}

function normalizeMonthDay(day: number) {
  if (!Number.isFinite(day)) return 1;

  return Math.min(
    31,
    Math.max(1, Math.trunc(day))
  );
}

function calculateDaysUntilDate(
  target: Date
): number {
  const now = new Date();

  now.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.ceil(
      (target.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function toDateInputValue(date: Date) {
  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60000
  );

  return local.toISOString().split('T')[0];
}
