import { useState, useEffect } from 'react';
import type { MovementCategory, UserAccount, AccountType } from '../lib/db';
import { X, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Wallet, Banknote, CreditCard, TrendingUp } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  onSubmit: (m: { category: MovementCategory; account: string; destination?: string; amount: number; note: string; date: string }) => void;
}

type Step = 'category' | 'account' | 'details';

const getAccountStyle = (type: AccountType) => {
  switch(type) {
    case 'debit': return { icon: Wallet, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'cash': return { icon: Banknote, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    case 'credit': return { icon: CreditCard, color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    case 'investment': return { icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    default: return { icon: Wallet, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
  }
};

export default function AddMovement({ open, onClose, accounts, onSubmit }: Props) {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<MovementCategory>('expense');
  const [account, setAccount] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open && accounts.length > 0) {
      setAccount(accounts[0].id);
      setDestination(accounts.length > 1 ? accounts[1].id : accounts[0].id);
    }
  }, [open, accounts]);

  if (!open) return null;

  const reset = () => {
    setStep('category');
    setCategory('expense');
    if (accounts.length > 0) {
      setAccount(accounts[0].id);
      setDestination(accounts.length > 1 ? accounts[1].id : accounts[0].id);
    }
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    const payload: Parameters<typeof onSubmit>[0] = {
      category,
      account,
      amount: numAmount,
      note: note.trim(),
      date,
    };
    if (category === 'transfer') {
      payload.destination = destination;
    }
    onSubmit(payload);
    handleClose();
  };

  const accountLabel = (id: string) => accounts.find((x) => x.id === id)?.name ?? 'Desconocida';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-zinc-950 border-t border-white/10 rounded-t-3xl p-6 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-100">
            {step === 'category' && 'Tipo de movimiento'}
            {step === 'account' && (category === 'income' ? 'Cuenta destino' : category === 'expense' ? 'Cuenta origen' : 'Cuentas')}
            {step === 'details' && 'Detalles'}
          </h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step 1: Category */}
        {step === 'category' && (
          <div className="space-y-3">
            <button onClick={() => { setCategory('income'); setStep('account'); }} className="w-full flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><ArrowDownLeft size={20} className="text-emerald-400" /></div>
              <div className="text-left"><p className="text-sm font-medium text-zinc-200">Ingreso</p><p className="text-xs text-zinc-500">Recibir dinero</p></div>
            </button>
            <button onClick={() => { setCategory('expense'); setStep('account'); }} className="w-full flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-red-500/5 hover:border-red-500/30 transition-all">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center"><ArrowUpRight size={20} className="text-red-400" /></div>
              <div className="text-left"><p className="text-sm font-medium text-zinc-200">Gasto</p><p className="text-xs text-zinc-500">Pagar o gastar</p></div>
            </button>
            <button onClick={() => { setCategory('transfer'); setStep('account'); }} className="w-full flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><ArrowRightLeft size={20} className="text-blue-400" /></div>
              <div className="text-left"><p className="text-sm font-medium text-zinc-200">Transferencia</p><p className="text-xs text-zinc-500">Mover entre cuentas</p></div>
            </button>
          </div>
        )}

        {/* Step 2: Account */}
        {step === 'account' && (
          <div className="space-y-4">
            {category === 'transfer' ? (
              <>
                <div>
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Desde</p>
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.map((a) => {
                      const { icon: Icon, color } = getAccountStyle(a.type);
                      return (
                        <button key={a.id} onClick={() => setAccount(a.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${account === a.id ? color : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                          <Icon size={16} /> {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">hacia</p>
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.filter((a) => a.id !== account).map((a) => {
                      const { icon: Icon, color } = getAccountStyle(a.type);
                      return (
                        <button key={a.id} onClick={() => setDestination(a.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${destination === a.id ? color : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                          <Icon size={16} /> {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">{category === 'income' ? 'Recibir en' : 'Pagar desde'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((a) => {
                    const { icon: Icon, color } = getAccountStyle(a.type);
                    return (
                      <button key={a.id} onClick={() => setAccount(a.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${account === a.id ? color : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                        <Icon size={16} /> {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={() => setStep('details')} disabled={category === 'transfer' && account === destination} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl py-3 transition-colors mt-2">
              Continuar
            </button>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-400">
              {category === 'income' && <ArrowDownLeft size={14} className="text-emerald-400" />}
              {category === 'expense' && <ArrowUpRight size={14} className="text-red-400" />}
              {category === 'transfer' && <ArrowRightLeft size={14} className="text-blue-400" />}
              <span>
                {category === 'income' && `Ingreso a ${accountLabel(account)}`}
                {category === 'expense' && `Gasto desde ${accountLabel(account)}`}
                {category === 'transfer' && `${accountLabel(account)} → ${accountLabel(destination)}`}
              </span>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Monto</label>
              <input type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-2xl font-semibold text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors" autoFocus />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Nota (opcional)</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Supermercado" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('account')} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl px-4 py-3 transition-colors">Atras</button>
              <button type="submit" disabled={!amount || parseFloat(amount) <= 0} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl py-3 transition-colors">Registrar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}