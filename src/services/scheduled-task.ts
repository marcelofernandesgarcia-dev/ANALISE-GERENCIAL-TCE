/**
 * Types for scheduled task.
 */
import { fetchTransferegovData } from './transferegov-api';
import type { Convenio } from './transferegov-api';
import { reconcileWithTransferegov } from './reconciliation-service';
import type { ReconciliationRecord, ReconciliationReport } from './reconciliation-service';

export interface TaskConfig {
  schedule: string; // cron expression
  onUpdate?: (report: ReconciliationReport) => void;
  onError?: (error: Error) => void;
}

/**
 * Core task scheduling and orchestration.
 */

const AUDIT_PREFIX = '[AUDIT]';

/**
 * Runs the weekly task manually.
 * @param previousData - Previously cached data (optional).
 * @param onProgress - Callback for progress updates.
 * @returns {Promise<ReconciliationReport>}
 */
export async function runWeeklyTask(
  previousData?: ReconciliationRecord[],
  onProgress?: (msg: string) => void
): Promise<ReconciliationReport> {
  onProgress?.(`${AUDIT_PREFIX} Starting weekly task...`);
  
  // Step 1: Download data from Transferegov
  onProgress?.(`${AUDIT_PREFIX} Downloading convênios...`);
  let transferegovData: Convenio[];
  try {
    const data = await fetchTransferegovData();
    transferegovData = data.convenios;
    onProgress?.(`${AUDIT_PREFIX} Downloaded ${transferegovData.length} convênios`);
  } catch (err: any) {
    const errorMsg = `${AUDIT_PREFIX} Download failed: ${err.message}`;
    onProgress?.(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Step 2: Update cache (simplified, assume we store previous data)
  onProgress?.(`${AUDIT_PREFIX} Checking cache...`);
  if (!previousData) {
    previousData = []; // first run, no previous data
  }
  
  // Step 3: Reconcile
  onProgress?.(`${AUDIT_PREFIX} Reconciling...`);
  let report: ReconciliationReport;
  try {
    report = await reconcileWithTransferegov(transferegovData, previousData);
    onProgress?.(`${AUDIT_PREFIX} Reconciliation complete. New: ${report.newCount}, Removed: ${report.removedCount}, Changed: ${report.changedCount}`);
  } catch (err: any) {
    const errorMsg = `${AUDIT_PREFIX} Reconciliation failed: ${err.message}`;
    onProgress?.(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Step 4: Generate report and notify UI
  onProgress?.(`${AUDIT_PREFIX} Report generated.`);
  // If there is a UI callback, call it
  if (typeof window !== 'undefined' && (window as any).onReconciliationUpdate) {
    (window as any).onReconciliationUpdate(report);
  }
  
  return report;
}

/**
 * Creates a scheduled task to run weekly on Monday at 09:30.
 * Uses setTimeout for simplicity; in production use a cron library.
 * @param config - Task configuration.
 * @returns {() => void} Function to cancel the schedule.
 */
export function scheduleWeeklyTask(config: TaskConfig): () => void {
  const interval = calculateNextMonday930();
  console.log(`${AUDIT_PREFIX} Next run scheduled in ${interval} ms`);
  const timeoutId = setTimeout(async () => {
    try {
      const report = await runWeeklyTask();
      config.onUpdate?.(report);
    } catch (err: any) {
      config.onError?.(err);
    }
    // Reschedule for next week
    scheduleWeeklyTask(config);
  }, interval);
  
  return () => clearTimeout(timeoutId);
}

/**
 * Calculates milliseconds until next Monday 09:30 AM.
 * @returns {number} Milliseconds.
 */
function calculateNextMonday930(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7); // days until next Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + diff);
  nextMonday.setHours(9, 30, 0, 0);
  if (nextMonday <= now) {
    // Already passed today, add 7 days
    nextMonday.setDate(nextMonday.getDate() + 7);
  }
  return nextMonday.getTime() - now.getTime();
}

export default { runWeeklyTask, scheduleWeeklyTask };
