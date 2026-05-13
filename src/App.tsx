import { useState } from 'react';
import { useFinance } from './hooks/useFinance';
import Dashboard from './screens/Dashboard';
import Timeline from './screens/Timeline';
import CardScreen from './screens/CardScreen';
import InvestmentScreen from './screens/InvestmentScreen';
import Settings from './screens/Settings';
import AddMovement from './screens/AddMovement';
import AdjustAccounts from './screens/AdjustAccounts';
import EditMovement from './screens/EditMovement';
import type { MovementCategory, Movement } from './lib/db';
import {
  LayoutDashboard,
  Clock,
  CreditCard,
  TrendingUp,
  Settings as SettingsIcon,
  Plus,
} from 'lucide-react';

type Tab = 'dashboard' | 'timeline' | 'card' | 'investment' | 'settings';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'timeline', label: 'Historial', icon: Clock },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'investment', label: 'Inversion', icon: TrendingUp },
  { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const { state, alerts, movements, config, loading, addMovement, deleteMovement, updateConfig, refresh } = useFinance();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-zinc-950 flex flex-col max-w-lg mx-auto relative"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col max-w-lg mx-auto relative">
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-white/5 px-5 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Flujo</h1>
          <span className="text-xs text-zinc-600">Control de efectivo</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            alerts={alerts}
            currency={config?.currency || 'MXN'}
            accounts={config?.userAccounts || []}
            onConfirmPending={async (item) => {
              const today = new Date();
              const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

              await addMovement({
                category: item.type as MovementCategory,
                account: item.account,
                destination: item.destination,
                amount: item.amount,
                note: item.label,
                date: localDate,
              });
              refresh();
            }}
          />
        )}

        {activeTab === 'timeline' && (
          <Timeline
            events={movements}
            currency={config?.currency || 'MXN'}
            onEdit={setEditingMovement}
            accounts={config?.userAccounts || []}
          />
        )}

        {activeTab === 'card' && <CardScreen state={state} currency={config?.currency || 'MXN'} accounts={config.userAccounts} />}
        {activeTab === 'investment' && <InvestmentScreen state={state} config={config} currency={config?.currency || 'MXN'} />}
        {activeTab === 'settings' && <Settings config={config} onSave={updateConfig} onAdjustAccounts={() => setAdjustOpen(true)} />}
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all"
        style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-white/5">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${active ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
              >
                <Icon size={20} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AddMovement
        open={addOpen}
        onClose={() => setAddOpen(false)}
        accounts={config?.userAccounts || []}
        onSubmit={async (m) => {
          await addMovement(m);
          refresh();
        }}
      />

      <EditMovement
        open={!!editingMovement}
        movement={editingMovement}
        onClose={() => setEditingMovement(null)}
        accounts={config?.userAccounts || []}
        onSave={async (m) => {
          if (m.id) {
            await deleteMovement(m.id);
          }
          const { id, created_at, ...movementData } = m as any;
          await addMovement(movementData);
          setEditingMovement(null);
          refresh();
        }}
        onDelete={async (id) => {
          if (window.confirm('¿Seguro que quieres borrar este registro?')) {
            await deleteMovement(id);
            setEditingMovement(null);
            refresh();
          }
        }}
      />

      <AdjustAccounts
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        state={state}
        onAdjusted={refresh}
        accounts={config.userAccounts}
      />
    </div>
  );
}