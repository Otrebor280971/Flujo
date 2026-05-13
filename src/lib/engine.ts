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
  debit: number;
  cash: number;
  availableToSpend: number;
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

  config.userAccounts.forEach((acc) => {
    balances[acc.id] = 0;
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  // =================================
  // BALANCES
  // =================================
  movements.forEach((m) => {
    if (balances[m.account] === undefined) balances[m.account] = 0;

    const mDate = new Date(m.date + 'T12:00:00');
    const isCurrentMonth = mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;

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
      }
    }
  });

  // =================================
  // TOTALES
  // =================================
  let totalAvailable = 0;
  let totalDebt = 0;
  let totalInvestment = 0;

  config.userAccounts.forEach((acc) => {
    const balance = balances[acc.id] || 0;
    if (acc.type === 'debit' || acc.type === 'cash') totalAvailable += balance;
    else if (acc.type === 'credit') totalDebt += Math.abs(balance);
    else if (acc.type === 'investment') totalInvestment += balance;
  });

  // =================================
  // TARJETAS (Solución Final)
  // =================================
  const creditCards: CreditCardState[] = config.userAccounts
    .filter((acc) => acc.type === 'credit')
    .map((acc: any) => {
      const debt = Math.abs(balances[acc.id] || 0);

      // Usamos || en lugar de ?? y forzamos a que sea Número.
      // Si el creditConfig.limit es 0, buscará el acc.card_limit viejo.
      const limit = Number(acc.creditConfig?.limit || acc.card_limit || 0);
      const paymentDay = Number(acc.creditConfig?.payment_day || acc.card_payment_day || 1);
      const cutoffDay = Number(acc.creditConfig?.cutoff_day || acc.card_cutoff_day || 15);

      const remaining = Math.max(0, limit - debt);
      const daysUntilPayment = calculateDaysUntil(paymentDay);
      const daysUntilCutoff = calculateDaysUntil(cutoffDay);

      return {
        id: acc.id,
        name: acc.name,
        limit,
        debt,
        remaining,
        paymentDay,
        cutoffDay,
        daysUntilPayment,
        daysUntilCutoff,
      };
    });

  const totalCardLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
  const totalCardRemaining = creditCards.reduce((acc, c) => acc + c.remaining, 0);

  // =================================
  // INVERSIONES
  // =================================
  const annualYieldRate = (config.investment_annual_yield || 0) / 100;
  const investmentYield = totalInvestment * annualYieldRate;
  const investmentYieldMonthly = investmentYield / 12;

  // =================================
  // PENDIENTES
  // =================================
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

  // =================================
  // PROXIMO INGRESO (Lógica de Mes Siguiente)
  // =================================
  const incomeRecurring = recurring.filter((r) => r.type === 'income');
  
  let nextIncomeAmount = 0;
  let daysUntilIncome: number | undefined = undefined;

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

      if (!isPending) {
        target.setMonth(target.getMonth() + 1);
      }

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < closestDays) {
        closestDays = diffDays;
        closestAmount = inc.amount;
      }
    }

    if (closestDays !== Infinity) {
      daysUntilIncome = closestDays;
      nextIncomeAmount = closestAmount;
    }
  }

  return {
    balances,
    accountsBalances: balances,
    totalAvailable,
    totalDebt,
    totalInvestment,
    monthlyIncome,
    monthlyExpense,
    debit: balances['debit'] || 0,
    cash: balances['cash'] || 0,
    availableToSpend: totalAvailable,
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

export function generateAlerts(state: FinancialState): Alert[] {
  const alerts: Alert[] = [];
  state.creditCards.forEach((card) => {
    const usage = card.limit > 0 ? card.debt / card.limit : 0;
    if (usage >= 0.8) {
      alerts.push({
        id: `credit-${card.id}`,
        type: 'warning',
        title: 'Tarjeta cerca del límite',
        message: `${card.name} utiliza más del 80% del límite.`,
      });
    }
  });
  return alerts;
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

  return futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function getPendingRecurring(currentMonthMovements: Movement[], recurring: RecurringItem[]): RecurringItem[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthMovements = currentMonthMovements.filter((m) => {
    const d = new Date(m.date + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return recurring.filter((r) => !thisMonthMovements.some((m) => m.note === r.label));
}

function calculateDaysUntil(day: number) {
  const now = new Date();
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(day);

  if (target < now) {
    target.setMonth(target.getMonth() + 1);
  }

  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}