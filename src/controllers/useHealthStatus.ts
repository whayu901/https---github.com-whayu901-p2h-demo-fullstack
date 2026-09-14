import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { checkHealth, useDatabase } from '../models';
import { resolveApiUrl } from './settings-service';

export type HealthState = 'checking' | 'reachable' | 'unreachable';

export interface HealthStatus {
  state: HealthState;
  /** The API base URL actually in effect (override, if set, else the `.env` default). */
  apiUrl: string;
}

const POLL_INTERVAL_MS = 8000;
const HEALTH_TIMEOUT_MS = 3000;

/** Polls `GET /health` every ~8s while the screen is focused (and immediately on focus). */
export function useHealthStatus(): HealthStatus {
  const db = useDatabase();
  const [state, setState] = useState<HealthState>('checking');
  const [apiUrl, setApiUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const poll = async (): Promise<void> => {
        const url = await resolveApiUrl(db);
        if (!active) {
          return;
        }
        setApiUrl(url);
        const result = await checkHealth(url, HEALTH_TIMEOUT_MS);
        if (active) {
          setState(result.reachable ? 'reachable' : 'unreachable');
        }
      };

      setState('checking');
      poll();
      const intervalId = setInterval(poll, POLL_INTERVAL_MS);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [db])
  );

  return { state, apiUrl };
}
