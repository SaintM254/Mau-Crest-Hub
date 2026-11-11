import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Info, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useSession } from '../../lib/store';

/* ---------------------------------- Buttons --------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
type ButtonSize = 'md' | 'sm';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-forest text-cream border border-forest hover:bg-forest-dark hover:border-forest-dark',
    secondary: 'bg-paper text-ink border border-sand hover:bg-cream hover:border-sand',
    danger: 'bg-paper text-danger border border-danger/45 hover:bg-danger-tint',
    ghost: 'bg-transparent text-forest border border-transparent hover:bg-forest-tint',
    gold: 'bg-gold-tint text-gold-dark border border-gold/40 hover:bg-gold/20'
  };
  const sizes: Record<ButtonSize, string> = {
    md: 'min-h-[44px] px-5 py-2 text-[15px]',
    sm: 'min-h-[38px] px-4 py-1.5 text-[13px]'
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap
        transition-colors duration-150 disabled:bg-cream-deep disabled:text-ink-muted
        disabled:border-sand disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

/** Round flat icon button. Cream fill on paper, so it never reads as faded. */
export function IconButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`icon-btn ${className}`} {...props} />;
}

/* ----------------------------------- Forms ---------------------------------- */

const fieldLabel = 'block text-[15px] font-medium text-ink mb-1.5';

export function Input({
  label, hint, error, className = '', ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <input
        aria-invalid={!!error}
        className={`field ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-[13px] text-ink-muted mt-1">{hint}</span>}
      {error && <span className="block text-[13px] text-danger mt-1">{error}</span>}
    </label>
  );
}

export function NumberInput({
  label, hint, error, className = '', ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <Input
      label={label} hint={hint} error={error} inputMode="decimal" type="number" step="any"
      className={`num ${className}`} {...props}
    />
  );
}

export function Select({
  label, options, className = '', ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <select className={`field pr-9 ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Textarea({
  label, className = '', ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <textarea className={`field leading-relaxed ${className}`} rows={3} {...props} />
    </label>
  );
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
      <input type="checkbox" className="w-[18px] h-[18px] accent-[rgb(var(--forest))]" {...props} />
      <span className="text-[15px]">{label}</span>
    </label>
  );
}

export function Switch({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
      <input type="checkbox" className="w-[18px] h-[18px] accent-[rgb(var(--forest))]" {...props} />
      <span className="text-[15px]">{label}</span>
    </label>
  );
}

/* ----------------------------------- Tabs ----------------------------------- */

export function Tabs({
  tabs, active, onChange
}: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-paper border border-sand rounded-pill" role="tablist">
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`min-h-[40px] px-4 rounded-pill text-[15px] font-semibold whitespace-nowrap
              transition-colors duration-150 ${
                isActive
                  ? 'bg-forest text-cream'
                  : 'bg-transparent text-ink-muted hover:bg-cream-deep hover:text-ink'
              }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Badges ---------------------------------- */

export type BadgeTone = 'neutral' | 'success' | 'info' | 'danger' | 'warning' | 'gold';

const badgeTone: Record<BadgeTone, string> = {
  neutral: 'bg-cream-deep text-ink',
  success: 'bg-forest-tint text-forest',
  info: 'bg-blue-tint text-deep-blue',
  danger: 'bg-danger-tint text-danger',
  warning: 'bg-warning-tint text-warning',
  gold: 'bg-gold-tint text-gold-dark'
};

const dotTone: Record<BadgeTone, string> = {
  neutral: 'bg-ink-muted',
  success: 'bg-forest',
  info: 'bg-deep-blue',
  danger: 'bg-danger',
  warning: 'bg-warning',
  gold: 'bg-gold'
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[13px] font-medium whitespace-nowrap ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}

/** Status pill: dot plus text, so status is never carried by colour alone. */
export function StatusPill({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <Badge tone={tone}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotTone[tone]}`} aria-hidden="true" />
      {children}
    </Badge>
  );
}

/* ---------------------------------- Dialogs --------------------------------- */

