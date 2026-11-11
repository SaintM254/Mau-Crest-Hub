import {
  Button, IconButton, Input, NumberInput, Select, Textarea, Checkbox, Switch, Tabs, Badge,
  StatusPill, Dialog, EmptyState, FormSection, FileDropzone, Stat, ConfirmDialog, Skeleton,
  Alert, SearchBar, Pagination, Segmented, PageHeader, Panel, DetailGrid, StatSkeletonGrid
} from '../../components/ui';
import { CowIcon } from '../../components/ui/CowIcon';
import { useState } from 'react';
import { Milk, Search } from 'lucide-react';

export function DesignSystem() {
  const [tab, setTab] = useState('a');
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [segment, setSegment] = useState<'morning' | 'midday' | 'evening'>('morning');
  const [view, setView] = useState<'percow' | 'batch'>('percow');

  const Section = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
    <section>
      <h2 className="section-title">{title}</h2>
      {note && <p className="text-[13px] text-ink-muted mt-0.5 mb-3">{note}</p>}
      <div className={note ? '' : 'mt-3'}>{children}</div>
    </section>
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Design system"
        subtitle="Components used across Mau Crest Hub. Flat fills only, 1px borders, no shadows, no gradients, pill-shaped controls and 16px panels. Colour is never the only signal."
      />

      <Section title="Page header" note="Title, optional subtitle, optional actions.">
        <div className="panel p-4">
          <PageHeader
            title="Example page"
            subtitle="One line explaining what this page is for."
            actions={<Button size="sm">Primary action</Button>}
          />
        </div>
      </Section>

      <Section title="Buttons" note="Pill shaped. Primary is forest, secondary is outlined paper, danger uses the danger tint. Disabled buttons go cream rather than fading.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="gold">Gold</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm" variant="secondary">Small</Button>
          <Button size="sm"><Milk size={15} /> With icon</Button>
          <IconButton aria-label="Example icon button"><Search size={18} /></IconButton>
        </div>
      </Section>

      <Section title="Icons" note="The livestock mark is drawn at the same weight as the icon set, so it sits evenly with the rest.">
        <div className="flex flex-wrap items-center gap-4 panel p-4">
          <span className="inline-flex items-center gap-2 text-[15px]"><CowIcon size={20} /> Livestock</span>
          <span className="inline-flex items-center gap-2 text-[15px]"><CowIcon size={26} /> Large</span>
          <span className="inline-flex items-center gap-2 text-[15px]"><CowIcon size={20} className="text-forest" /> Forest</span>
        </div>
      </Section>

      <Section title="Form fields" note="44px minimum height, 6px radius, forest border on focus.">
        <div className="space-y-3 max-w-md">
          <Input label="Text input" placeholder="Type here" hint="Hint text sits under the field" />
          <Input label="Input with error" placeholder="Type here" error="This field is required" />
          <NumberInput label="Number input" placeholder="0.0" />
          <Select label="Select" options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} />
          <Textarea label="Textarea" />
          <Checkbox label="Checkbox" />
          <Switch label="Switch" />
          <SearchBar value="" onChange={() => {}} placeholder="Search" />
        </div>
      </Section>

      <Section title="Segmented control" note="For two to four mutually exclusive choices, such as milk session or entry mode. Labels always fit inside the pill.">
        <div className="space-y-3 max-w-lg">
          <Segmented
            label="Session"
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'morning' as const, label: 'Morning' },
              { value: 'midday' as const, label: 'Midday' },
              { value: 'evening' as const, label: 'Evening' }
            ]}
          />
          <Segmented
            value={view}
            onChange={setView}
            options={[{ value: 'percow' as const, label: 'Per cow' }, { value: 'batch' as const, label: 'Per batch' }]}
          />
        </div>
      </Section>

      <Section title="Tabs and badges" note="Status pills include a dot so status is not shown by colour alone.">
        <Tabs tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} active={tab} onChange={setTab} />
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge>Neutral</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="gold">Gold</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <StatusPill tone="success">Online</StatusPill>
          <StatusPill tone="warning">Waiting to sync</StatusPill>
          <StatusPill tone="danger">Overdue</StatusPill>
        </div>
      </Section>

      <Section title="Stats" note="Four tones. Figures use tabular numerals.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Milk today" value="642.5 L" sub="Morning 320 L" />
          <Stat label="Revenue" value="KES 45,000" sub="This month" tone="forest" />
          <Stat label="Credit owed" value="KES 12,500" tone="gold" />
          <Stat label="In withdrawal" value="3" sub="Milk not for sale" tone="danger" />
        </div>
      </Section>

      <Section title="Panels" note="10px radius, 1px sand border, no shadow.">
        <Panel title="Panel with header" subtitle="Optional supporting line" actions={<Button size="sm" variant="secondary">Action</Button>}>
          <p className="text-[15px]">Panel body content.</p>
        </Panel>
      </Section>

      <Section title="Tables" note="Headers are cream-deep with muted sentence case labels. Rows have 1px sand dividers and no double borders.">
        <div className="panel overflow-x-auto">
          <table className="table-base min-w-[520px]">
            <thead>
              <tr><th>Cow</th><th>Group</th><th>Litres today</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[['MC-001', 'Lactating', '18.5 L', 'success'], ['MC-014', 'Lactating', '16.2 L', 'success'], ['MC-032', 'Dry', '—', 'info']].map(r => (
                <tr key={r[0]}>
                  <td className="num font-medium">{r[0]}</td>
                  <td>{r[1]}</td>
                  <td className="num">{r[2]}</td>
                  <td><StatusPill tone={r[3] as 'success' | 'info'}>{r[3] === 'success' ? 'In milk' : 'Dry'}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Detail grid" note="Label above value, used on profile and record pages.">
        <div className="panel p-4">
          <DetailGrid
            items={[
              { label: 'Tag', value: 'MC-001' },
              { label: 'Breed', value: 'Friesian' },
              { label: 'Age', value: '4 yr 2 mo' },
              { label: 'Balance', value: 'KES 12,500' }
            ]}
          />
        </div>
      </Section>

      <Section title="Alerts" note="Tone never carries meaning alone: each alert has an icon and a label.">
        <div className="space-y-2">
          <Alert tone="info" title="Information">Information message.</Alert>
          <Alert tone="warning" title="Check this">Warning message.</Alert>
          <Alert tone="danger" title="Action needed">Error message.</Alert>
          <Alert tone="success" title="Done">Success message.</Alert>
        </div>
      </Section>

      <Section title="Dialogs, sheets and files">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>Open confirm</Button>
        </div>
        <div className="mt-3">
          <FileDropzone onFiles={setFiles} />
          {files.length > 0 && <p className="text-[13px] text-ink-muted mt-1">{files.join(', ')}</p>}
        </div>
      </Section>

      <Section title="Empty states and skeletons" note="Skeletons use a flat opacity pulse, never a gradient.">
        <EmptyState title="Nothing here yet" body="This is how empty screens look." action={<Button size="sm">Add the first record</Button>} />
        <div className="mt-3">
          <Skeleton className="h-10 w-full" />
          <div className="mt-3"><StatSkeletonGrid count={4} /></div>
        </div>
      </Section>

      <Section title="Form sections and pagination">
        <FormSection title="Example section" description="Groups related fields in long forms.">
          <Input label="Field" />
          <Pagination page={1} total={50} onPage={() => {}} />
        </FormSection>
      </Section>

      <Dialog open={dialog} onClose={() => setDialog(false)} title="Example dialog" description="Dialogs have a solid scrim, 12px radius and no shadow.">
        <p className="text-[15px]">Dialog content.</p>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setDialog(false)}>Close</Button>
        </div>
      </Dialog>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} title="Confirm" body="Are you sure?" />
    </div>
  );
}
