import { useState, useEffect, useRef, useCallback } from 'react';

interface SyncState<T> {
  loading: boolean;
  error: string | null;
  report: string[];
  data: T | null;
}

interface UseTransferegovSyncReturn<T> extends SyncState<T> {
  forceSync: () => Promise<void>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransferegovSyncDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('syncData')) {
        db.createObjectStore('syncData', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIndexedDB<T>(key: string, data: T): Promise<void> {
  try {
    console.log('[DEBUG] Saving to IndexedDB', key, data);
    const db = await openDB();
    const transaction = db.transaction('syncData', 'readwrite');
    const store = transaction.objectStore('syncData');
    store.put({ id: key, value: data });
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.error('[DEBUG] Error saving to IndexedDB', err);
    throw err;
  }
}

async function loadFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    console.log('[DEBUG] Loading from IndexedDB', key);
    const db = await openDB();
    const transaction = db.transaction('syncData', 'readonly');
    const store = transaction.objectStore('syncData');
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result?.value ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[DEBUG] Error loading from IndexedDB', err);
    throw err;
  }
}

export function useTransferegovSync<T = any>(): UseTransferegovSyncReturn<T> {
  const [state, setState] = useState<SyncState<T>>({
    loading: false,
    error: null,
    report: [],
    data: null,
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateState = useCallback((partial: Partial<SyncState<T>>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...partial }));
    }
  }, []);

  const forceSync = useCallback(async () => {
    console.log('[DEBUG] forceSync called');
    updateState({ loading: true, error: null, report: ['Syncing...'] });
    try {
      // Simulate fetch (replace with actual API call)
      const fetchResult = await new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          try {
            console.log('[DEBUG] Fetching data from API');
            // Simulate success
            const data = { id: 1, name: 'Test' } as unknown as T;
            resolve(data);
          } catch (err) {
            reject(err);
          }
        }, 1000);
      });

      if (!isMountedRef.current) {
        console.log('[DEBUG] Component unmounted, aborting sync');
        return;
      }

      console.log('[DEBUG] Data fetched, saving to IndexedDB');
      await saveToIndexedDB('syncData', fetchResult);

      if (!isMountedRef.current) {
        console.log('[DEBUG] Component unmounted after save');
        return;
      }

      console.log('[DEBUG] Loading from IndexedDB to confirm');
      const savedData = await loadFromIndexedDB<T>('syncData');

      if (!isMountedRef.current) {
        console.log('[DEBUG] Component unmounted after load');
        return;
      }

      updateState({ loading: false, data: savedData, report: [...state.report, 'Sync completed successfully.'] });
    } catch (err: any) {
      console.error('[DEBUG] Sync failed', err);
      if (isMountedRef.current) {
        updateState({ loading: false, error: err.message || 'Sync failed', report: [...state.report, `Error: ${err.message}`] });
      }
    }
  }, [state.report, updateState]);

  // Load initial data on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('[DEBUG] Loading initial data from IndexedDB');
        const initialData = await loadFromIndexedDB<T>('syncData');
        if (isMountedRef.current && initialData !== null) {
          updateState({ data: initialData, report: ['Initial data loaded from cache.'] });
        }
      } catch (err: any) {
        console.error('[DEBUG] Error loading initial data', err);
        if (isMountedRef.current) {
          updateState({ error: err.message || 'Failed to load initial data' });
        }
      }
    })();
  }, [updateState]);

  return { ...state, forceSync };
}
