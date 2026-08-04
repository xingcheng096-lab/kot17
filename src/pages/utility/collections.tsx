import { useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUtilityCollections, useMembers } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatCurrency, formatMonthLabel, exportToCSV, type UtilityCollection } from '@/lib/types';
import { toast } from 'sonner';

const emptyForm = {
  member_name: '',
  month: new Date().toISOString().slice(0, 7),
  electricity_kwh: '',
  water_m3: '',
  amount: '',
  paid: false,
  notes: '',
};

export function UtilityCollectionsPage() {
  const { data: collections, setData } = useUtilityCollections();
  const { data: members } = useMembers();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UtilityCollection | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = collections.filter(
    (c) => !search || c.member_name.toLowerCase().includes(search.toLowerCase()) || c.month.includes(search),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: UtilityCollection) => {
    setEditing(c);
    setForm({
      member_name: c.member_name,
      month: c.month,
      electricity_kwh: String(c.electricity_kwh),
      water_m3: String(c.water_m3),
      amount: String(c.amount),
      paid: c.paid,
      notes: c.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.member_name || !form.amount) {
      toast.error('Member name and amount are required');
      return;
    }
    setSubmitting(true);
    const member = members.find((m) => m.khmer_name === form.member_name || m.english_name === form.member_name);
    const payload = {
      member_id: member?.id ?? null,
      member_name: form.member_name,
      month: form.month,
      electricity_kwh: parseFloat(form.electricity_kwh) || 0,
      water_m3: parseFloat(form.water_m3) || 0,
      amount: parseFloat(form.amount),
      paid: form.paid,
      paid_date: form.paid ? new Date().toISOString().slice(0, 10) : null,
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('utility_collections').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((c) => (c.id === editing.id ? (data as UtilityCollection) : c)));
      await logActivity('update_utility_collection', 'utility_collections', `Updated ${form.member_name}`, profile?.full_name);
      toast.success('Collection updated');
    } else {
      const { data, error } = await supabase.from('utility_collections').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as UtilityCollection, ...prev]);
      await logActivity('create_utility_collection', 'utility_collections', `Added ${form.member_name}`, profile?.full_name);
      toast.success('Collection added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (c: UtilityCollection) => {
    if (!confirm(`Delete collection for ${c.member_name}?`)) return;
    const { error } = await supabase.from('utility_collections').delete().eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== c.id));
    await logActivity('delete_utility_collection', 'utility_collections', `Deleted ${c.member_name}`, profile?.full_name);
    toast.success('Collection deleted');
  };

  const togglePaid = async (c: UtilityCollection) => {
    const paid = !c.paid;
    const { data, error } = await supabase
      .from('utility_collections')
      .update({ paid, paid_date: paid ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', c.id)
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.map((x) => (x.id === c.id ? (data as UtilityCollection) : x)));
  };

  const handleExport = () => {
    exportToCSV('kot17_utility_collections', filtered.map((c) => ({
      Member: c.member_name, Month: c.month, ElectricityKwh: c.electricity_kwh, WaterM3: c.water_m3,
      Amount: c.amount, Paid: c.paid ? 'Yes' : 'No', PaidDate: c.paid_date ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<UtilityCollection>[] = [
    { key: 'member', header: 'Member', headerKh: 'សមាជិក', cell: (r) => <span className="font-medium">{r.member_name}</span> },
    { key: 'month', header: 'Month', headerKh: 'ខែ', cell: (r) => <span className="text-sm">{formatMonthLabel(r.month)}</span> },
    { key: 'elec', header: 'Electricity (kWh)', headerKh: 'អគ្គិសនី', align: 'right', cell: (r) => <span className="text-sm">{r.electricity_kwh}</span> },
    { key: 'water', header: 'Water (m³)', headerKh: 'ទឹក', align: 'right', cell: (r) => <span className="text-sm">{r.water_m3}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold">{formatCurrency(Number(r.amount))}</span> },
    {
      key: 'paid',
      header: 'Status',
      headerKh: 'ស្ថានភាព',
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
        title="Utility Collection"
        titleKh="ការប្រមូលថ្លៃទឹក និងអគ្គិសនី"
        subtitle="Monthly water & electricity collections"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Collection</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search member or month..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Collections / ការប្រមូល
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Collection' : 'Add Collection'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Member Name / ឈ្មោះសមាជិក *</Label>
              <Input list="member-list" value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} />
              <datalist id="member-list">
                {members.map((m) => <option key={m.id} value={m.khmer_name} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Month / ខែ</Label>
              <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount / ចំនួន *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Electricity (kWh)</Label>
              <Input type="number" step="0.01" value={form.electricity_kwh} onChange={(e) => setForm({ ...form, electricity_kwh: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Water (m³)</Label>
              <Input type="number" step="0.01" value={form.water_m3} onChange={(e) => setForm({ ...form, water_m3: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
                Paid / បានបង់
              </label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes / កំណត់ហេតុ</Label>
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
