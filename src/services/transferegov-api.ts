import axios from 'axios';

export async function fetchTransferegovData(): Promise<any[]> {
  const response = await axios.get('https://api.transferegov.gov.br/convenios');
  return response.data;
}

export function parseConvenios(data: any[]): any[] {
  return data.filter(item => {
    const id = Number(item.id);
    return id >= 700000;
  });
}

export function checkLastUpdate(): Date {
  return new Date();
}
