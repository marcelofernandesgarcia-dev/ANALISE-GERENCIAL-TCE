import { fetchTransferegovData } from '../src/services/transferegov-api';
import { reconcile, exportToXlsx } from '../src/services/reconciliation-service';

describe('End-to-end workflow', () => {
  const mockCsv = 'id;nome;valor\n700001;Convenio A;100000\n700002;Convenio B;200000';
  const mockOldData = [{ id: '700001', nome: 'Convenio A', valor: 100000 }];

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCsv),
    } as Response);
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should complete full workflow (download -> reconcile -> export)', async () => {
    const data = await fetchTransferegovData();
    expect(data).toHaveLength(2);

    const diff = reconcile(mockOldData, data);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].id).toBe('700002');

    const csv = exportToXlsx(data);
    expect(csv).toContain('700001');
    expect(csv).toContain('700002');
  });

  it('should detect changes (new, removed, altered)', () => {
    const old = [{ id: '1', nome: 'A', valor: 100 }];
    const now = [{ id: '1', nome: 'A', valor: 110 }, { id: '2', nome: 'B', valor: 200 }];
    const diff = reconcile(old, now);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].old.valor).toBe(100);
    expect(diff.changed[0].new.valor).toBe(110);
    expect(diff.removed).toHaveLength(0);
    expect(diff.added).toHaveLength(1);
  });

  it('should recover from API failure with retry', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockCsv) } as Response);

    const data = await fetchTransferegovData();
    expect(data).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should complete within 5 seconds for >10k records', async () => {
    const lines = Array.from({ length: 10001 }, (_, i) => `${700000 + i};Conv;${i}00`);
    lines.unshift('id;nome;valor');
    const bigCsv = lines.join('\n');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(bigCsv),
    } as Response);

    const start = Date.now();
    const data = await fetchTransferegovData();
    const duration = Date.now() - start;
    expect(data).toHaveLength(10001);
    expect(duration).toBeLessThan(5000);
  });

  it('should maintain a complete audit trail', async () => {
    const { runWeeklyTask } = require('../src/services/scheduled-task');
    localStorage.clear();
    await runWeeklyTask();
    const logs = localStorage.getItem('audit_log');
    expect(logs).toContain('[AUDIT]');
  });
});
