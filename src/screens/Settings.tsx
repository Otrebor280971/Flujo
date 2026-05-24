import { useState, useEffect } from 'react';
import type { AppConfig, RecurringItem, Currency, UserAccount } from '../lib/db';
import { DEFAULT_CONFIG } from '../lib/db';
import { formatMoney } from '../components/Format';
import { Icons } from "../components/icons";
import { ArrowUpRight } from 'lucide-react';

interface Props {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onAdjustAccounts?: () => void;
}

const CURRENCIES: Currency[] = ['MXN', 'USD', 'EUR'];

const FALLBACK_ACCOUNTS: UserAccount[] = [
  { id: 'debit', name: 'Débito', type: 'debit' },
  { id: 'cash', name: 'Efectivo', type: 'cash' },
  { id: 'credit', name: 'Tarjeta', type: 'credit' },
  { id: 'investment', name: 'Inversión', type: 'investment' },
];

export default function Settings({ config, onSave, onAdjustAccounts }: Props) {
  const [form, setForm] = useState<AppConfig>({
    ...config,
    recurring: [...(config.recurring || [])],
    userAccounts: [...(config.userAccounts?.length ? config.userAccounts : FALLBACK_ACCOUNTS)],
    investment_monthly_goal: config.investment_monthly_goal ?? 0,
    debit_max_balance: config.debit_max_balance ?? 0,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      ...config,
      recurring: [...(config.recurring || [])],
      userAccounts: [...(config.userAccounts?.length ? config.userAccounts : FALLBACK_ACCOUNTS)],
      investment_monthly_goal: config.investment_monthly_goal ?? 0,
      debit_max_balance: config.debit_max_balance ?? 0,
    });
  }, [config]);

  const update = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdjustBalances = () => {
    onSave(form);
    if (onAdjustAccounts) onAdjustAccounts();
  };

  const handleReset = () => {
    setForm({
      ...DEFAULT_CONFIG,
      recurring: [...(DEFAULT_CONFIG.recurring || [])],
      userAccounts: [...FALLBACK_ACCOUNTS],
      investment_monthly_goal: 0,
      debit_max_balance: 0,
    });
    setSaved(false);
  };

  const addAccount = () => {
    const newAccount: UserAccount = { id: crypto.randomUUID(), name: 'Nueva Cuenta', type: 'debit' };
    update('userAccounts', [...(form.userAccounts || []), newAccount]);
  };

  const updateAccount = (id: string, changes: Partial<UserAccount>) => {
    update('userAccounts', form.userAccounts.map((acc) => (acc.id === id ? { ...acc, ...changes } : acc)));
  };

  const removeAccount = (id: string) => {
    if (form.userAccounts.length <= 1) return;
    update('userAccounts', form.userAccounts.filter((acc) => acc.id !== id));
  };

  const addRecurring = (type: 'income' | 'expense') => {
    const defaultAccountId = form.userAccounts?.[0]?.id || 'debit';
    const newItem: RecurringItem = {
      id: crypto.randomUUID(),
      type,
      label: type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto',
      amount: 0,
      day: 1,
      account: defaultAccountId,
    };
    update('recurring', [...form.recurring, newItem]);
  };

  const updateRecurring = (id: string, changes: Partial<RecurringItem>) => {
    update('recurring', form.recurring.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  };

  const removeRecurring = (id: string) => {
    update('recurring', form.recurring.filter((r) => r.id !== id));
  };

  const incomes = form.recurring.filter((r) => r.type === 'income');
  const expenses = form.recurring.filter((r) => r.type === 'expense');
  const accountsList = form.userAccounts || FALLBACK_ACCOUNTS;

  const CurrencyIcon = Icons.currency;
  const InvestmentIcon = Icons.investment;
  const AccountsIcon = Icons.accounts;
  const IncomeIcon = Icons.fixincome;
  const ExpenseIcon = Icons.fixexpense;
  const SaveIcon = Icons.save;
  const ResetIcon = Icons.reset;
  const AddIcon = Icons.add;
  const WalletIcon = Icons.wallet;

  return (
    <div className="space-y-4 pb-4">
      {onAdjustAccounts && (
        <button
          onClick={handleAdjustBalances}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/5 hover:from-emerald-500/30 hover:to-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-medium rounded-xl py-3 transition-all"
        >
          <WalletIcon size={18} />
          Ajustar saldos de cuentas
        </button>
      )}

      {/* Moneda */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <CurrencyIcon size={18} />
          Moneda
        </div>
        <div className="flex gap-2">
          {CURRENCIES.map((curr) => (
            <button
              key={curr}
              onClick={() => update('currency', curr)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                form.currency === curr ? 'bg-emerald-600 text-white' : 'bg-app-surface text-zinc-300 hover:bg-app-elevated'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Inversión */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <InvestmentIcon size={18} />
          Inversión
        </div>
        <Field
          label="Rendimiento anual (%)"
          value={form.investment_annual_yield}
          onChange={(v) => update('investment_annual_yield', v)}
          max={100}
          step={0.1}
        />
        <Field
          label="Meta de inversión mensual"
          value={form.investment_monthly_goal}
          onChange={(v) => update('investment_monthly_goal', v)}
          currency={form.currency}
          step={100}
          hint="Cuánto quieres enviar a tu fondo cada mes"
        />
      </div>

      {/* Regla de excedente en débito */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <ArrowUpRight size={18} className="text-amber-400" />
          Regla de excedente
        </div>
        <Field
          label="Saldo máximo en débito"
          value={form.debit_max_balance}
          onChange={(v) => update('debit_max_balance', v)}
          currency={form.currency}
          step={100}
          hint="Si tu débito supera este monto, te avisaremos que muevas el excedente a inversión. Déjalo en 0 para desactivar."
        />
      </div>

      {/* Cuentas */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <AccountsIcon size={18} />
            Mis Cuentas
          </div>
          <button
            onClick={addAccount}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            <AddIcon size={18} />
            Agregar
          </button>
        </div>
        {accountsList.map((acc) => (
          <AccountRow
            key={acc.id}
            account={acc}
            onChange={(changes) => updateAccount(acc.id, changes)}
            onRemove={() => removeAccount(acc.id)}
            canRemove={accountsList.length > 1}
          />
        ))}
      </div>

      {/* Ingresos fijos */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <IncomeIcon size={18} />
            Ingresos fijos
          </div>
          <button
            onClick={() => addRecurring('income')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            <AddIcon size={18} />
            Agregar
          </button>
        </div>
        {incomes.map((item) => (
          <RecurringRow
            key={item.id}
            item={item}
            onChange={(changes) => updateRecurring(item.id, changes)}
            onRemove={() => removeRecurring(item.id)}
            currency={form.currency}
            accountsList={accountsList}
          />
        ))}
        {incomes.length === 0 && (
          <p className="text-xs text-subtle text-center py-2">Sin ingresos fijos</p>
        )}
      </div>

      {/* Gastos fijos */}
      <div className="rounded-2xl bg-app-elevated/90 border border-app-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <ExpenseIcon size={18} />
            Gastos fijos
          </div>
          <button
            onClick={() => addRecurring('expense')}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            <AddIcon size={18} />
            Agregar
          </button>
        </div>
        {expenses.map((item) => (
          <RecurringRow
            key={item.id}
            item={item}
            onChange={(changes) => updateRecurring(item.id, changes)}
            onRemove={() => removeRecurring(item.id)}
            currency={form.currency}
            accountsList={accountsList}
          />
        ))}
        {expenses.length === 0 && (
          <p className="text-xs text-subtle text-center py-2">Sin gastos fijos</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          <SaveIcon size={18} />
          {saved ? '¡Guardado!' : 'Guardar'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 bg-app-surface hover:bg-app-elevated text-zinc-300 font-medium rounded-xl px-4 py-3 transition-colors"
        >
          <ResetIcon size={18} />
          Reiniciar
        </button>
      </div>
    </div>
  );
}

function AccountRow({ account, onChange, onRemove, canRemove }: {
  account: UserAccount;
  onChange: (changes: Partial<UserAccount>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-app-surface/80 rounded-xl p-3">
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={account.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ej. BBVA, Efectivo Cartera..."
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none border-b border-app-border pb-1"
        />
        <select
          value={account.type}
          onChange={(e) => onChange({ type: e.target.value as UserAccount['type'] })}
          className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="debit">Débito</option>
          <option value="cash">Efectivo</option>
          <option value="credit">Crédito</option>
          <option value="investment">Inversión</option>
        </select>

        {account.type === 'credit' && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-subtle">Límite</label>
              <input
                type="number"
                placeholder="5000"
                value={account.creditConfig?.limit || ''}
                onChange={(e) => onChange({
                  creditConfig: {
                    ...account.creditConfig,
                    limit: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    payment_day: account.creditConfig?.payment_day,
                    cutoff_day: account.creditConfig?.cutoff_day,
                  },
                })}
                className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-subtle placeholder:text-subtle focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-subtle">Día pago</label>
              <input
                type="number"
                placeholder="1"
                value={account.creditConfig?.payment_day || ''}
                onChange={(e) => onChange({
                  creditConfig: {
                    ...account.creditConfig,
                    limit: account.creditConfig?.limit,
                    payment_day: e.target.value === '' ? undefined : parseInt(e.target.value),
                    cutoff_day: account.creditConfig?.cutoff_day,
                  },
                })}
                className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-subtle placeholder:text-subtle focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-subtle">Día corte</label>
              <input
                type="number"
                placeholder="15"
                value={account.creditConfig?.cutoff_day || ''}
                onChange={(e) => onChange({
                  creditConfig: {
                    ...account.creditConfig,
                    limit: account.creditConfig?.limit,
                    payment_day: account.creditConfig?.payment_day,
                    cutoff_day: e.target.value === '' ? undefined : parseInt(e.target.value),
                  },
                })}
                className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-subtle placeholder:text-subtle focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className={`shrink-0 font-semibold text-lg p-2 ${canRemove ? 'text-subtle hover:text-subtle transition-colors' : 'text-subtle cursor-not-allowed'}`}
      >
        ✕
      </button>
    </div>
  );
}

function RecurringRow({ item, onChange, onRemove, accountsList }: {
  item: RecurringItem;
  onChange: (changes: Partial<RecurringItem>) => void;
  onRemove: () => void;
  currency: Currency;
  accountsList: UserAccount[];
}) {
  return (
    <div className="space-y-2 bg-app-surface/80 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Nombre"
          className="flex-1 min-w-0 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none border-b border-app-border pb-1"
        />
        <button onClick={onRemove} className="text-subtle hover:text-red-400 transition-colors font-semibold text-lg shrink-0">✕</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-subtle block mb-1">Día</label>
          <input
            type="number"
            value={item.day || ''}
            onChange={(e) => onChange({ day: parseInt(e.target.value) || 0 })}
            min={1} max={31}
            className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-zinc-300 text-center focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-subtle block mb-1">Cantidad</label>
          <input
            type="number"
            value={item.amount || ''}
            onChange={(e) => onChange({ amount: parseFloat(e.target.value) || 0 })}
            min={0} step={0.01} placeholder="$0"
            className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-zinc-300 text-right focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-subtle block mb-1">Cuenta</label>
          <select
            value={item.account}
            onChange={(e) => onChange({ account: e.target.value })}
            className="w-full bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
          >
            {accountsList.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, max, step, currency, hint }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
  currency?: Currency;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs text-subtle mb-1 block">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        max={max}
        step={step}
        placeholder="0"
        className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
      />
      {currency && value > 0 && (
        <p className="text-xs text-subtle mt-1">{formatMoney(value, currency)}</p>
      )}
      {hint && <p className="text-xs text-subtle mt-1">{hint}</p>}
    </div>
  );
}