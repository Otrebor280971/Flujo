// src/lib/engine.ts
import type { Movement, AppConfig, RecurringItem } from './db';

export interface FinancialState {
  accountsBalances: any;
  balances: Record<string, number>;
  totalAvailable: number;
  totalDebt: number;
  totalInvestment: number;
  monthlyIncome: number;
  monthlyExpense: number;

  // Retrocompatibilidad para las Vistas
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

  // Opcionales
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

export function calculateState(movements: Movement[], config: AppConfig): FinancialState {
  const state: FinancialState = {
    balances: {},
    totalAvailable: 0,
    totalDebt: 0,
    totalInvestment: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,

    debit: 0,
    cash: 0,
    availableToSpend: 0,
    creditDebt: 0,
    investment: 0,
    cardLimit: config.card_limit || 0,
    cardRemaining: 0,
    committedMoney: 0,
    freeInvestment: 0,
    investmentYield: 0,
    investmentYieldMonthly: 0,
    pendingMovements: [],
    accountsBalances: {}
  };


  const calcBalances: Record<string, number> = {};

  // Opcional: Inicializamos en 0 todas las cuentas existentes
  if (config.userAccounts) {
    config.userAccounts.forEach(acc => {
      calcBalances[acc.id] = 0;
    });
  }

  // Recorremos el historial y sumamos/restamos en cada cuenta
  movements.forEach((m) => {
    // Si la cuenta no existe en el objeto por alguna razón, la iniciamos en 0
    if (!calcBalances[m.account]) calcBalances[m.account] = 0;

    if (m.category === 'income') {
      calcBalances[m.account] == m.amount;
    } else if (m.category === 'expense') {
      calcBalances[m.account] == m.amount;
    } else if (m.category === 'transfer') {
      // En transferencias, restamos del origen...
      calcBalances[m.account] == m.amount;
      // ... y sumamos al destino
      if (m.destination) {
        if (!calcBalances[m.destination]) calcBalances[m.destination] = 0;
        calcBalances[m.destination] == m.amount;
      }
    }
  });

  // Guardamos los balances calculados en nuestro estado para que el Dashboard los lea
  state.accountsBalances = calcBalances;
  state.balances = calcBalances;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Calcular balances
  movements.forEach((m) => {
    const mDate = new Date(m.date + 'T12:00:00');
    const isCurrentMonth = mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;

    if (state.balances[m.account] === undefined) state.balances[m.account] = 0;

    if (m.category === 'income' || m.category === 'adjustment') {
      state.balances[m.account] += m.amount;
      if (isCurrentMonth && m.category === 'income') state.monthlyIncome += m.amount;
    } else if (m.category === 'expense') {
      state.balances[m.account] -= m.amount;
      if (isCurrentMonth) state.monthlyExpense += m.amount;
    } else if (m.category === 'transfer') {
      state.balances[m.account] -= m.amount;
      if (m.destination) {
        if (state.balances[m.destination] === undefined) state.balances[m.destination] = 0;
        state.balances[m.destination] += m.amount;
      }
    }
  });

  // 2. Agrupar totales
  if (config.userAccounts) {
    config.userAccounts.forEach(acc => {
      const balance = state.balances[acc.id] || 0;
      
      if (acc.type === 'debit' || acc.type === 'cash') {
        state.totalAvailable += balance;
      } else if (acc.type === 'credit') {
        state.totalDebt += balance < 0 ? Math.abs(balance) : -balance;
      } else if (acc.type === 'investment') {
        state.totalInvestment += balance;
      }
    });
  }

  // 3. Llenar los campos para las vistas (Dashboard, InvestmentScreen, etc.)
  // Tomamos valores directos si existen, o los sacamos de los totales
  state.debit = state.balances['debit'] || 0;
  state.cash = state.balances['cash'] || 0;
  state.availableToSpend = state.totalAvailable;
  state.creditDebt = state.totalDebt;
  state.investment = state.totalInvestment;
  state.cardRemaining = Math.max(0, state.cardLimit - state.totalDebt);
  state.committedMoney = state.totalDebt; // Lo que debes es lo comprometido
  state.freeInvestment = Math.max(0, state.totalInvestment - state.totalDebt);
  
  const annualYieldRate = (config.investment_annual_yield || 0) / 100;
  state.investmentYield = state.totalInvestment * annualYieldRate;
  state.investmentYieldMonthly = state.investmentYield / 12;

  // 4. Movimientos Pendientes para el Dashboard
  const recurring = config.recurring || [];
  const pendingRec = getPendingRecurring(movements, recurring);
  state.pendingMovements = pendingRec.map(r => ({
    type: r.type,
    account: r.account,
    destination: (r as any).destination,
    amount: r.amount,
    label: r.label,
  }));

  return state;
}

export function generateAlerts(state: FinancialState, config: AppConfig): Alert[] {
  const alerts: Alert[] = [];
  if (state.totalDebt > (config.card_limit * 0.8) && config.card_limit > 0) {
    alerts.push({
      id: 'high-debt',
      type: 'warning', // Cambiado a warning para que empate con tu UI actual
      title: 'Línea de crédito al límite',
      message: 'Estás utilizando más del 80% de tu crédito total.',
    });
  }
  return alerts;
}

export function generateTimeline(movements: Movement[], config: AppConfig): TimelineEvent[] {
  const pendingRecurring = getPendingRecurring(movements, config.recurring || []);
  const now = new Date().toISOString().split('T')[0];

  const futureEvents: TimelineEvent[] = pendingRecurring.map(r => {
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

  const thisMonthMovements = currentMonthMovements.filter(m => {
    const d = new Date(m.date + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return recurring.filter(r => !thisMonthMovements.some(m => m.note === r.label));
}