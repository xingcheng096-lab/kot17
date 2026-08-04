import { useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
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
import { useFoodExpenses } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatCurrency, formatDate, exportToCSV, type FoodExpense } from '@/lib/types';
import { toast } from 'sonner';

const emptyForm = {
  expense_date: new Date().toISOString().slice(0, 10),
  item: '',
  amount: '',
  quantity: '1',
  vendor: '',
  notes: '',
};

export function FoodExpensesPage() {
  const { data: expenses, setData } = useFoodExpenses();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FoodExpense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = expenses.filter(
    (e) => !search || e.item.toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (e: FoodExpense) => {
    setEditing(e);
    setForm({
      expense_date: e.expense_date,
      item: e.item,
      amount: String(e.amount),
      quantity: String(e.quantity),
      vendor: e.vendor ?? '',
      notes: e.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.item || !form.amount) { toast.error('Item and amount are required'); return; }
    setSubmitting(true);
    const payload = {
      expense_date: form.expense_date,
      item: form.item,
      amount: parseFloat(form.amount),
      quantity: parseFloat(form.quantity) || 1,
      vendor: form.vendor || null,
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('food_expenses').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((e) => (e.id === editing.id ? (data as FoodExpense) : e)));
      await logActivity('update_food_expense', 'food_expenses', `Updated ${form.item}`, profile?.full_name);
      toast.success('Expense updated');
    } else {
      const { data, error } = await supabase.from('food_expenses').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as FoodExpense, ...prev]);
      await logActivity('create_food_expense', 'food_expenses', `Added ${form.item}`, profile?.full_name);
      toast.success('Expense added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (e: FoodExpense) => {
    if (!confirm(`Delete expense "${e.item}"?`)) return;
    const { error } = await supabase.from('food_expenses').delete().eq('id', e.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== e.id));
    await logActivity('delete_food_expense', 'food_expenses', `Deleted ${e.item}`, profile?.full_name);
    toast.success('Expense deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_food_expenses', filtered.map((e) => ({
      Date: e.expense_date, Item: e.item, Amount: e.amount, Quantity: e.quantity,
      Vendor: e.vendor ?? '', Notes: e.notes ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<FoodExpense>[] = [
    { key: 'date', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.expense_date)}</span> },
    { key: 'item', header: 'Item', headerKh: 'ធាតុ', cell: (r) => <span className="font-medium">{r.item}</span> },
    { key: 'qty', header: 'Qty', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="text-sm">{r.quantity}</span> },
    { key: 'vendor', header: 'Vendor', headerKh: 'អ្នកលក់', cell: (r) => <span className="text-sm">{r.vendor ?? '-'}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold text-destructive">{formatCurrency(Number(r.amount))}</span> },
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

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Expenses"
        titleKh="ការចំណាយស្បៀងអាហារ"
        subtitle="Daily food fund expenses"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search item or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-destructive">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Food Expenses / ការចំណាយស្បៀង
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent><DataTable columns={columns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Date / កាលបរិច្ឆេទ</Label>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vendor / អ្នកលក់</Label>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Item / ធាតុ *</Label>
              <Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="អង្ករ, បន្លែ..." />
            </div>
            <div className="space-y-2">
              <Label>Quantity / ចំនួន</Label>
              <Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount / ចំនួន *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
