import { useState, useEffect } from 'react';
import type { Movement, UserAccount } from '../lib/db';
import { X, Save, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  movement: Movement | null;
  onClose: () => void;
  onSave: (m: Movement) => void;
  onDelete: (id: string) => void;
  accounts: UserAccount[];
}

export default function EditMovement({ open, movement, onClose, onSave, onDelete, accounts }: Props) {
  const [formData, setFormData] = useState<Partial<Movement>>({});

  useEffect(() => {
    if (movement) setFormData(movement);
  }, [movement]);

  if (!open || !movement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-zinc-100">Editar Movimiento</h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Monto</label>
            <input 
              type="number"
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-xl font-bold text-zinc-100"
              value={formData.amount || ''}
              onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Cuenta</label>
            <select 
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-zinc-200"
              value={formData.account || ''}
              onChange={e => setFormData({...formData, account: e.target.value})}
            >
              <option value="" disabled>Selecciona una cuenta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => onDelete(movement.id!)}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={18}/> Eliminar
            </button>
            <button 
              onClick={() => onSave(formData as Movement)}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Save size={18}/> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}