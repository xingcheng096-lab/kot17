import { useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, ReceiptText, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUtilityBills } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatCurrency, formatMonthLabel, formatDate, exportToCSV, type UtilityBill } from '@/lib/types';
import { toast } from 'sonner';

const emptyForm = {
  bill_month: new Date().toISOString().slice(0, 7),
  utility_type: 'electricity',
  provider: '',
  amount: '',
  usage: '',
  due_date: '',
  paid: false,
  notes: '',
};

export function UtilityBillsPage() {
  const { data: bills, setData } = useUtilityBills();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UtilityBill | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = bills.filter(
    (b) => !search || b.bill_month.includes(search) || b.utility_type.includes(search) || (b.provider ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (b: UtilityBill) => {
    setEditing(b);
    setForm({
      bill_month: b.bill_month,
      utility_type: b.utility_type,
      provider: b.provider ?? '',
      amount: String(b.amount),
      usage: String(b.usage),
      due_date: b.due_date ?? '',
      paid: b.paid,
      notes: b.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.amount || !form.bill_month) { toast.error('Month and amount are required'); return; }
    setSubmitting(true);
    const payload = {
      bill_month: form.bill_month,
      utility_type: form.utility_type,
      provider: form.provider || null,
      amount: parseFloat(form.amount),
      usage: parseFloat(form.usage) || 0,
      due_date: form.due_date || null,
      paid: form.paid,
      paid_date: form.paid ? new Date().toISOString().slice(0, 10) : null,
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('utility_bills').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((b) => (b.id === editing.id ? (data as UtilityBill) : b)));
      await logActivity('update_utility_bill', 'utility_bills', `Updated ${form.bill_month}`, profile?.full_name);
      toast.success('Bill updated');
    } else {
      const { data, error } = await supabase.from('utility_bills').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as UtilityBill, ...prev]);
      await logActivity('create_utility_bill', 'utility_bills', `Added ${form.bill_month}`, profile?.full_name);
      toast.success('Bill added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (b: UtilityBill) => {
    if (!confirm(`Delete bill for ${b.bill_month}?`)) return;
    const { error } = await supabase.from('utility_bills').delete().eq('id', b.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== b.id));
    await logActivity('delete_utility_bill', 'utility_bills', `Deleted ${b.bill_month}`, profile?.full_name);
    toast.success('Bill deleted');
  };

  const togglePaid = async (b: UtilityBill) => {
    const paid = !b.paid;
    const { data, error } = await supabase.from('utility_bills').update({ paid, paid_date: paid ? new Date().toISOString().slice(0, 10) : null }).eq('id', b.id).select().single();
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.map((x) => (x.id === b.id ? (data as UtilityBill) : x)));
  };

  const handleExport = () => {
    exportToCSV('kot17_utility_bills', filtered.map((b) => ({
      Month: b.bill_month, Type: b.utility_type, Provider: b.provider ?? '',
      Amount: b.amount, Usage: b.usage, DueDate: b.due_date ?? '',
      Paid: b.paid ? 'Yes' : 'No', PaidDate: b.paid_date ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<UtilityBill>[] = [
    { key: 'month', header: 'Month', headerKh: 'ខែ', cell: (r) => <span className="text-sm font-medium">{formatMonthLabel(r.bill_month)}</span> },
    { key: 'type', header: 'Type', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant={r.utility_type === 'electricity' ? 'default' : 'secondary'} className="text-xs">{r.utility_type}</Badge> },
    { key: 'provider', header: 'Provider', headerKh: 'ក្រុមហ៊ុន', cell: (r) => <span className="text-sm">{r.provider ?? '-'}</span> },
    { key: 'usage', header: 'Usage', headerKh: 'ការប្រើប្រាស់', align: 'right', cell: (r) => <span className="text-sm">{r.usage} {r.utility_type === 'electricity' ? 'kWh' : 'm³'}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold">{formatCurrency(Number(r.amount))}</span> },
    { key: 'due', header: 'Due Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{r.due_date ? formatDate(r.due_date) : '-'}</span> },
    {
      key: 'paid', header: 'Status', headerKh: 'ស្ថានភាព',
      cell: (r) => (
        <button onClick={(e) => { e.stopPropagation(); togglePaid(r); }}>
          <Badge variant={r.paid ? 'default' : 'secondary'} className="cursor-pointer text-xs">
            {r.paid ? <><CheckCircle2 className="mr-1 h-3 w-3" />Paid</> : <><XCircle className="mr-1 h-3 w-3" />Unpaid</>}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Bills"
        titleKh="វិក្កយបត្រប្រចាំខែ"
        subtitle="Utility bills from providers"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Bill</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search month, type, or provider..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Bills / វិក្កយបត្រ
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent><DataTable columns={columns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Bill' : 'Add Bill'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Month / ខែ</Label>
              <Input type="month" value={form.bill_month} onChange={(e) => setForm({ ...form, bill_month: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type / ប្រភេទ</Label>
              <Select value={form.utility_type} onValueChange={(v) => setForm({ ...form, utility_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity">Electricity / អគ្គិសនី</SelectItem>
                  <SelectItem value="water">Water / ទឹក</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider / ក្រុមហ៊ុន</Label>
              <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="EDC / PPWSA" />
            </div>
            <div className="space-y-2">
              <Label>Amount / ចំនួន *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Usage / ការប្រើ</Label>
              <Input type="number" step="0.01" value={form.usage} onChange={(e) => setForm({ ...form, usage: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Due Date / កាលបរិច្ឆេទ</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
                Paid / បានបង់
              </label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
