import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { FinancialState } from '../lib/engine';
import { adjustAccount, type UserAccount } from '../lib/db';
import { formatMoney } from '../components/Format';
import { X, Save, Wallet, Banknote, CreditCard, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  state: FinancialState | null;
  onAdjusted: () => void;
  accounts: UserAccount[];
}

const FALLBACK_ACCOUNTS: UserAccount[] = [
  { id: 'debit',      name: 'Débito',    type: 'debit' },
  { id: 'cash',       name: 'Efectivo',  type: 'cash' },
  { id: 'credit',     name: 'Tarjeta',   type: 'credit' },
  { id: 'investment', name: 'Inversión', type: 'investment' },
];

const getAccountStyles = (type: UserAccount['type']) => {
  switch (type) {
    case 'cash':       return { icon: Banknote,   iconColor: 'text-amber-400' };
    case 'credit':     return { icon: CreditCard, iconColor: 'text-red-400' };
    case 'investment': return { icon: TrendingUp, iconColor: 'text-blue-400' };
    case 'debit':
    default:           return { icon: Wallet,     iconColor: 'text-emerald-400' };
  }
};

// Crédito: internamente negativo, el usuario siempre ve/escribe positivo (deuda)
function toDisplayValue(raw: number, type: UserAccount['type']): number {
  return type === 'credit' ? Math.abs(raw) : raw;
}
function toStorageValue(display: number, type: UserAccount['type']): number {
  return type === 'credit' ? -Math.abs(display) : display;
}

export default function AdjustAccounts({ open, onClose, state, onAdjusted, accounts }: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayAccounts = accounts && accounts.length > 0 ? accounts : FALLBACK_ACCOUNTS;

  if (!open || !state) return null;

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 320);
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError(null);
      const promises: Promise<any>[] = [];

      for (const account of displayAccounts) {
        const rawValue = values[account.id];
        if (rawValue === undefined || rawValue === '') continue;
        const displayInput = parseFloat(rawValue);
        if (isNaN(displayInput) || displayInput < 0) continue;
        const targetStorage = toStorageValue(displayInput, account.type);
        const currentStorage = state.accountsBalances?.[account.id] ?? 0;
        const adjustment = targetStorage - currentStorage;
        if (Math.abs(adjustment) < 0.001) continue;
        promises.push(adjustAccount(account.id, adjustment, `Ajuste de ${account.name}`));
      }

      if (promises.length === 0) { onClose(); return; }
      await Promise.all(promises);
      setValues({});
      setSaving(false);
      onClose();
      onAdjusted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar cuenta');
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setValues({});
    setError(null);
    onClose();
  };

  const hasChanges = displayAccounts.some((acc) => {
    const raw = values[acc.id];
    if (raw === undefined || raw === '') return false;
    const displayInput = parseFloat(raw);
    if (isNaN(displayInput)) return false;
    const targetStorage = toStorageValue(displayInput, acc.type);
    const currentStorage = state.accountsBalances?.[acc.id] ?? 0;
    return Math.abs(targetStorage - currentStorage) >= 0.001;
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-lg bg-app-surface rounded-t-3xl border border-app-border flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-zinc-100">{t('adjustAccounts.title')}</h2>
          <button onClick={handleClose} disabled={saving} className="text-zinc-400 hover:text-zinc-300 transition-colors disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <p className="px-6 pb-3 text-sm text-zinc-400 shrink-0">
          {t('adjustAccounts.description')}
        </p>

        {error && (
          <div className="mx-6 mb-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-3 pb-2">
          {displayAccounts.map((account) => {
            const { icon: Icon, iconColor } = getAccountStyles(account.type);
            const isCredit = account.type === 'credit';

            const currentStorage = state.accountsBalances?.[account.id] ?? 0;
            const currentDisplay = toDisplayValue(currentStorage, account.type);

            const rawInput = values[account.id];
            const inputChanged = rawInput !== undefined && rawInput !== '';
            const displayInput = inputChanged ? parseFloat(rawInput) : NaN;
            const targetStorage = !isNaN(displayInput) ? toStorageValue(displayInput, account.type) : currentStorage;
            const changed = inputChanged && !isNaN(displayInput) && Math.abs(targetStorage - currentStorage) >= 0.001;

            const diffForUser = isCredit
              ? displayInput - currentDisplay   // deuda nueva - deuda vieja
              : displayInput - currentDisplay;  // saldo nuevo - saldo viejo

            const diffIsGood = isCredit ? diffForUser < 0 : diffForUser > 0;

            return (
              <div
                key={account.id}
                className={`rounded-xl border p-4 transition-colors ${
                  changed
                    ? isCredit && diffForUser < 0
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isCredit && diffForUser > 0
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-app-elevated/80 border-app-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={18} className={iconColor} />
                  <span className="text-sm font-medium text-zinc-200">{account.name}</span>
                  {/* Etiqueta discreta para crédito */}
                  {isCredit && (
                    <span className="ml-auto text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {t('adjustAccounts.creditcard')}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Fila: label izquierda, valor derecha */}
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs text-subtle">
                      {isCredit ? t('adjustAccounts.currentdebt') : t('adjustAccounts.currentBalance')}
                    </p>
                    <p className="text-base font-semibold text-zinc-100">
                      {formatMoney(currentDisplay)}
                    </p>
                  </div>

                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder={isCredit
                      ? `Ej: ${currentDisplay.toFixed(2)}  ${t('adjustAccounts.totaldebt')}`
                      : t('adjustAccounts.placeholder', { value: currentDisplay.toFixed(2) })
                    }
                    value={rawInput ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [account.id]: e.target.value }))}
                    onFocus={handleInputFocus}
                    disabled={saving}
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                  />

                  {/* Diferencia: solo flecha + monto, sin texto explicativo */}
                  {changed && !isNaN(diffForUser) && Math.abs(diffForUser) >= 0.001 && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${diffIsGood ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diffIsGood
                        ? <ArrowDown size={13} />
                        : <ArrowUp size={13} />
                      }
                      {formatMoney(Math.abs(diffForUser))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-6 pt-4 border-t border-app-border bg-app-surface flex gap-3"
          style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
        >
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl border border-app-border text-zinc-200 hover:bg-app-bg/70 transition-colors font-medium disabled:opacity-50"
          >
            {t('adjustAccounts.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? t('adjustAccounts.saving') : t('adjustAccounts.save')}
          </button>
        </div>
      </div>
    </div>
  );
}