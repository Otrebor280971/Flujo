import { useState } from 'react';
import type { FinancialState } from '../lib/engine';
import { adjustAccount, type UserAccount } from '../lib/db'; // Asegúrate de exportar UserAccount en tu db.ts
import { formatMoney } from '../components/Format';
import { X, Save, Wallet, Banknote, CreditCard, TrendingUp } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  state: FinancialState | null;
  onAdjusted: () => void;
  accounts: UserAccount[]; // <-- Agregamos esta propiedad para recibir las cuentas reales
}

// Cuentas de respaldo por si acaso no llegan las configuradas
const FALLBACK_ACCOUNTS: UserAccount[] = [
  { id: 'debit', name: 'Débito', type: 'debit' },
  { id: 'cash', name: 'Efectivo', type: 'cash' },
  { id: 'credit', name: 'Tarjeta', type: 'credit' },
  { id: 'investment', name: 'Inversión', type: 'investment' },
];

// Helper para asignar colores e íconos dinámicamente según el tipo de cuenta
const getAccountStyles = (type: UserAccount['type']) => {
  switch (type) {
    case 'cash':
      return { icon: Banknote, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    case 'credit':
      return { icon: CreditCard, color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    case 'investment':
      return { icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'debit':
    default:
      return { icon: Wallet, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  }
};

export default function AdjustAccounts({ open, onClose, state, onAdjusted, accounts }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !state) return null;

  const displayAccounts = accounts && accounts.length > 0 ? accounts : FALLBACK_ACCOUNTS;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      for (const account of displayAccounts) {
        const newValue = parseFloat(values[account.id] || '0');
        // Leemos del nuevo mapa de balances que creaste en el engine
        const currentValue = state.accountsBalances?.[account.id] || 0; 

        if (newValue !== currentValue && !isNaN(newValue)) {
          const adjustment = newValue - currentValue;
          await adjustAccount(account.id, adjustment, `Ajuste de ${account.name}`);
        }
      }

      setValues({});
      onAdjusted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar cuenta');
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(values).some((key) => {
    if (!values[key]) return false;
    const parsed = parseFloat(values[key]);
    const current = state.accountsBalances?.[key] || 0;
    return !isNaN(parsed) && parsed !== current;
  });

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="w-full sm:w-full sm:max-w-sm bg-zinc-900 rounded-t-3xl sm:rounded-2xl border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Ajustar Cuentas</h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-zinc-400">Edita los valores de tus cuentas para corregir errores u omisiones.</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {displayAccounts.map((account) => {
                const { icon: Icon, color } = getAccountStyles(account.type);
                const currentValue = state.accountsBalances?.[account.id] || 0;
                const newValue = values[account.id] !== undefined ? parseFloat(values[account.id]) : currentValue;
                const changed = values[account.id] !== undefined && !isNaN(newValue) && newValue !== currentValue;

                return (
                  <div key={account.id} className={`rounded-xl border p-4 transition-colors ${changed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-900/60 border-white/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={18} className={color} />
                      <label className="text-sm font-medium text-zinc-200">{account.name}</label>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Valor actual</p>
                      <p className="text-lg font-semibold text-zinc-100">{formatMoney(currentValue)}</p>
                      <input
                        type="number"
                        placeholder="Nuevo valor"
                        value={values[account.id] || ''}
                        onChange={(e) => setValues({ ...values, [account.id]: e.target.value })}
                        className="w-full mt-2 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                      />
                      {changed && (
                        <p className="text-xs text-emerald-400 mt-2">
                          Diferencia: {newValue > currentValue ? '+' : ''}{formatMoney(newValue - currentValue)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-zinc-200 hover:bg-zinc-800/50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}