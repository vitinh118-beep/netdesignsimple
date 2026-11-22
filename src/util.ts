export type N = { id: string; type: string; label: string; x: number; y: number; ip?: string; note?: string; fs?: number };
export type L = { id: string; a: string; b: string };
export type P = { nodes: N[]; links: L[] };
export const uid = () => Math.random().toString(36).slice(2, 8);
export function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
