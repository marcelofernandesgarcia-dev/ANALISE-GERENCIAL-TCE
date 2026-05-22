import { hashRecord, reconcile, generateReport, detectChanges, exportToXlsx } from '../src/services/reconciliation-service';

describe('hashRecord', () => {
  it('should generate SHA-256 hash', () => {
    const record = { id: '1', nome: 'Test', valor: 100 };
    const hash = hashRecord(record);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('reconcile', () => {
  const oldRecords = [
    { id: '1', nome: 'A', valor: 100 },
    { id: '2', nome: 'B', valor: 200 },
  ];
  const newRecords = [
    { id: '1', nome: 'A', valor: 150 },
    { id: '3', nome: 'C', valor: 300 },
  ];

  it('should detect new, removed, and changed records', () => {
    const result = reconcile(oldRecords, newRecords);
    expect(result).toEqual({
      added: [{ id: '3', nome: 'C', valor: 300 }],
      removed: [{ id: '2', nome: 'B', valor: 200 }],
      changed: [{ id: '1', old: { id: '1', nome: 'A', valor: 100 }, new: { id: '1', nome: 'A', valor: 150 } }],
    });
  });
});

describe('generateReport', () => {
  it('should generate a report with statistics', () => {
    const diff = {
      added: [{ id: '1' }],
      removed: [{ id: '2' }],
      changed: [{ id: '3', old: { valor: 100 }, new: { valor: 200 } }],
    };
    const report = generateReport(diff);
    expect(report).toMatchSnapshot();
  });
});

describe('detectChanges', () => {
  it('should flag changes >5%', () => {
    const oldVal = 100;
    const newVal = 110;
    expect(detectChanges(oldVal, newVal)).toBe(true);
    expect(detectChanges(100, 104)).toBe(false);
  });
});

describe('exportToXlsx', () => {
  it('should generate CSV string with header', () => {
    const data = [{ id: '1', nome: 'X', valor: 50 }];
    const csv = exportToXlsx(data);
    expect(csv).toContain('id;nome;valor');
    expect(csv).toContain('1;X;50');
  });
});
