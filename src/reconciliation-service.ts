/**
 * Types for reconciliation.
 */
export interface ReconciliationRecord {
  id: string;
  source: string;
  data: any;
  hash: string;
}

export interface ReconciliationResult {
  newRecords: ReconciliationRecord[];
  removedRecords: ReconciliationRecord[];
  changedRecords: { old: ReconciliationRecord; new: ReconciliationRecord }[];
  unchangedCount: number;
}

export interface ReconciliationReport {
  timestamp: string;
  totalSource: number;
  totalTarget: number;
  newCount: number;
  removedCount: number;
  changedCount: number;
  unchangedCount: number;
  details: any[];
}

/**
 * Core reconciliation functions.
 */

import type { Convenio } from './transferegov-api';

const AUDIT_PREFIX = '[AUDIT]';

/**
 * Generates a hash for a record (simplified).
 * @param record - Record object.
 * @returns {string} Hash string.
 */
export function hashRecord(record: any): string {
  return JSON.stringify(record); // simplistic; for production use crypto hash
}

/**
 * Reconciles two sets of data.
 * @param sourceRecords - Array of records from source.
 * @param targetRecords - Array of records from target.
 * @returns {ReconciliationResult}
 */
export function reconcile(
  sourceRecords: ReconciliationRecord[],
  targetRecords: ReconciliationRecord[]
): ReconciliationResult {
  const sourceMap = new Map<string, ReconciliationRecord>();
  for (const rec of sourceRecords) {
    sourceMap.set(rec.id, rec);
  }
  const targetMap = new Map<string, ReconciliationRecord>();
  for (const rec of targetRecords) {
    targetMap.set(rec.id, rec);
  }

  const newRecords: ReconciliationRecord[] = [];
  const removedRecords: ReconciliationRecord[] = [];
  const changedRecords: { old: ReconciliationRecord; new: ReconciliationRecord }[] = [];
  let unchangedCount = 0;

  for (const [id, targetRec] of targetMap) {
    if (!sourceMap.has(id)) {
      newRecords.push(targetRec);
    } else {
      const sourceRec = sourceMap.get(id)!;
      if (sourceRec.hash !== targetRec.hash) {
        changedRecords.push({ old: sourceRec, new: targetRec });
      } else {
        unchangedCount++;
      }
    }
  }
  for (const [id, sourceRec] of sourceMap) {
    if (!targetMap.has(id)) {
      removedRecords.push(sourceRec);
    }
  }

  console.log(`${AUDIT_PREFIX} Reconciliation complete: ${newRecords.length} new, ${removedRecords.length} removed, ${changedRecords.length} changed, ${unchangedCount} unchanged`);
  return { newRecords, removedRecords, changedRecords, unchangedCount };
}

/**
 * Generates a reconciliation report.
 * @param result - Reconciliation result.
 * @param sourceCount - Total source records.
 * @param targetCount - Total target records.
 * @returns {ReconciliationReport}
 */
export function generateReport(
  result: ReconciliationResult,
  sourceCount: number,
  targetCount: number
): ReconciliationReport {
  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    totalSource: sourceCount,
    totalTarget: targetCount,
    newCount: result.newRecords.length,
    removedCount: result.removedRecords.length,
    changedCount: result.changedRecords.length,
    unchangedCount: result.unchangedCount,
    details: []
  };
  // Add details for new and changed records
  result.newRecords.forEach(rec => {
    report.details.push({ type: 'new', id: rec.id, source: rec.source, data: rec.data });
  });
  result.changedRecords.forEach(change => {
    report.details.push({
      type: 'changed',
      id: change.new.id,
      source: change.new.source,
      oldData: change.old.data,
      newData: change.new.data
    });
  });
  result.removedRecords.forEach(rec => {
    report.details.push({ type: 'removed', id: rec.id, source: rec.source, data: rec.data });
  });
  console.log(`${AUDIT_PREFIX} Report generated with ${report.details.length} entries`);
  return report;
}

/**
 * Exports report to XLSX (simplified placeholder).
 * @param report - Report to export.
 */
export function exportToXlsx(report: ReconciliationReport): void {
  // In production, use a library like exceljs or xlsx.
  // For now, log to console.
  console.log(`${AUDIT_PREFIX} Exporting report to XLSX (placeholder)`, report);
  // Implementation: convert report to CSV or XLSX buffer and save.
}

// Integration with Transferegov data
export async function reconcileWithTransferegov(
  transferegovData: Convenio[],
  existingData: ReconciliationRecord[]
): Promise<ReconciliationReport> {
  const sourceRecords: ReconciliationRecord[] = existingData;
  const targetRecords: ReconciliationRecord[] = transferegovData.map(c => ({
    id: c.numero,
    source: 'Transferegov',
    data: c,
    hash: hashRecord(c)
  }));
  const result = reconcile(sourceRecords, targetRecords);
  const report = generateReport(result, sourceRecords.length, targetRecords.length);
  exportToXlsx(report);
  return report;
}

export default { reconcile, generateReport, exportToXlsx, reconcileWithTransferegov };
