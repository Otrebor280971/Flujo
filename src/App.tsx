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

import ScreenHeader from './components/ui/screenHeader';
import BottomNav from './components/ui/BottomNav';

import type { MovementCategory, Movement } from './lib/db';

import {
  LayoutDashboard,
  Clock,
  CreditCard,
  TrendingUp,
  Settings as SettingsIcon,
  Plus,
} from 'lucide-react';

type Tab =
  | 'dashboard'
  | 'timeline'
  | 'card'
  | 'investment'
  | 'settings';

const tabs: {
  id: Tab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
  },
  {
    id: 'timeline',
    label: 'Historial',
    icon: Clock,
  },
  {
    id: 'card',
    label: 'Tarjeta',
    icon: CreditCard,
  },
  {
    id: 'investment',
    label: 'Inversión',
    icon: TrendingUp,
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: SettingsIcon,
  },
];

export default function App() {
  const [activeTab, setActiveTab] =
    useState<Tab>('dashboard');

  const [addOpen, setAddOpen] = useState(false);

  const [adjustOpen, setAdjustOpen] =
    useState(false);

  const [editingMovement, setEditingMovement] =
    useState<Movement | null>(null);

  const {
    state,
    alerts,
    movements,
    config,
    loading,
    addMovement,
    deleteMovement,
    updateConfig,
    refresh,
  } = useFinance();

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg max-w-lg mx-auto relative flex flex-col">
      <ScreenHeader
        title="Flujo"
        subtitle="Control de efectivo"
      />

      <main className="flex-1 overflow-y-auto screen-container">
        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            alerts={alerts}
            currency={config?.currency || 'MXN'}
            accounts={config?.userAccounts || []}
            config={config}
            onConfirmPending={async (item) => {
              const today = new Date();

              const localDate = new Date(
                today.getTime() -
                  today.getTimezoneOffset() * 60000
              )
                .toISOString()
                .split('T')[0];

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
            accounts={config?.userAccounts || []}
            onEdit={setEditingMovement}
          />
        )}

        {activeTab === 'card' && (
          <CardScreen
            state={state}
            currency={config?.currency || 'MXN'}
            accounts={config.userAccounts}
          />
        )}

        {activeTab === 'investment' && (
          <InvestmentScreen
            state={state}
            config={config}
            currency={config?.currency || 'MXN'}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            config={config}
            onSave={updateConfig}
            onAdjustAccounts={() =>
              setAdjustOpen(true)
            }
          />
        )}
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="
          fixed
          bottom-20
          right-4
          z-40
          w-14
          h-14
          rounded-full
          flex
          items-center
          justify-center
          bg-cyan-300
          text-black
          shadow-[0_8px_30px_rgba(103,232,249,0.25)]
          active:scale-95
          transition-all
        "
        style={{
          right:
            'max(1rem, calc((100vw - 32rem) / 2 + 1rem))',
        }}
      >
        <Plus size={24} />
      </button>

      <BottomNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

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
        onClose={() =>
          setEditingMovement(null)
        }
        accounts={config?.userAccounts || []}
        onSave={async (m) => {
          if (m.id) {
            await deleteMovement(m.id);
          }

          const {
            id,
            created_at,
            ...movementData
          } = m as any;

          await addMovement(movementData);

          setEditingMovement(null);

          refresh();
        }}
        onDelete={async (id) => {
          if (
            window.confirm(
              '¿Seguro que quieres borrar este registro?'
            )
          ) {
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