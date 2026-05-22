export function hashRecord(record: string): string {
  const str = record;
  const rotateRight = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const words: number[] = [];
  const ascii = str;
  for (let i = 0; i < ascii.length * 8; i += 8) {
    words[i >> 5] |= (ascii.charCodeAt(i / 8) & 0xff) << (24 - (i % 32));
  }
  
  const len = ascii.length * 8;
  words[len >> 5] |= 0x80 << (24 - (len % 32));
  words[(((len + 64) >> 9) << 4) + 15] = len;

  let H0 = 0x6a09e667;
  let H1 = 0xbb67ae85;
  let H2 = 0x3c6ef372;
  let H3 = 0xa54ff53a;
  let H4 = 0x510e527f;
  let H5 = 0x9b05688c;
  let H6 = 0x1f83d9ab;
  let H7 = 0x5be0cd19;

  const W = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;
    let f = H5;
    let g = H6;
    let h = H7;

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = words[i + j] || 0;
      } else {
        const s0 = rotateRight(7, W[j - 15]) ^ rotateRight(18, W[j - 15]) ^ (W[j - 15] >>> 3);
        const s1 = rotateRight(17, W[j - 2]) ^ rotateRight(19, W[j - 2]) ^ (W[j - 2] >>> 10);
        W[j] = (W[j - 16] + s0 + W[j - 7] + s1) | 0;
      }

      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const S0 = rotateRight(2, a) ^ rotateRight(13, a) ^ rotateRight(22, a);
      const S1 = rotateRight(6, e) ^ rotateRight(11, e) ^ rotateRight(25, e);
      const t1 = (h + S1 + ch + K[j] + W[j]) | 0;
      const t2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
    H5 = (H5 + f) | 0;
    H6 = (H6 + g) | 0;
    H7 = (H7 + h) | 0;
  }

  const hex = (num: number) => {
    const s = (num >>> 0).toString(16);
    return '00000000'.substring(s.length) + s;
  };
  return hex(H0) + hex(H1) + hex(H2) + hex(H3) + hex(H4) + hex(H5) + hex(H6) + hex(H7);
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
