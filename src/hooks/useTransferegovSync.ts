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

// Helper to expose openDB globally in the browser console
if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  (window as any).openDB = function (dbName: string, version = 1) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('transfers')) {
          db.createObjectStore('transfers', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        resolve({
          getAll(storeName: string) {
            return new Promise((res, rej) => {
              const transaction = db.transaction(storeName, 'readonly');
              const store = transaction.objectStore(storeName);
              const req = store.getAll();
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            });
          },
          put(storeName: string, value: any) {
            return new Promise<void>((res, rej) => {
              const transaction = db.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);
              const req = store.put(value);
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            });
          },
          clear(storeName: string) {
            return new Promise<void>((res, rej) => {
              const transaction = db.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);
              const req = store.clear();
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            });
          }
        });
      };
      request.onerror = () => reject(request.error);
    });
  };
}

export const mockTransfers = [
  { id: '700001', convenente: 'Prefeitura A', cnpj: '11.111.111/0001-11', valor: 150000, situacaoTg: 'Em execução', statusConciliacao: 'Correto' },
  { id: '700002', convenente: 'Prefeitura B', cnpj: '22.222.222/0001-22', valor: 250000, situacaoTg: 'Em execução', statusConciliacao: 'Inconsistência (Rito Patológico)' },
  { id: '700003', convenente: 'Prefeitura C', cnpj: '33.333.333/0001-33', valor: 350000, situacaoTg: 'Aguardando prestação de contas', statusConciliacao: 'Correto' },
  { id: '700004', convenente: 'Prefeitura D', cnpj: '44.444.444/0001-44', valor: 450000, situacaoTg: 'Inadimplente', statusConciliacao: 'Alerta' },
  { id: '700005', convenente: 'Prefeitura E', cnpj: '55.555.555/0001-55', valor: 550000, situacaoTg: 'Prestação de Contas Rejeitada', statusConciliacao: 'Inconsistência (Rito Patológico)' }
];

export const saveToIndexedDB = async (records: any[]) => {
  if (typeof window === 'undefined' || typeof (window as any).openDB === 'undefined') return;
  try {
    const db: any = await (window as any).openDB('SiactDB');
    await db.clear('transfers');
    for (const record of records) {
      await db.put('transfers', record);
    }
    console.log('[AUDIT] Salvo em IndexedDB com sucesso');
  } catch (err) {
    console.error('[ERROR] Falha ao salvar no IndexedDB:', err);
  }
};

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
      await saveToIndexedDB(mockTransfers);
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('[ERROR] useTransferegovSync:', msg);
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
