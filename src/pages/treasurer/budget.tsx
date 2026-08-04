import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, PiggyBank, Download, AlertTriangle,
  TrendingUp, Wallet, Target,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { BarChart } from '@/components/shared/charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBudgets } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import {
  EXPENSE_CATEGORIES, formatCurrency, formatMonthLabel, exportToCSV,
  type Budget,
} from '@/lib/types';
import { toast } from 'sonner';

const emptyForm = {
  budget_month: new Date().toISOString().slice(0, 7),
  category: 'general',
  planned_amount: '',
  actual_amount: '',
  notes: '',
};

export function TreasurerBudgetPage() {
  const { data: budgets, setData } = useBudgets();
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [yearFilter, setYearFilter] = useState('all');

  const yearOptions = useMemo(() => {
    const years = new Set(budgets.map((b) => b.budget_month.slice(0, 4)));
    return Array.from(years).sort().reverse();
  }, [budgets]);

  const filtered = useMemo(() => {
    if (yearFilter === 'all') return budgets;
    return budgets.filter((b) => b.budget_month.startsWith(yearFilter));
  }, [budgets, yearFilter]);

  const totalPlanned = filtered.reduce((s, b) => s + Number(b.planned_amount), 0);
  const totalActual = filtered.reduce((s, b) => s + Number(b.actual_amount), 0);
  const totalRemaining = totalPlanned - totalActual;
  const utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const warnings = filtered.filter((b) => {
    const pct = b.planned_amount > 0 ? (Number(b.actual_amount) / Number(b.planned_amount)) * 100 : 0;
    return pct >= 80;
  });

  const monthlyData = useMemo(() => {
    const map = new Map<string, { planned: number; actual: number }>();
    filtered.forEach((b) => {
      const m = b.budget_month;
      if (!map.has(m)) map.set(m, { planned: 0, actual: 0 });
      const entry = map.get(m)!;
      entry.planned += Number(b.planned_amount);
      entry.actual += Number(b.actual_amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ name: formatMonthLabel(k), planned: v.planned, actual: v.actual }));
  }, [filtered]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (b: Budget) => {
    setEditing(b);
    setForm({
      budget_month: b.budget_month, category: b.category,
      planned_amount: String(b.planned_amount), actual_amount: String(b.actual_amount),
      notes: b.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.budget_month || !form.planned_amount) { toast.error('Month and planned amount are required'); return; }
    setSubmitting(true);
    const payload = {
      budget_month: form.budget_month, category: form.category,
      planned_amount: parseFloat(form.planned_amount),
      actual_amount: form.actual_amount ? parseFloat(form.actual_amount) : 0,
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('budgets').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((b) => (b.id === editing.id ? (data as Budget) : b)));
      await logActivity('update_budget', 'budgets', `Updated ${form.budget_month}`, profile?.full_name);
      toast.success('Budget updated');
    } else {
      const { data, error } = await supabase.from('budgets').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as Budget, ...prev]);
      await logActivity('create_budget', 'budgets', `Added ${form.budget_month}`, profile?.full_name);
      toast.success('Budget added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (b: Budget) => {
    if (!confirm(`Delete budget for ${b.budget_month}?`)) return;
    const { error } = await supabase.from('budgets').delete().eq('id', b.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== b.id));
    await logActivity('delete_budget', 'budgets', `Deleted ${b.budget_month}`, profile?.full_name);
    toast.success('Budget deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_budgets', filtered.map((b) => ({
      Month: b.budget_month, Category: EXPENSE_CATEGORIES[b.category]?.en ?? b.category,
      Planned: b.planned_amount, Actual: b.actual_amount,
      Variance: Number(b.planned_amount) - Number(b.actual_amount), Notes: b.notes ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Budget>[] = [
    { key: 'month', header: 'Month', headerKh: 'ខែ', cell: (r) => <span className="font-medium">{formatMonthLabel(r.budget_month)}</span> },
    { key: 'category', header: 'Category', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant="outline" className="font-khmer text-xs">{EXPENSE_CATEGORIES[r.category]?.kh ?? r.category}</Badge> },
    { key: 'planned', header: 'Planned', headerKh: 'គ្រោង', align: 'right', cell: (r) => <span className="font-medium">{formatCurrency(Number(r.planned_amount))}</span> },
    { key: 'actual', header: 'Actual', headerKh: 'ពិតប្រាកដ', align: 'right', cell: (r) => {
      const over = Number(r.actual_amount) > Number(r.planned_amount);
      return <span className={over ? 'font-medium text-destructive' : 'font-medium text-success'}>{formatCurrency(Number(r.actual_amount))}</span>;
    } },
    { key: 'variance', header: 'Variance', headerKh: 'ផ្លាស់ប្ដូរ', align: 'right', cell: (r) => {
      const v = Number(r.planned_amount) - Number(r.actual_amount);
      return <span className={v >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(v)}</span>;
    } },
    { key: 'progress', header: 'Progress', headerKh: 'ដំណើរការ', cell: (r) => {
      const pct = r.planned_amount > 0 ? Math.min(100, (Number(r.actual_amount) / Number(r.planned_amount)) * 100) : 0;
      const over = Number(r.actual_amount) > Number(r.planned_amount);
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
            <div className={over ? 'h-full bg-destructive' : pct >= 80 ? 'h-full bg-warning' : 'h-full bg-primary'} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
      );
    } },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Budget</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Budget Management"
        titleKh="ការគ្រប់គ្រងថវិកា"
        subtitle="Plan and track annual and monthly budgets"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Budget</Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Planned" titleKh="គ្រោងសរុប" value={formatCurrency(totalPlanned)} icon={Target} accent="primary" />
        <StatCard title="Total Actual" titleKh="ពិតប្រាកដសរុប" value={formatCurrency(totalActual)} icon={Wallet} accent={totalActual > totalPlanned ? 'destructive' : 'success'} />
        <StatCard title="Remaining" titleKh="នៅសល់" value={formatCurrency(totalRemaining)} icon={PiggyBank} accent={totalRemaining >= 0 ? 'success' : 'destructive'} />
        <StatCard title="Utilization" titleKh="ការប្រើប្រាស់" value={`${utilization.toFixed(1)}%`} icon={TrendingUp} accent={utilization >= 80 ? 'warning' : 'info'} />
      </div>

      {/* Budget Warnings */}
      {warnings.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Budget Warnings / ការព្រមានថវិកា ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warnings.map((w) => {
                const pct = w.planned_amount > 0 ? (Number(w.actual_amount) / Number(w.planned_amount)) * 100 : 0;
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-lg border border-warning/20 bg-card p-3">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">{formatMonthLabel(w.budget_month)} — {EXPENSE_CATEGORIES[w.category]?.en ?? w.category}</span>
                    <span className="ml-auto text-sm text-warning">{pct.toFixed(0)}% used</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle>Planned vs Actual / គ្រោង និងពិតប្រាកដ</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={monthlyData}
            dataKeys={[
              { key: 'planned', name: 'Planned', color: 'hsl(var(--chart-3))' },
              { key: 'actual', name: 'Actual', color: 'hsl(var(--chart-1))' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Year Filter + Table */}
      <div className="flex items-center gap-3">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Budgets / ថវិកា
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Budget' : 'Add Budget'} / {editing ? 'កែសម្រួល' : 'បន្ថែមថវិកា'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Month / ខែ</Label>
              <Input type="month" value={form.budget_month} onChange={(e) => setForm({ ...form, budget_month: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category / ប្រភេទ</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(EXPENSE_CATEGORIES).map((c) => <SelectItem key={c} value={c}>{EXPENSE_CATEGORIES[c].en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Planned Amount / ចំនួនគ្រោង</Label>
              <Input type="number" step="0.01" value={form.planned_amount} onChange={(e) => setForm({ ...form, planned_amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Actual Amount / ចំនួនពិតប្រាកដ</Label>
              <Input type="number" step="0.01" value={form.actual_amount} onChange={(e) => setForm({ ...form, actual_amount: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes / កំណត់ហេតុ</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
