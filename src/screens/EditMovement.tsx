import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Movement, UserAccount, MovementCategory } from '../lib/db';
import { X, Save, Trash2, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';

interface Props {
  open: boolean;
  movement: Movement | null;
  onClose: () => void;
  onSave: (m: Movement) => void;
  onDelete: (id: string) => void;
  accounts: UserAccount[];
}

export default function EditMovement({
  open,
  movement,
  onClose,
  onSave,
  onDelete,
  accounts,
}: Props) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Partial<Movement>>({});

  useEffect(() => {
    if (movement) {
      setFormData({ ...movement });
    }
  }, [movement]);

  if (!open || !movement) return null;

  const CATEGORIES: {
    value: MovementCategory;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      value: 'income',
      label: t('editMovement.income'),
      icon: ArrowDownLeft,
      color: 'text-emerald-400',
    },
    {
      value: 'expense',
      label: t('editMovement.expense'),
      icon: ArrowUpRight,
      color: 'text-red-400',
    },
    {
      value: 'transfer',
      label: t('editMovement.transfer'),
      icon: ArrowRightLeft,
      color: 'text-blue-400',
    },
  ];

  const update = <K extends keyof Movement>(key: K, value: Movement[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.amount || Number(formData.amount) <= 0) return;

    onSave({
      ...movement,
      ...formData,
      amount: Number(formData.amount),
    } as Movement);
  };

  const isTransfer = formData.category === 'transfer';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-app-bg/80 backdrop-blur-sm">
      <div className="bg-app-surface border border-app-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <h2 className="font-bold text-zinc-100">
            {t('editMovement.title')}
          </h2>

          <button
            onClick={onClose}
            className="p-1 text-subtle hover:text-zinc-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Category */}
          <div>
            <label className="text-xs text-subtle block mb-2">
              {t('editMovement.type')}
            </label>

            <div className="flex gap-2">
              {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => update('category', value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all ${
                    formData.category === value
                      ? 'bg-app-elevated border-app-border'
                      : 'border-app-border bg-app-bg/50 text-subtle hover:text-zinc-400'
                  }`}
                >
                  <Icon
                    size={16}
                    className={formData.category === value ? color : ''}
                  />

                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-subtle block mb-1">
              {t('editMovement.amount')}
            </label>

            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xl font-bold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
              value={formData.amount ?? ''}
              onChange={(e) =>
                update('amount', parseFloat(e.target.value) || 0)
              }
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-subtle block mb-1">
              {t('editMovement.note')}
            </label>

            <input
              type="text"
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              value={formData.note ?? ''}
              onChange={(e) => update('note', e.target.value)}
              placeholder={t('editMovement.notePlaceholder')}
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-subtle block mb-1">
              {t('editMovement.date')}
            </label>

            <input
              type="date"
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50"
              value={formData.date ?? ''}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>

          {/* Account */}
          <div>
            <label className="text-xs text-subtle block mb-1">
              {formData.category === 'income'
                ? t('editMovement.destAccount')
                : t('editMovement.sourceAccount')}
            </label>

            <select
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50"
              value={formData.account ?? ''}
              onChange={(e) => update('account', e.target.value)}
            >
              <option value="" disabled>
                {t('editMovement.selectAccount')}
              </option>

              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          {isTransfer && (
            <div>
              <label className="text-xs text-subtle block mb-1">
                {t('editMovement.destAccount')}
              </label>

              <select
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                value={formData.destination ?? ''}
                onChange={(e) => update('destination', e.target.value)}
              >
                <option value="" disabled>
                  {t('editMovement.selectAccount')}
                </option>

                {accounts
                  .filter((a) => a.id !== formData.account)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onDelete(movement.id!)}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20"
            >
              <Trash2 size={18} />
              {t('editMovement.delete')}
            </button>

            <button
              onClick={handleSave}
              disabled={!formData.amount || Number(formData.amount) <= 0}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:bg-app-bg disabled:text-subtle text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Save size={18} />
              {t('editMovement.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}