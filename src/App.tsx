import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from './hooks/useFinance';
import Dashboard from './screens/Dashboard';
import Timeline from './screens/Timeline';
import CardScreen from './screens/CardScreen';
import InvestmentScreen from './screens/InvestmentScreen';
import Settings from './screens/Settings';
import AddMovement from './screens/AddMovement';
import AdjustAccounts from './screens/AdjustAccounts';
import EditMovement from './screens/EditMovement';
import Tutorial, { useTutorial } from './screens/Tutorial';
import ScreenHeader from './components/ui/ScreenHeader';
import BottomNav from './components/ui/BottomNav';
import type { MovementCategory, Movement } from './lib/db';
import { LayoutDashboard, Clock, CreditCard, TrendingUp, Settings as SettingsIcon, Plus } from 'lucide-react';

type Tab = 'dashboard' | 'timeline' | 'card' | 'investment' | 'settings';

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const { show: showTutorial, dismiss: dismissTutorial, reopen: reopenTutorial, isFirstTime } = useTutorial();

  const { state, alerts, movements, config, loading, addMovement, deleteMovement, updateConfig, refresh, } = useFinance();

  // ── back-button handling ──────────────────────────────────────────────────
  useEffect(() => {
    window.history.pushState({ tab: activeTab }, '');
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (showTutorial) { dismissTutorial(); window.history.pushState({ tab: activeTab }, ''); return; }
      if (editingMovement) { setEditingMovement(null); window.history.pushState({ tab: activeTab }, ''); return; }
      if (addOpen) { setAddOpen(false); window.history.pushState({ tab: activeTab }, ''); return; }
      if (adjustOpen) { setAdjustOpen(false); window.history.pushState({ tab: activeTab }, ''); return; }
      if (activeTab !== 'dashboard') { setActiveTab('dashboard'); window.history.pushState({ tab: 'dashboard' }, ''); return; }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, addOpen, adjustOpen, editingMovement, showTutorial]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    window.history.pushState({ tab }, '');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',  label: t('nav.dashboard'),  icon: LayoutDashboard },
    { id: 'timeline',   label: t('nav.timeline'),   icon: Clock },
    { id: 'card',       label: t('nav.card'),       icon: CreditCard },
    { id: 'investment', label: t('nav.investment'), icon: TrendingUp },
    { id: 'settings',  label: t('nav.settings'),   icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg max-w-lg mx-auto relative flex flex-col">
      <ScreenHeader title={t('app.title')} subtitle={t('app.subtitle')} />

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
              const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
                .toISOString().split('T')[0];
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
          <CardScreen state={state} currency={config?.currency || 'MXN'} accounts={config.userAccounts} />
        )}
        {activeTab === 'investment' && (
          <InvestmentScreen state={state} config={config} currency={config?.currency || 'MXN'} />
        )}
        {activeTab === 'settings' && (
          <Settings
            config={config}
            onSave={updateConfig}
            onAdjustAccounts={() => setAdjustOpen(true)}
            onOpenTutorial={reopenTutorial}
          />
        )}
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed z-40 w-14 h-14 rounded-full flex items-center justify-center bg-cyan-300 text-black shadow-[0_8px_30px_rgba(103,232,249,0.25)] active:scale-95 transition-all"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)',
          right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))',
        }}
      >
        <Plus size={24} />
      </button>

      <BottomNav tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      <AddMovement
        open={addOpen}
        onClose={() => setAddOpen(false)}
        accounts={config?.userAccounts || []}
        onSubmit={async (m) => { await addMovement(m); refresh(); }}
      />

      <EditMovement
        open={!!editingMovement}
        movement={editingMovement}
        onClose={() => setEditingMovement(null)}
        accounts={config?.userAccounts || []}
        onSave={async (m) => {
          const { id, created_at, ...movementData } = m as any;
          await addMovement(movementData);
          if (m.id) await deleteMovement(m.id);
          setEditingMovement(null);
          refresh();
        }}
        onDelete={async (id) => {
          if (window.confirm(t('editMovement.confirmDelete'))) {
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

      {/* ── Tutorial — siempre el último para quedar encima de todo ── */}
      <Tutorial open={showTutorial} onClose={dismissTutorial} isFirstTime={isFirstTime} />
    </div>
  );
}