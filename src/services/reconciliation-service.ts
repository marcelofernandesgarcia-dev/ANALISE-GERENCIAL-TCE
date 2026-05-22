import { createHash } from 'crypto';

export function hashRecord(record: string): string {
  return createHash('sha256').update(record).digest('hex');
}

export function reconcile(oldData: any[], newData: any[]) {
  const oldMap = new Map(oldData.map(item => [item.id, item]));
  const newMap = new Map(newData.map(item => [item.id, item]));
  const added: any[] = [];
  const removed: any[] = [];
  const changed: any[] = [];
  for (const [id, item] of newMap) {
    if (!oldMap.has(id)) {
      added.push(item);
    } else {
      const oldItem = oldMap.get(id)!;
      if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
        changed.push(item);
      }
    }
  }
  for (const [id, item] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(item);
    }
  }
  return { added, removed, changed };
}

export function detectChanges(oldValue: number, newValue: number): boolean {
  if (oldValue === 0) return newValue !== 0;
  return Math.abs((newValue - oldValue) / oldValue) > 0.05;
}

export function exportToXlsx(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const lines = data.map(row => headers.map(h => String(row[h])).join(';'));
  return [headers.join(';'), ...lines].join('\n');
}

export function generateReport(diff: { added: any[]; removed: any[]; changed: any[] }): string {
  return `Added: ${diff.added.length}, Removed: ${diff.removed.length}, Changed: ${diff.changed.length}`;
}
