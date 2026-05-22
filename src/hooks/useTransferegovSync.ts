import { useState, useEffect, useCallback, useRef } from 'react';

interface SyncReport {
  novos: number;
  removidos: number;
  alterados: number;
}

interface UseTransferegovSyncOptions {
  onSync?: (report: SyncReport) => void;
  onError?: (error: string) => void;
  interval?: number; // milliseconds, default 60000
}

interface UseTransferegovSyncReturn {
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  report: SyncReport | null;
  totalRecords: number;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  forceSync: () => Promise<void>;
  clearCache: () => void;
}

const STORAGE_KEYS = {
  lastUpdate: 'transferegov_lastUpdate',
  report: 'transferegov_report',
  totalRecords: 'transferegov_totalRecords',
} as const;

/**
 * Hook para sincronização automática com o Transfere.gov.
 * @param options.onSync - Callback executado ao final de cada sincronização.
 * @param options.onError - Callback executado em caso de erro.
 * @param options.interval - Intervalo entre sincronizações em ms (padrão 60000).
 */
export function useTransferegovSync({
  onSync,
  onError,
  interval = 60000,
}: UseTransferegovSyncOptions = {}): UseTransferegovSyncReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.lastUpdate)
  );
  const [report, setReport] = useState<SyncReport | null>(
    JSON.parse(localStorage.getItem(STORAGE_KEYS.report) || 'null')
  );
  const [totalRecords, setTotalRecords] = useState<number>(
    parseInt(localStorage.getItem(STORAGE_KEYS.totalRecords) || '0', 10)
  );
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const persistData = useCallback((lastUpdateVal: string | null, reportVal: SyncReport | null, totalVal: number) => {
    if (lastUpdateVal) localStorage.setItem(STORAGE_KEYS.lastUpdate, lastUpdateVal);
    if (reportVal) localStorage.setItem(STORAGE_KEYS.report, JSON.stringify(reportVal));
    localStorage.setItem(STORAGE_KEYS.totalRecords, totalVal.toString());
  }, []);

  const sync = useCallback(async () => {
    console.log('[AUDIT] Sincronização iniciada');
    setLoading(true);
    setError(null);
    try {
      // Simula chamada à API - substituir por implementação real
      const response = await new Promise<{ data: SyncReport; total: number }>((resolve) =>
        setTimeout(() => resolve({
          data: { novos: 5, removidos: 2, alterados: 8 },
          total: 100,
        }), 1500)
      );
      if (!isMountedRef.current) return;
      setReport(response.data);
      setTotalRecords(response.total);
      const now = new Date().toISOString();
      setLastUpdate(now);
      console.log('[AUDIT] Sincronização concluída');
      onSync?.(response.data);
      persistData(now, response.data, response.total);
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('[AUDIT] Erro na sincronização:', msg);
      onError?.(msg);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [onSync, onError, persistData]);

  const startScheduler = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(sync, interval);
  }, [sync, interval]);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startScheduler();
    return () => {
      isMountedRef.current = false;
      stopScheduler();
    };
  }, [startScheduler, stopScheduler]);

  const pause = useCallback(() => {
    setIsPaused(true);
    stopScheduler();
    console.log('[AUDIT] Sincronização pausada');
  }, [stopScheduler]);

  const resume = useCallback(() => {
    setIsPaused(false);
    startScheduler();
    console.log('[AUDIT] Sincronização retomada');
  }, [startScheduler]);

  const forceSync = useCallback(async () => {
    stopScheduler();
    await sync();
    if (!isPaused) startScheduler();
  }, [sync, stopScheduler, startScheduler, isPaused]);

  const clearCache = useCallback(() => {
    setLastUpdate(null);
    setReport(null);
    setTotalRecords(0);
    setError(null);
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    console.log('[AUDIT] Cache limpo');
  }, []);

  return {
    loading,
    error,
    lastUpdate,
    report,
    totalRecords,
    isPaused,
    pause,
    resume,
    forceSync,
    clearCache,
  };
}