export function Dialog({
  open, onClose, title, description, children, wide
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div
        className={`relative bg-paper w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] flex flex-col
          rounded-t-dialog sm:rounded-dialog border border-sand`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-sand">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold text-ink leading-tight">{title}</h2>
            {description && <p className="text-[13px] text-ink-muted mt-1">{description}</p>}
          </div>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Sheet({
  open, onClose, title, children
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-paper rounded-t-dialog border-t border-sand max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-sand">
          <h2 className="text-[20px] font-bold text-ink">{title}</h2>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * Explicit yes or no confirmation. Used for sign out and other
 * actions that cannot be undone by simply navigating back.
 */
export function ConfirmDialog({
  open, onClose, onConfirm, title, body, confirmLabel = 'Yes, continue', cancelLabel = 'No, go back', tone = 'default'
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-[15px] text-ink mb-5">{body}</p>
      <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
        <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

/* ---------------------------------- Toasts ---------------------------------- */

export function Toasts() {
  const { toasts, removeToast } = useSession();
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto z-[60] space-y-2 md:max-w-sm" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-forest text-cream px-4 py-3 rounded-pill flex items-center gap-2 border border-forest-dark"
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="text-[15px] flex-1">{t.msg}</span>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss"
            className="min-w-[28px] min-h-[28px] inline-flex items-center justify-center rounded-full hover:bg-forest-dark"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Empty states ------------------------------- */

export function EmptyState({
  title, body, action
}: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-6 border border-dashed border-sand rounded-panel bg-paper">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cream mb-3">
        <Info size={22} className="text-ink-muted" aria-hidden="true" />
      </span>
      <h3 className="text-[17px] font-semibold text-ink mb-1">{title}</h3>
      <p className="text-[15px] text-ink-muted max-w-md mx-auto mb-4">{body}</p>
      {action}
    </div>
  );
}

/* --------------------------------- Structure -------------------------------- */

export function PageHeader({
  title, subtitle, actions, back
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <header className="mb-5">
      {back && <div className="mb-2">{back}</div>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

export function Panel({
  title, subtitle, actions, children, className = '', padded = true
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`panel ${padded ? 'p-4 md:p-5' : ''} ${className}`}>
      {(title || actions) && (
        <div className="panel-header">
          <div className="min-w-0">
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && <p className="panel-sub">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormSection({
  title, description, children
}: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <div className="mb-3">
        <h3 className="section-title">{title}</h3>
        {description && <p className="text-[13px] text-ink-muted mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* ----------------------------------- Stats ---------------------------------- */

export function Stat({
  label, value, sub, tone = 'default', icon
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'forest' | 'gold' | 'danger';
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    default: 'bg-paper border-sand',
    forest: 'bg-forest-tint border-forest/20',
    gold: 'bg-gold-tint border-gold/30',
    danger: 'bg-danger-tint border-danger/25'
  };
  return (
    <div className={`border rounded-panel p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] text-ink-muted font-medium leading-snug">{label}</div>
        {icon && (
          <span
            className={`shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center
              ${tone === 'default' ? 'bg-cream text-ink-muted' : 'bg-paper text-ink-muted'}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-[24px] font-bold text-ink num leading-tight mt-1">{value}</div>
      {sub && <div className="text-[13px] text-ink-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-cream-deep skeleton-pulse rounded-input ${className}`} />;
}

export function StatSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[92px] bg-cream-deep skeleton-pulse rounded-panel" />
      ))}
    </div>
  );
}

/* --------------------------------- Uploads ---------------------------------- */

export function FileDropzone({ onFiles }: { onFiles: (names: string[]) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`border border-dashed rounded-panel p-6 text-center transition-colors duration-150 ${
        drag ? 'border-forest bg-forest-tint' : 'border-sand bg-cream/40'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(Array.from(e.dataTransfer.files).map(f => f.name));
      }}
    >
      <p className="text-[15px] text-ink">Drag files here, or</p>
      <label className="inline-block mt-1 cursor-pointer text-forest font-semibold underline underline-offset-2">
        choose files
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(Array.from(e.target.files || []).map(f => f.name))}
        />
      </label>
      <p className="text-[13px] text-ink-muted mt-1">Images and PDFs</p>
    </div>
  );
}

/* ---------------------------------- Alerts ---------------------------------- */

export function Alert({
  tone = 'info', title, children
}: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    info: 'bg-blue-tint text-deep-blue',
    warning: 'bg-warning-tint text-warning',
    danger: 'bg-danger-tint text-danger',
    success: 'bg-forest-tint text-forest'
  };
  const Icon = tone === 'danger' || tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className={`rounded-panel p-4 flex gap-3 items-start text-[15px] ${map[tone]}`} role="status">
      <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------- Pagination -------------------------------- */

export function Pagination({
  page, total, onPage, perPage = 20
}: { page: number; total: number; onPage: (p: number) => void; perPage?: number }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <span className="text-[13px] text-ink-muted num">
        Showing {from} to {to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={15} /> Previous
        </Button>
        <span className="text-[13px] text-ink-muted num px-1">{page} / {pages}</span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Search ----------------------------------- */

export function SearchBar({
  value, onChange, placeholder, className = ''
}: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field pl-10 pr-3"
      />
    </div>
  );
}

/* -------------------------------- Segmented --------------------------------- */

export function Segmented<T extends string>({
  options, value, onChange, label, className = ''
}: {
  options: { value: T; label: string; meta?: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <span className="block text-[15px] font-medium text-ink mb-1.5">{label}</span>}
      <div
        className="inline-flex w-full gap-1.5 p-1.5 border border-sand rounded-pill bg-paper"
        role="group"
        aria-label={label}
      >
        {options.map(o => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`flex-1 min-h-[40px] px-3 rounded-pill text-[15px] font-semibold capitalize whitespace-nowrap
                transition-colors duration-150 ${
                  active
                    ? 'bg-forest text-cream'
                    : 'bg-transparent text-ink-muted hover:bg-cream-deep hover:text-ink'
                }`}
            >
              {o.label}
              {o.meta && (
                <span className={`ml-1.5 text-[13px] font-normal ${active ? 'text-cream/85' : 'text-ink-muted'}`}>
                  {o.meta}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Detail fields ------------------------------- */

export function DetailGrid({
  items
}: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[15px]">
      {items.map(i => (
        <div key={i.label} className="min-w-0">
          <dt className="text-ink-muted text-[13px]">{i.label}</dt>
          <dd className="m-0 font-medium num break-words">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------- Hook ------------------------------------ */

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = () => {
    setLoading(true);
    fn()
      .then(setData)
      .catch(() => setError('Something went wrong. Please try again.'))
      .finally(() => setLoading(false));
  };
  React.useEffect(() => { reload(); }, deps);
  return { data, loading, error, reload };
}
