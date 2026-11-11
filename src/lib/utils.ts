import { format, parseISO } from 'date-fns';

export const fmtKES = (n: number) => 'KES ' + Math.round(n).toLocaleString('en-KE');
export const fmtL = (n: number) => n.toFixed(1) + ' L';
export const fmtDate = (iso: string) => {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'd MMM yyyy'); } catch { return iso; }
};
export const fmtDateTime = (iso: string) => {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'd MMM yyyy, HH:mm'); } catch { return iso; }
};
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const ageYears = (dob: string) => {
  if (!dob) return '';
  const ms = Date.now() - new Date(dob).getTime();
  const y = Math.floor(ms / (365.25 * 86400000));
  const m = Math.floor((ms % (365.25 * 86400000)) / (30.44 * 86400000));
  return y > 0 ? `${y} yr ${m} mo` : `${m} mo`;
};
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
