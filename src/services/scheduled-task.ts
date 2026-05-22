import { fetchTransferegovData } from './transferegov-api';
import { reconcileWithTransferegov } from './reconciliation-service';

export interface TaskConfig {
  schedule: string; // cron expression
  onUpdate?: (report: any) => void;
  onError?: (error: Error) => void;
}

const AUDIT_PREFIX = '[AUDIT]';

let cacheStore: any = null;

export async function saveCache(data: any): Promise<void> {
  cacheStore = data;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('scheduled_task_cache', JSON.stringify(data));
  }
}

export async function loadCache(): Promise<any> {
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem('scheduled_task_cache');
    if (val) return JSON.parse(val);
  }
  return cacheStore;
}

/**
 * Runs the weekly task manually.
 */
export async function runWeeklyTask(
  previousDataOrOnProgress?: any[] | ((msg: string) => void),
  onProgress?: (msg: string) => void
): Promise<any> {
  let previousData: any[] = [];
  let actualOnProgress: ((msg: string) => void) | undefined = onProgress;

  if (typeof previousDataOrOnProgress === 'function') {
    actualOnProgress = previousDataOrOnProgress;
  } else if (Array.isArray(previousDataOrOnProgress)) {
    previousData = previousDataOrOnProgress;
  }

  const logAudit = (msg: string) => {
    const formattedMsg = `${AUDIT_PREFIX} ${msg}`;
    console.log(formattedMsg);
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem('audit_log') || '';
      localStorage.setItem('audit_log', existing + (existing ? '\n' : '') + formattedMsg);
    }
  };

  logAudit('Task started');
  actualOnProgress?.('download');

  let transferegovData: any[] = [];
  try {
    transferegovData = await fetchTransferegovData();
  } catch (err: any) {
    logAudit(`Download failed: ${err.message}`);
    throw err;
  }

  actualOnProgress?.('reconcile');
  const report = await reconcileWithTransferegov(transferegovData, previousData);

  actualOnProgress?.('export');
  logAudit('Report generated.');

  return {
    ...report,
    success: true
  };
}

/**
 * Creates a scheduled task to run weekly on Monday at 09:30.
 */
export function scheduleWeeklyTask(config: any): () => void {
  const nextRun = calculateNextMonday930();
  const interval = nextRun.getTime() - Date.now();
  console.log(`${AUDIT_PREFIX} Next run scheduled in ${interval} ms`);
  
  const timeoutId = setTimeout(async () => {
    try {
      const report = await runWeeklyTask();
      if (typeof config === 'function') {
        config(report);
      } else {
        config.onUpdate?.(report);
      }
    } catch (err: any) {
      if (typeof config !== 'function') {
        config.onError?.(err);
      }
    }
    // Reschedule for next week
    scheduleWeeklyTask(config);
  }, interval);
  
  return () => clearTimeout(timeoutId);
}

/**
 * Calculates Date of next Monday 09:30 AM.
 */
export function calculateNextMonday930(nowVal?: Date): Date {
  const now = nowVal || new Date();
  const nextMonday = new Date(now.getTime());
  const currentDay = now.getDay();
  let daysToAdd = 0;
  
  if (currentDay === 1) {
    if (now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 30)) {
      daysToAdd = 0;
    } else {
      daysToAdd = 7;
    }
  } else {
    daysToAdd = (1 - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7;
  }
  
  nextMonday.setDate(now.getDate() + daysToAdd);
  nextMonday.setHours(9, 30, 0, 0);
  return nextMonday;
}

export default { runWeeklyTask, scheduleWeeklyTask, calculateNextMonday930, saveCache, loadCache };
