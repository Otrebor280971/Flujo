import { useState, useEffect, useCallback } from 'react';
import type {
  Movement,
  AppConfig,
} from '../lib/db';
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
  const [config, setConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG, recurring: [...DEFAULT_CONFIG.recurring] });
  const [state, setState] = useState<FinancialState | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [movs, cfg] = await Promise.all([getMovements(), getConfig()]);

    setConfig(cfg);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];

    const oldMovements = movs.filter(m => m.date < cutoffDate);

    if (oldMovements.length > 0) {
      console.log(`Limpiando ${oldMovements.length} registros antiguos...`);
      for (const m of oldMovements) {
        if (m.id) await dbDelete(m.id);
      }
      const updatedMovs = await getMovements();
      setMovements(updatedMovs);

      const s = calculateState(updatedMovs, cfg);
      setState(s);
      setAlerts(generateAlerts(s, cfg));
      setTimeline(generateTimeline(updatedMovs, cfg));
    } else {
      setMovements(movs);

      const s = calculateState(movs, cfg);
      setState(s);
      setAlerts(generateAlerts(s, cfg));
      setTimeline(generateTimeline(movs, cfg));
    }
  }, []);

  useEffect(() => {
    refresh().then(() => setLoading(false));
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

  return { movements, config, state, alerts, timeline, loading, addMovement, deleteMovement, updateConfig, refresh };
}
