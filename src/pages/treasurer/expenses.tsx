import { useState, useMemo } from 'react';
import {
  Plus, Search, Download, Pencil, Trash2, Wallet, Printer, Eye,
  ChevronLeft, ChevronRight, Filter, Upload, AlertTriangle, CheckCircle2,
  Clock, XCircle, BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { BarChart, PieChart } from '@/components/shared/charts';
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
import { useExpenses, useBudgets } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import {
  EXPENSE_CATEGORIES, PAYMENT_METHODS, APPROVAL_STATUS,
  formatCurrency, formatDate, exportToCSV, printArea,
  type Expense,
} from '@/lib/types';
import { categoryBreakdown } from '@/lib/stats';
import { toast } from 'sonner';

const emptyForm = {
  title: '', amount: '', expense_date: new Date().toISOString().slice(0, 10),
  category: 'general', payee: '', payment_method: 'cash',
  receipt_no: '', notes: '', approval_status: 'approved',
};

const PAGE_SIZE = 10;

export function TreasurerExpensesPage() {
  const { data: expenses, setData } = useExpenses();
  const { data: budgets } = useBudgets();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !(e.payee ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && e.approval_status !== statusFilter) return false;
      return true;
    });
  }, [expenses, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const pendingCount = expenses.filter((e) => e.approval_status === 'pending').length;
  const approvedCount = expenses.filter((e) => e.approval_status === 'approved').length;
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses.filter((e) => e.expense_date.startsWith(monthKey)).reduce((s, e) => s + Number(e.amount), 0);

  const expenseByCat = categoryBreakdown(expenses, EXPENSE_CATEGORIES);
  const monthlyByCat = useMemo(() => {
    const map = new Map<string, number>();
    expenses.filter((e) => e.expense_date.startsWith(monthKey)).forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([k, v]) => ({ name: EXPENSE_CATEGORIES[k]?.en ?? k, value: v }));
  }, [expenses, monthKey]);

  const checkBudget = (category: string, amount: number): { ok: boolean; message: string } => {
    const budget = budgets.find((b) => b.budget_month === monthKey && b.category === category);
    if (!budget) return { ok: true, message: 'No budget set for this category' };
    const spent = expenses.filter((e) => e.expense_date.startsWith(monthKey) && e.category === category).reduce((s, e) => s + Number(e.amount), 0);
    const remaining = Number(budget.planned_amount) - spent;
    if (amount > remaining) return { ok: false, message: `Over budget! Remaining: ${formatCurrency(remaining)}` };
    if (amount > remaining * 0.8) return { ok: true, message: `Warning: only ${formatCurrency(remaining)} remaining` };
    return { ok: true, message: `Budget OK: ${formatCurrency(remaining)} remaining` };
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, receipt_no: `E-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}` });
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      title: e.title, amount: String(e.amount), expense_date: e.expense_date,
      category: e.category, payee: e.payee ?? '', payment_method: e.payment_method,
      receipt_no: e.receipt_no ?? '', notes: e.notes ?? '',
      approval_status: e.approval_status ?? 'approved',
    });
    setDialogOpen(true);
  };

  const openView = (e: Expense) => { setViewing(e); setViewOpen(true); };

  const handleSave = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount are required'); return; }
    const budgetCheck = checkBudget(form.category, parseFloat(form.amount));
    if (!budgetCheck.ok) {
      if (!confirm(`Budget warning: ${budgetCheck.message}. Continue?`)) return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title, amount: parseFloat(form.amount), expense_date: form.expense_date,
      category: form.category, payee: form.payee || null, payment_method: form.payment_method,
      receipt_no: form.receipt_no || null, notes: form.notes || null,
      approval_status: form.approval_status, budget_month: form.expense_date.slice(0, 7),
    };
    if (editing) {
      const { data, error } = await supabase.from('expenses').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((e) => (e.id === editing.id ? (data as Expense) : e)));
      await logActivity('update_expense', 'expenses', `Updated ${form.title}`, profile?.full_name);
      toast.success('Expense updated');
    } else {
      const { data, error } = await supabase.from('expenses').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as Expense, ...prev]);
      await logActivity('create_expense', 'expenses', `Added ${form.title}`, profile?.full_name);
      toast.success('Expense added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (e: Expense) => {
    if (!confirm(`Delete expense "${e.title}"?`)) return;
    const { error } = await supabase.from('expenses').delete().eq('id', e.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== e.id));
    await logActivity('delete_expense', 'expenses', `Deleted ${e.title}`, profile?.full_name);
    toast.success('Expense deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_expenses', filtered.map((e) => ({
      Title: e.title, Amount: e.amount, Date: e.expense_date,
      Category: EXPENSE_CATEGORIES[e.category]?.en ?? e.category,
      Payee: e.payee ?? '', Method: PAYMENT_METHODS[e.payment_method]?.en ?? e.payment_method,
      Receipt: e.receipt_no ?? '', Status: e.approval_status, Notes: e.notes ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Expense>[] = [
    { key: 'receipt', header: 'Receipt', headerKh: 'វិក្កយបត្រ', cell: (r) => <span className="font-mono text-xs">{r.receipt_no ?? '-'}</span> },
    { key: 'title', header: 'Title', headerKh: 'ចំណងជើង', cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold text-destructive">{formatCurrency(Number(r.amount))}</span> },
    { key: 'category', header: 'Category', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant="outline" className="font-khmer text-xs">{EXPENSE_CATEGORIES[r.category]?.kh ?? r.category}</Badge> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => {
      const s = APPROVAL_STATUS[r.approval_status] ?? APPROVAL_STATUS.approved;
      const icon = s.color === 'success' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : s.color === 'warning' ? <Clock className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />;
      return <Badge variant={s.color === 'success' ? 'default' : s.color === 'destructive' ? 'destructive' : 'secondary'} className="text-xs">{icon}{s.en}</Badge>;
    } },
    { key: 'payee', header: 'Payee', headerKh: 'អ្នកទទួល', cell: (r) => <span className="text-sm">{r.payee ?? '-'}</span> },
    { key: 'date', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.expense_date)}</span> },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
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
          <BreadcrumbItem><BreadcrumbPage>Expenses</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Expense Management"
        titleKh="ការគ្រប់គ្រងការចំណាយ"
        subtitle="Track and manage all expenses with budget checking"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Expenses" titleKh="ការចំណាយសរុប" value={formatCurrency(total)} icon={Wallet} accent="destructive" />
        <StatCard title="This Month" titleKh="ខែនេះ" value={formatCurrency(monthTotal)} icon={BarChart3} accent="warning" />
        <StatCard title="Pending" titleKh="រង់ចាំ" value={pendingCount} icon={Clock} accent="warning" />
        <StatCard title="Approved" titleKh="អនុម័ត" value={approvedCount} icon={CheckCircle2} accent="success" />
      </div>

      {/* Filter Panel */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search title or payee..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(EXPENSE_CATEGORIES).map((c) => <SelectItem key={c} value={c}>{EXPENSE_CATEGORIES[c].en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(APPROVAL_STATUS).map((s) => <SelectItem key={s} value={s}>{APPROVAL_STATUS[s].en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Expenses by Category / ការចំណាយតាមប្រភេទ</CardTitle></CardHeader>
          <CardContent><BarChart data={expenseByCat} dataKey="value" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>This Month Breakdown / ខែនេះ</CardTitle></CardHeader>
          <CardContent><PieChart data={monthlyByCat} donut /></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Expenses / ការចំណាយ
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={paged} rowKey={(r) => r.id} />
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} · Showing {paged.length} of {filtered.length}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'} / {editing ? 'កែសម្រួល' : 'បន្ថែមការចំណាយ'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Title / ចំណងជើង *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount / ចំនួន *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date / កាលបរិច្ឆេទ</Label>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
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
              <Label>Payment Method / វិធីបង់</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(PAYMENT_METHODS).map((m) => <SelectItem key={m} value={m}>{PAYMENT_METHODS[m].en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payee / អ្នកទទួល</Label>
              <Input value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Receipt No / លេខវិក្កយបត្រ</Label>
              <Input value={form.receipt_no} onChange={(e) => setForm({ ...form, receipt_no: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Approval Status / ស្ថានភាព</Label>
              <Select value={form.approval_status} onValueChange={(v) => setForm({ ...form, approval_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(APPROVAL_STATUS).map((s) => <SelectItem key={s} value={s}>{APPROVAL_STATUS[s].en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Invoice URL / វិក្កយបត្រ URL</Label>
              <div className="flex gap-2">
                <Input placeholder="https://..." onChange={() => setForm({ ...form, notes: form.notes })} />
                <Button variant="outline" size="icon"><Upload className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes / កំណត់ហេតុ</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {form.amount && form.category && (
              <div className="col-span-2">
                {(() => {
                  const check = checkBudget(form.category, parseFloat(form.amount) || 0);
                  return (
                    <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${check.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {check.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {check.message}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => !o && setViewOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Expense Details / ព័ត៌មានការចំណាយ</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Title:</span><span className="font-medium">{viewing.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="text-lg font-bold text-destructive">{formatCurrency(Number(viewing.amount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>{formatDate(viewing.expense_date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span>{EXPENSE_CATEGORIES[viewing.category]?.en ?? viewing.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payee:</span><span>{viewing.payee ?? '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method:</span><span>{PAYMENT_METHODS[viewing.payment_method]?.en ?? viewing.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt:</span><span className="font-mono text-xs">{viewing.receipt_no ?? '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge variant="secondary">{APPROVAL_STATUS[viewing.approval_status]?.en ?? viewing.approval_status}</Badge></div>
              {viewing.notes && <div className="border-t border-border pt-2"><span className="text-muted-foreground">Notes: </span>{viewing.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
