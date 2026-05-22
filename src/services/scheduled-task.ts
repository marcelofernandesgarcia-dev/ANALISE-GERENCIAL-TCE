import { fetchTransferegovData, parseConvenios } from './transferegov-api';
import { reconcile, generateReport } from './reconciliation-service';

export const memoryCache: Map<string, any> = new Map();

export function saveCache(data: any): void {
  memoryCache.set('cache', data);
}

export function loadCache(): any | null {
  return memoryCache.get('cache') ?? null;
}

export function calculateNextMonday930(now?: Date): Date {
  const date = now || new Date();
  const day = date.getDay();
  let diff = 0;
  
  if (day === 0) {
    diff = 1;
  } else if (day === 1) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours < 9 || (hours === 9 && minutes < 30)) {
      diff = 0;
    } else {
      diff = 7;
    }
  } else {
    diff = 8 - day;
  }
  
  const nextMonday = new Date(date);
  nextMonday.setDate(date.getDate() + diff);
  nextMonday.setHours(9, 30, 0, 0);
  return nextMonday;
}

export async function runWeeklyTask(onProgress: (status: string) => void): Promise<void> {
  onProgress('Starting...');
  const newData = await fetchTransferegovData();
  onProgress('Data fetched');
  const parsed = parseConvenios(newData);
  onProgress('Data parsed');
  const oldData = loadCache();
  if (oldData) {
    const diff = reconcile(oldData, parsed);
    const report = generateReport(diff);
    onProgress(report);
  }
  saveCache(parsed);
  onProgress('Cache saved');
}
