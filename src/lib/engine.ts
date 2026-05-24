import type { Movement, AppConfig, RecurringItem } from './db';

export interface CreditCardState {
  id: string;
  name: string;
  limit: number;
  debt: number;
  remaining: number;
  paymentDay: number;
  cutoffDay: number;
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
  /** Ahorro neto real del mes: ingresos - gastos (solo movimientos confirmados) */
  monthlySavings: number;
  /** Cuánto se ha enviado a inversión este mes */
  monthlyInvestmentContributions: number;
  debit: number;
  cash: number;
  availableToSpend: number;
  /**
   * Dinero realmente libre hasta el próximo ingreso:
   * saldo disponible - gastos fijos pendientes antes del próximo ingreso - crédito que hay que cubrir
   */
  reallyAvailable: number;
  /** Gastos fijos pendientes que caen ANTES del próximo ingreso */
  upcomingExpensesBeforeIncome: number;
  /** Proyección de saldo al llegar el próximo ingreso */
  projectedBalanceAtNextIncome: number;
  /** Excedente en débito sobre el límite configurado */
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
  config.userAccounts.forEach((acc) => { balances[acc.id] = 0; });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let monthlyInvestmentContributions = 0;

  // Identify investment account ids
  const investmentAccountIds = new Set(
    config.userAccounts.filter((a) => a.type === 'investment').map((a) => a.id)
  );

  movements.forEach((m) => {
    if (balances[m.account] === undefined) balances[m.account] = 0;

    const mDate = new Date(m.date + 'T12:00:00');
    const isCurrentMonth =
      mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;

    if (m.category === 'income' || m.category === 'adjustment') {
      balances[m.account] += m.amount;
      if (isCurrentMonth && m.category === 'income') monthlyIncome += m.amount;
    } else if (m.category === 'expense') {
      balances[m.account] -= m.amount;
      if (isCurrentMonth) monthlyExpense += m.amount;
    } else if (m.category === 'transfer') {
      balances[m.account] -= m.amount;
      if (m.destination) {
        if (balances[m.destination] === undefined) balances[m.destination] = 0;
        balances[m.destination] += m.amount;
        // Count transfers TO investment accounts this month
        if (isCurrentMonth && investmentAccountIds.has(m.destination)) {
          monthlyInvestmentContributions += m.amount;
        }
      }
    }
  });

  let totalAvailable = 0;
  let totalDebt = 0;
  let totalInvestment = 0;

  config.userAccounts.forEach((acc) => {
    const balance = balances[acc.id] || 0;
    if (acc.type === 'debit' || acc.type === 'cash') totalAvailable += balance;
    else if (acc.type === 'credit') totalDebt += Math.abs(balance);
    else if (acc.type === 'investment') totalInvestment += balance;
  });

  // Credit cards
  const creditCards: CreditCardState[] = config.userAccounts
    .filter((acc) => acc.type === 'credit')
    .map((acc: any) => {
      const debt = Math.abs(balances[acc.id] || 0);
      const limit = Number(acc.creditConfig?.limit ?? acc.card_limit ?? 0);
      const paymentDay = Number(acc.creditConfig?.payment_day ?? acc.card_payment_day ?? 1);
      const cutoffDay = Number(acc.creditConfig?.cutoff_day ?? acc.card_cutoff_day ?? 15);
      const remaining = Math.max(0, limit - debt);
      const daysUntilPayment = calculateDaysUntil(paymentDay);
      const daysUntilCutoff = calculateDaysUntil(cutoffDay);
      return { id: acc.id, name: acc.name, limit, debt, remaining, paymentDay, cutoffDay, daysUntilPayment, daysUntilCutoff };
    });

  const totalCardLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
  const totalCardRemaining = creditCards.reduce((acc, c) => acc + c.remaining, 0);

  const annualYieldRate = (config.investment_annual_yield || 0) / 100;
  const investmentYield = totalInvestment * annualYieldRate;
  const investmentYieldMonthly = investmentYield / 12;

  const recurring = config.recurring || [];
  const pendingRec = getPendingRecurring(movements, recurring);

  const pendingMovements = pendingRec.map((r) => ({
    id: r.id,
    type: r.type,
    account: r.account,
    destination: r.destination,
    amount: r.amount,
    day: r.day,
    label: r.label,
  }));

  // ─── Next income ───────────────────────────────────────────────
  const incomeRecurring = recurring.filter((r) => r.type === 'income');
  let nextIncomeAmount = 0;
  let daysUntilIncome: number | undefined = undefined;
  let nextIncomeDay = 0;

