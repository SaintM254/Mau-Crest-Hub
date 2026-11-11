import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useSession } from '../../lib/store';

export function Button({ variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold' }) {
  const styles: Record<string, string> = {
    primary: 'bg-forest text-cream hover:bg-forest-dark',
    secondary: 'bg-paper text-ink border border-sand hover:bg-cream-deep',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'bg-transparent text-forest hover:bg-cream-deep',
    gold: 'bg-gold text-white hover:opacity-90'
  };
  return <button className={`min-h-[44px] px-4 py-2 rounded-input font-semibold text-[15px] inline-flex items-center justify-center gap-2 ${styles[variant]} ${className}`} {...props} />;
}

export function IconButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-input hover:bg-cream-deep ${className}`} {...props} />;
}

export function Input({ label, hint, error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-[15px] font-medium mb-1">{label}</span>}
      <input className={`w-full min-h-[44px] px-3 py-2 rounded-input border bg-paper text-[15px] ${error ? 'border-danger' : 'border-sand'} ${className}`} {...props} />
      {hint && !error && <span className="block text-[13px] text-ink-muted mt-1">{hint}</span>}
      {error && <span className="block text-[13px] text-danger mt-1">{error}</span>}
    </label>
  );
}

export function NumberInput({ label, hint, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  return <Input label={label} hint={hint} error={error} inputMode="decimal" type="number" step="any" {...props} />;
}

export function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      {label && <span className="block text-[15px] font-medium mb-1">{label}</span>}
      <select className="w-full min-h-[44px] px-3 py-2 rounded-input border border-sand bg-paper text-[15px]" {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-[15px] font-medium mb-1">{label}</span>}
      <textarea className="w-full px-3 py-2 rounded-input border border-sand bg-paper text-[15px]" rows={3} {...props} />
    </label>
  );
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
      <input type="checkbox" className="w-5 h-5 accent-[#1F4D2E]" {...props} />
      <span className="text-[15px]">{label}</span>
    </label>
  );
}

export function Switch({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
      <input type="checkbox" className="w-5 h-5 accent-[#1F4D2E]" {...props} />
      <span className="text-[15px]">{label}</span>
    </label>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-sand overflow-x-auto" role="tablist">
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`min-h-[44px] px-4 text-[15px] font-medium whitespace-nowrap border-b-2 ${active === t.id ? 'border-forest text-forest' : 'border-transparent text-ink-muted'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'info' | 'danger' | 'warning' | 'gold'; children: React.ReactNode }) {
  const map: Record<string, string> = {
    neutral: 'bg-cream-deep text-ink',
    success: 'bg-forest-tint text-forest',
    info: 'bg-blue-tint text-deep-blue',
    danger: 'bg-danger-tint text-danger',
    warning: 'bg-warning-tint text-warning',
    gold: 'bg-gold-tint text-gold-dark'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium ${map[tone]}`}>{children}</span>;
}

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div className={`relative bg-paper w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-dialog sm:rounded-dialog p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <IconButton onClick={onClose} aria-label="Close"><X size={20} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-paper rounded-t-dialog p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <IconButton onClick={onClose} aria-label="Close"><X size={20} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm' }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel?: string }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-[15px] mb-5">{body}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

export function Toasts() {
  const { toasts, removeToast } = useSession();
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[60] space-y-2" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="bg-forest text-cream px-4 py-3 rounded-panel flex items-center gap-2 shadow-none border border-forest-dark max-w-sm">
          <CheckCircle2 size={18} />
          <span className="text-[15px]">{t.msg}</span>
          <button onClick={() => removeToast(t.id)} aria-label="Dismiss" className="ml-2"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-6 border border-dashed border-sand rounded-panel bg-paper">
      <Info size={32} className="mx-auto text-ink-muted mb-3" />
      <h3 className="text-[17px] font-semibold mb-1">{title}</h3>
      <p className="text-[15px] text-ink-muted max-w-md mx-auto mb-4">{body}</p>
      {action}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-[17px] font-semibold mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-paper border border-sand rounded-panel p-4">
      <div className="text-[13px] text-ink-muted">{label}</div>
      <div className="text-[24px] font-bold num">{value}</div>
      {sub && <div className="text-[13px] text-ink-muted">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-cream-deep skeleton-pulse rounded-input ${className}`} />;
}

export function FileDropzone({ onFiles }: { onFiles: (names: string[]) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`border-2 border-dashed rounded-panel p-6 text-center ${drag ? 'border-forest bg-forest-tint' : 'border-sand'}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(Array.from(e.dataTransfer.files).map(f => f.name)); }}
    >
      <p className="text-[15px]">Drag files here, or</p>
      <label className="inline-block mt-2 cursor-pointer text-forest font-semibold underline">
        choose files
        <input type="file" multiple className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []).map(f => f.name))} />
      </label>
      <p className="text-[13px] text-ink-muted mt-1">Images and PDFs</p>
    </div>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'danger' | 'success'; children: React.ReactNode }) {
  const map: Record<string, string> = {
    info: 'bg-blue-tint text-deep-blue border-deep-blue/30',
    warning: 'bg-warning-tint text-warning border-warning/30',
    danger: 'bg-danger-tint text-danger border-danger/30',
    success: 'bg-forest-tint text-forest border-forest/30'
  };
  return (
    <div className={`border rounded-panel p-3 flex gap-2 items-start text-[15px] ${map[tone]}`}>
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="text-[15px] num">Page {page} of {pages} ({total} records)</span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full min-h-[44px] px-3 py-2 rounded-input border border-sand bg-paper text-[15px]" />
  );
}

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = () => {
    setLoading(true);
    fn().then(setData).catch(() => setError('Something went wrong. Please try again.')).finally(() => setLoading(false));
  };
  React.useEffect(() => { reload(); }, deps);
  return { data, loading, error, reload };
}
