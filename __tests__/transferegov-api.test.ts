import { fetchTransferegovData, parseConvenios, checkLastUpdate } from '../src/services/transferegov-api';

describe('fetchTransferegovData', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should download and parse CSV data successfully', async () => {
    const mockCsv = 'id;nome;valor\n700001;Convenio A;100000\n700002;Convenio B;200000';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCsv),
    } as Response);

    const data = await fetchTransferegovData();
    expect(data).toEqual([
      { id: '700001', nome: 'Convenio A', valor: 100000 },
      { id: '700002', nome: 'Convenio B', valor: 200000 },
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry 3 times on failure', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('id;nome\n700003;Convenio C'),
      } as Response);

    const data = await fetchTransferegovData();
    expect(data).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should throw on HTTP 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    await expect(fetchTransferegovData()).rejects.toThrow('HTTP 404');
  });

  it('should throw on timeout', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockImplementation(() => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 10000)
    ));

    const p = fetchTransferegovData();
    for (let i = 0; i < 3; i++) {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    }

    await expect(p).rejects.toThrow('Timeout');
    jest.useRealTimers();
  });

  it('should handle malformed CSV gracefully', async () => {
    const badCsv = 'invalid,csv';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(badCsv),
    } as Response);

    await expect(fetchTransferegovData()).rejects.toThrow('CSV parse error');
  });
});

describe('parseConvenios', () => {
  it('should parse CSV with IDs >= 700000', () => {
    const csv = 'id;nome;valor\n700001;Conv A;100\n699999;Conv B;200\n700003;Conv C;300';
    const result = parseConvenios(csv);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('700001');
    expect(result[1].id).toBe('700003');
  });
});

describe('checkLastUpdate', () => {
  it('should return a valid timestamp', () => {
    const timestamp = checkLastUpdate();
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
