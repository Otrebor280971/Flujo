import { formatMoney } from '../components/Format';
import type { Movement, Currency, UserAccount } from '../lib/db';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Settings } from 'lucide-react';

interface Props {
  events: Movement[];
  currency: Currency;
  accounts: UserAccount[];
  onEdit: (event: Movement) => void;
}

export default function Timeline({ events, currency, accounts, onEdit }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <span className="text-4xl mb-4">📭</span>
        <p>No hay movimientos registrados</p>
      </div>
    );
  }

  const sortedEvents = [...events].reverse();

  return (
    <div className="space-y-3 pb-4">
      {sortedEvents.map((event) => {
        const isIncome = event.category === 'income';
        const isTransfer = event.category === 'transfer';
        const isAdjustment = event.category === 'adjustment';

        let Icon = ArrowDownRight;
        let iconColor = 'text-red-400';
        let bgIcon = 'bg-red-500/10';

        if (isIncome) {
          Icon = ArrowUpRight;
          iconColor = 'text-emerald-400';
          bgIcon = 'bg-emerald-500/10';
        } else if (isTransfer) {
          Icon = ArrowRightLeft;
          iconColor = 'text-blue-400';
          bgIcon = 'bg-blue-500/10';
        } else if (isAdjustment) {
          Icon = Settings;
          iconColor = 'text-zinc-400';
          bgIcon = 'bg-zinc-500/10';
        }

        return (
          <div
            key={event.id}
            onClick={() => onEdit(event)}
            className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-white/5 cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-800/80"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${bgIcon}`}>
                <Icon size={20} className={iconColor} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{event.note || 'Sin nota'}</p>
                <p className="text-xs text-zinc-500 mt-0.5 flex gap-1.5 items-center">
                  <span>{new Date(event.date + 'T12:00:00').toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">
                    {accounts.find(a => a.id === event.account)?.name || 'Cuenta borrada'}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-base font-bold ${isIncome ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {isIncome ? '+' : isTransfer || isAdjustment ? '' : '-'}{formatMoney(event.amount, currency)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}