import { Button, IconButton, Input, NumberInput, Select, Textarea, Checkbox, Switch, Tabs, Badge, Dialog, EmptyState, FormSection, FileDropzone, Stat, ConfirmDialog, Skeleton, Alert, SearchBar, Pagination } from '../../components/ui';
import { useState } from 'react';

export function DesignSystem() {
  const [tab, setTab] = useState('a');
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-[24px] font-bold">Design system</h1>
      <p className="text-[15px] text-ink-muted">Components used across Mau Crest Hub. Flat fills only, 1px borders, no shadows, no gradients.</p>

      <section><h2 className="text-[17px] font-semibold mb-3">Buttons</h2><div className="flex flex-wrap gap-3"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="danger">Danger</Button><Button variant="ghost">Ghost</Button><Button variant="gold">Gold</Button></div></section>
      <section><h2 className="text-[17px] font-semibold mb-3">Inputs</h2><div className="space-y-3 max-w-md"><Input label="Text input" placeholder="Type here" hint="Hint text" /><NumberInput label="Number input" placeholder="0.0" /><Select label="Select" options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} /><Textarea label="Textarea" /><Checkbox label="Checkbox" /><Switch label="Switch" /><SearchBar value="" onChange={() => {}} placeholder="Search" /></div></section>
      <section><h2 className="text-[17px] font-semibold mb-3">Tabs and badges</h2><Tabs tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} active={tab} onChange={setTab} /><div className="flex gap-2 mt-3"><Badge>Neutral</Badge><Badge tone="success">Success</Badge><Badge tone="info">Info</Badge><Badge tone="danger">Danger</Badge><Badge tone="warning">Warning</Badge><Badge tone="gold">Gold</Badge></div></section>
      <section><h2 className="text-[17px] font-semibold mb-3">Stats and alerts</h2><div className="grid grid-cols-2 gap-3"><Stat label="Milk today" value="642.5 L" sub="Morning 320 L" /><Stat label="Revenue" value="KES 45,000" /></div><div className="mt-3 space-y-2"><Alert tone="info">Information message.</Alert><Alert tone="warning">Warning message.</Alert><Alert tone="danger">Error message.</Alert><Alert tone="success">Success message.</Alert></div></section>
      <section><h2 className="text-[17px] font-semibold mb-3">Dialogs and files</h2><div className="flex gap-3"><Button onClick={() => setDialog(true)}>Open dialog</Button><Button variant="secondary" onClick={() => setConfirm(true)}>Open confirm</Button></div><div className="mt-3"><FileDropzone onFiles={setFiles} />{files.length > 0 && <p className="text-[13px] mt-1">{files.join(', ')}</p>}</div></section>
      <section><h2 className="text-[17px] font-semibold mb-3">Empty state and skeleton</h2><EmptyState title="Nothing here yet" body="This is how empty screens look." /><div className="mt-3"><Skeleton className="h-10 w-full" /></div></section>
      <section><h2 className="text-[17px] font-semibold mb-3">Form section and pagination</h2><FormSection title="Example section"><Input label="Field" /><Pagination page={1} total={50} onPage={() => {}} /></FormSection></section>

      <Dialog open={dialog} onClose={() => setDialog(false)} title="Example dialog"><p className="text-[15px]">Dialog content.</p><div className="flex gap-3 justify-end mt-4"><Button variant="secondary" onClick={() => setDialog(false)}>Close</Button></div></Dialog>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} title="Confirm" body="Are you sure?" />
    </div>
  );
}
