import { useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, HandCoins } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
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
import { useFoodContributions, useMembers } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatCurrency, formatDate, exportToCSV, type FoodContribution } from '@/lib/types';
import { toast } from 'sonner';

const emptyForm = {
  member_name: '',
  contribution_date: new Date().toISOString().slice(0, 10),
  amount: '',
  notes: '',
};

export function FoodContributionsPage() {
  const { data: contributions, setData } = useFoodContributions();
  const { data: members } = useMembers();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FoodContribution | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = contributions.filter(
    (c) => !search || c.member_name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (c: FoodContribution) => {
    setEditing(c);
    setForm({
      member_name: c.member_name,
      contribution_date: c.contribution_date,
      amount: String(c.amount),
      notes: c.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.member_name || !form.amount) { toast.error('Member name and amount are required'); return; }
    setSubmitting(true);
    const member = members.find((m) => m.khmer_name === form.member_name || m.english_name === form.member_name);
    const payload = {
      member_id: member?.id ?? null,
      member_name: form.member_name,
      contribution_date: form.contribution_date,
      amount: parseFloat(form.amount),
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('food_contributions').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((c) => (c.id === editing.id ? (data as FoodContribution) : c)));
      await logActivity('update_food_contribution', 'food_contributions', `Updated ${form.member_name}`, profile?.full_name);
      toast.success('Contribution updated');
    } else {
      const { data, error } = await supabase.from('food_contributions').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as FoodContribution, ...prev]);
      await logActivity('create_food_contribution', 'food_contributions', `Added ${form.member_name}`, profile?.full_name);
      toast.success('Contribution added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (c: FoodContribution) => {
    if (!confirm(`Delete contribution from ${c.member_name}?`)) return;
    const { error } = await supabase.from('food_contributions').delete().eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== c.id));
    await logActivity('delete_food_contribution', 'food_contributions', `Deleted ${c.member_name}`, profile?.full_name);
    toast.success('Contribution deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_food_contributions', filtered.map((c) => ({
      Member: c.member_name, Date: c.contribution_date, Amount: c.amount, Notes: c.notes ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<FoodContribution>[] = [
    { key: 'member', header: 'Member', headerKh: 'សមាជិក', cell: (r) => <span className="font-medium">{r.member_name}</span> },
    { key: 'date', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.contribution_date)}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold text-success">{formatCurrency(Number(r.amount))}</span> },
    { key: 'notes', header: 'Notes', headerKh: 'កំណត់ហេតុ', cell: (r) => <span className="text-sm text-muted-foreground">{r.notes ?? '-'}</span> },
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

  const total = filtered.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Contributions"
        titleKh="ការបរិច្ចាប្រចាំថ្ងៃ"
        subtitle="Food fund contributions"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Contribution</Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search member..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="rounded-lg bg-success/10 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-success">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-primary" />
            Contributions / ការបរិច្ចាគ
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent><DataTable columns={columns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Contribution' : 'Add Contribution'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Member Name / ឈ្មោះសមាជិក *</Label>
              <Input list="member-list" value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} />
              <datalist id="member-list">
                {members.map((m) => <option key={m.id} value={m.khmer_name} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date / កាលបរិច្ឆេទ</Label>
                <Input type="date" value={form.contribution_date} onChange={(e) => setForm({ ...form, contribution_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount / ចំនួន *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
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
