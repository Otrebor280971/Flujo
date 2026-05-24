import { useState, useEffect, useCallback } from 'react';
import type { Movement, AppConfig } from '../lib/db';
import {
  DEFAULT_CONFIG,
  getMovements,
  getConfig,
  addMovement as dbAdd,
  deleteMovement as dbDelete,
  saveConfig as dbSaveConfig,
} from '../lib/db';
import type { FinancialState, Alert, TimelineEvent } from '../lib/engine';
import { calculateState, generateAlerts, generateTimeline } from '../lib/engine';

export function useFinance() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    ...DEFAULT_CONFIG,
    recurring: [...DEFAULT_CONFIG.recurring],
    userAccounts: DEFAULT_CONFIG.userAccounts.map((a) => ({ ...a })),
  });
  const [state, setState] = useState<FinancialState | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [movs, cfg] = await Promise.all([getMovements(), getConfig()]);

      // Only delete movements older than 6 months — use UTC consistently
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
      sixMonthsAgo.setUTCHours(0, 0, 0, 0);
      const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];

      const oldMovements = movs.filter((m) => m.date < cutoffDate);
      let currentMovs = movs;

      if (oldMovements.length > 0) {
        console.log(`Limpiando ${oldMovements.length} registros antiguos...`);
        await Promise.all(oldMovements.filter((m) => m.id).map((m) => dbDelete(m.id)));
        currentMovs = movs.filter((m) => m.date >= cutoffDate);
      }

      // Merge saved config with defaults to avoid missing fields on upgrade
      const mergedConfig: AppConfig = {
        ...DEFAULT_CONFIG,
        ...cfg,
        recurring: cfg.recurring ?? DEFAULT_CONFIG.recurring,
        userAccounts:
          cfg.userAccounts && cfg.userAccounts.length > 0
            ? cfg.userAccounts
            : DEFAULT_CONFIG.userAccounts,
      };

      setConfig(mergedConfig);
      setMovements(currentMovs);

      const s = calculateState(currentMovs, mergedConfig);
      setState(s);
      setAlerts(generateAlerts(s, mergedConfig));
      setTimeline(generateTimeline(currentMovs, mergedConfig));
    } catch (err) {
      console.error('Error refreshing finance state:', err);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addMovement = useCallback(
    async (m: Omit<Movement, 'id' | 'created_at'>) => {
      await dbAdd(m);
      await refresh();
    },
    [refresh]
  );

  const deleteMovement = useCallback(
    async (id: string) => {
      await dbDelete(id);
      await refresh();
    },
    [refresh]
  );

  const updateConfig = useCallback(
    async (cfg: AppConfig) => {
      await dbSaveConfig(cfg);
      await refresh();
    },
    [refresh]
  );

  return {
    movements,
    config,
    state,
    alerts,
    timeline,
    loading,
    addMovement,
    deleteMovement,
    updateConfig,
    refresh,
  };
}