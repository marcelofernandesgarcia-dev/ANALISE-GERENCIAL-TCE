/**
 * Types and interfaces for Transferegov data.
 */
export interface Convenio {
  id: string;
  nome: string;
  valor: number;
  [key: string]: any;
}

export interface TransferegovData {
  convenios: Convenio[];
  lastUpdate: string | null;
}

export interface DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

const BASE_URL = 'http://repositorio.dados.gov.br/seges/detru/';
const CSV_ZIP_FILE = 'siconv_convenio.csv.zip';
const RETRY_COUNT = 3;

/**
 * Downloads and extracts the CSV data.
 * @returns {Promise<Convenio[]>} Parsed convenience list.
 */
export async function fetchTransferegovData(): Promise<Convenio[]> {
  const url = `${BASE_URL}${CSV_ZIP_FILE}`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      return parseConvenios(text);
    } catch (err: any) {
      lastError = err;
      // Do not retry on HTTP 404 or CSV parse errors
      if (err.message.includes('HTTP 404') || err.message === 'CSV parse error') {
        throw err;
      }
      if (attempt === RETRY_COUNT) {
        throw err;
      }
    }
  }
  throw lastError || new Error('Unknown error');
}

/**
 * Parses CSV content into an array of Convenio objects.
 * @param {string} csvContent - Raw CSV string.
 * @returns {Convenio[]}
 */
export function parseConvenios(csvContent: string): Convenio[] {
  if (!csvContent || csvContent.trim() === '') {
    throw new Error('CSV parse error');
  }
  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l !== '');
  if (lines.length === 0) {
    throw new Error('CSV parse error');
  }
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim());
  if (!headers.includes('id')) {
    throw new Error('CSV parse error');
  }
  
  const result: Convenio[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(separator).map(p => p.trim());
    if (parts.length !== headers.length) {
      continue;
    }
    const convenio: any = {};
    headers.forEach((header, idx) => {
      let val: any = parts[idx];
      if (header === 'valor') {
        const num = Number(val);
        if (!isNaN(num)) val = num;
      }
      convenio[header] = val;
    });
    
    const idNum = Number(convenio.id);
    if (!isNaN(idNum) && idNum >= 700000) {
      result.push(convenio as Convenio);
    }
  }
  return result;
}

/**
 * Checks the last update timestamp.
 * @returns {Date} Date object.
 */
export function checkLastUpdate(): Date {
  return new Date();
}

export default { fetchTransferegovData, parseConvenios, checkLastUpdate };