  if (incomeRecurring.length > 0) {
    let closestDays = Infinity;
    let closestAmount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const inc of incomeRecurring) {
      const isPending = pendingRec.some((p) => p.id === inc.id);
      const target = new Date();
      target.setHours(0, 0, 0, 0);
      target.setDate(inc.day);
      if (!isPending) target.setMonth(target.getMonth() + 1);

      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < closestDays) {
        closestDays = diffDays;
        closestAmount = inc.amount;
        nextIncomeDay = inc.day;
      }
    }

    if (closestDays !== Infinity) {
      daysUntilIncome = closestDays;
      nextIncomeAmount = closestAmount;
    }
  }

  // ─── Upcoming expenses before next income ──────────────────────
  // Look at pending recurring expenses that fall BEFORE the next income day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDate();

  let upcomingExpensesBeforeIncome = 0;

  if (daysUntilIncome !== undefined && daysUntilIncome > 0) {
    for (const r of pendingRec) {
      if (r.type !== 'expense') continue;

      // Calculate the date this expense falls on
      const expDate = new Date();
      expDate.setHours(0, 0, 0, 0);
      expDate.setDate(r.day);
      if (expDate < today) expDate.setMonth(expDate.getMonth() + 1);

      const daysUntilExp = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Only include if it falls BEFORE the next income
      if (daysUntilExp < daysUntilIncome) {
        upcomingExpensesBeforeIncome += r.amount;
      }
    }
  }

  // ─── Really available ──────────────────────────────────────────
  // What you can actually spend: available cash minus upcoming commitments
  // We do NOT subtract credit debt here because it's already tracked separately
  const reallyAvailable = Math.max(0, totalAvailable - upcomingExpensesBeforeIncome);

  // ─── Projected balance at next income ─────────────────────────
  const projectedBalanceAtNextIncome = totalAvailable - upcomingExpensesBeforeIncome + nextIncomeAmount;

  // ─── Debit excess over configured max ─────────────────────────
  const debitBalance = config.userAccounts
    .filter((a) => a.type === 'debit')
    .reduce((sum, a) => sum + (balances[a.id] || 0), 0);

  const debitMax = config.debit_max_balance || 0;
  const debitExcess = debitMax > 0 ? Math.max(0, debitBalance - debitMax) : 0;

  // ─── Monthly savings ───────────────────────────────────────────
  const monthlySavings = monthlyIncome - monthlyExpense;

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
    debit: balances['debit'] || 0,
    cash: balances['cash'] || 0,
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
    freeInvestment: Math.max(0, totalInvestment - totalDebt),
    investmentYield,
    investmentYieldMonthly,
    pendingMovements,
    creditCards,
    nextIncomeAmount,
    daysUntilIncome,
    daysUntilPayment: creditCards[0]?.daysUntilPayment || 0,
  };
}

export function generateAlerts(state: FinancialState, config?: AppConfig): Alert[] {
  const alerts: Alert[] = [];

  // Debit excess — move to investment
  if (state.debitExcess > 0) {
    alerts.push({
      id: 'debit-excess',
      type: 'info',
      title: 'Excedente en débito',
      message: `Tienes ${formatAmount(state.debitExcess)} por encima de tu límite de débito. ¿Lo mandas a inversión?`,
    });
  }

  // Low balance
  if (state.reallyAvailable < 200 && state.reallyAvailable >= 0) {
    alerts.push({
      id: 'low-balance',
      type: 'critical',
      title: 'Saldo ajustado',
      message: `Solo te quedan ${formatAmount(state.reallyAvailable)} realmente disponibles hasta tu próximo ingreso.`,
    });
  }

  // Investment goal progress
  if (config?.investment_monthly_goal && config.investment_monthly_goal > 0) {
    const goal = config.investment_monthly_goal;
    const contributed = state.monthlyInvestmentContributions;
    if (contributed < goal * 0.5) {
      alerts.push({
        id: 'investment-goal',
        type: 'info',
        title: 'Meta de inversión',
        message: `Llevas ${formatAmount(contributed)} de ${formatAmount(goal)} este mes a inversión.`,
      });
    }
  }

  // Credit card warnings
  state.creditCards.forEach((card) => {
    const usage = card.limit > 0 ? card.debt / card.limit : 0;
    if (usage >= 0.9) {
      alerts.push({
        id: `credit-${card.id}-critical`,
        type: 'critical',
        title: 'Tarjeta casi al límite',
        message: `${card.name} ha superado el 90% del límite.`,
      });
    } else if (usage >= 0.8) {
      alerts.push({
        id: `credit-${card.id}-warning`,
        type: 'warning',
        title: 'Tarjeta cerca del límite',
        message: `${card.name} utiliza más del 80% del límite.`,
      });
    }

    if (card.daysUntilPayment <= 3 && card.debt > 0) {
      alerts.push({
        id: `payment-${card.id}`,
        type: 'warning',
        title: 'Pago próximo',
        message: `El pago de ${card.name} vence en ${card.daysUntilPayment} día(s).`,
      });
    }
  });

  return alerts;
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function generateTimeline(movements: Movement[], config: AppConfig): TimelineEvent[] {
  const pendingRecurring = getPendingRecurring(movements, config.recurring || []);
  const now = new Date().toISOString().split('T')[0];

  const futureEvents: TimelineEvent[] = pendingRecurring.map((r) => {
    const dateObj = new Date();
    dateObj.setDate(r.day);
    if (dateObj.toISOString().split('T')[0] < now) {
      dateObj.setMonth(dateObj.getMonth() + 1);
    }
    return {
      type: r.type as any,
      date: dateObj.toISOString().split('T')[0],
      amount: r.amount,
      note: r.label,
      account: r.account,
    };
  });

  return futureEvents.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function getPendingRecurring(movements: Movement[], recurring: RecurringItem[]): RecurringItem[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthMovements = movements.filter((m) => {
    const d = new Date(m.date + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return recurring.filter(
    (r) => !thisMonthMovements.some((m) => m.note === r.label)
  );
}

function calculateDaysUntil(day: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(day);
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}