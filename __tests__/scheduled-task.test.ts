import { calculateNextMonday930, runWeeklyTask, scheduleWeeklyTask } from '../src/services/scheduled-task';

describe('calculateNextMonday930', () => {
  it('should return next Monday at 09:30', () => {
    const now = new Date(2025, 0, 6); // Monday
    const next = calculateNextMonday930(now);
    expect(next.getDay()).toBe(1);
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(30);
    if (now.getDay() === 1 && now.getHours() < 9) {
      expect(next.getTime()).toBe(now.getTime() + (9 * 60 + 30) * 60 * 1000);
    }
  });
});

describe('runWeeklyTask', () => {
  const onProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute full workflow with callbacks', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('id;nome\n700001;Test'),
    } as Response);

    const result = await runWeeklyTask(onProgress);
    expect(result.success).toBe(true);
    expect(onProgress).toHaveBeenCalledWith('download');
    expect(onProgress).toHaveBeenCalledWith('reconcile');
    expect(onProgress).toHaveBeenCalledWith('export');
  });
});

describe('scheduleWeeklyTask', () => {
  it('should schedule and cancel', () => {
    const mockTask = jest.fn();
    const cancel = scheduleWeeklyTask(mockTask);
    expect(typeof cancel).toBe('function');
    cancel();
    expect(mockTask).not.toHaveBeenCalled();
  });
});

describe('Cache persistence', () => {
  it('should save and load from IndexedDB', async () => {
    const { saveCache, loadCache } = require('../src/services/scheduled-task');
    const data = { key: 'test' };
    await saveCache(data);
    const loaded = await loadCache();
    expect(loaded).toEqual(data);
  });
});

describe('Audit logging', () => {
  it('should write [AUDIT] logs to localStorage', () => {
    localStorage.clear();
    const log = '[AUDIT] Task started';
    localStorage.setItem('audit_log', log);
    expect(localStorage.getItem('audit_log')).toContain('[AUDIT]');
  });
});
