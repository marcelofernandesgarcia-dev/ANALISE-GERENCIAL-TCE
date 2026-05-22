import { fetchTransferegovData, parseConvenios } from '../src/services/transferegov-api';
import { reconcile, exportToXlsx } from '../src/services/reconciliation-service';
import { runWeeklyTask } from '../src/services/scheduled-task';
import axios from 'axios';

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: [
      { id: 700000, nome: 'Convenio A' },
      { id: 699999, nome: 'Convenio B' }
    ]
  })
}));

describe('E2E Tests', () => {
  test('fetchTransferegovData returns array', async () => {
    const data = await fetchTransferegovData();
    expect(Array.isArray(data)).toBe(true);
  });

  test('parseConvenios filters IDs >= 700000', async () => {
    const data = await fetchTransferegovData();
    const parsed = parseConvenios(data);
    parsed.forEach(item => {
      expect(Number(item.id)).toBeGreaterThanOrEqual(700000);
    });
  });

  test('reconcile detects added and removed', () => {
    const oldData = [{ id: 1, value: 'a' }];
    const newData = [{ id: 2, value: 'b' }];
    const result = reconcile(oldData, newData);
    expect(result.added).toHaveLength(1);
    expect(result.removed).toHaveLength(1);
    expect(result.changed).toHaveLength(0);
  });

  test('exportToXlsx returns CSV with semicolons', () => {
    const data = [{ a: 1, b: 'x' }];
    const csv = exportToXlsx(data);
    expect(csv).toContain(';');
    expect(csv).toContain('1;x');
  });

  test('runWeeklyTask completes without error', async () => {
    const progress = jest.fn();
    await runWeeklyTask(progress);
    expect(progress).toHaveBeenCalled();
  });
});
