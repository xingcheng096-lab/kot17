import { useState, useMemo } from 'react';
import {
  Plus, Search, Download, Pencil, Trash2, HandCoins, Printer, Eye,
  ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
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
import { useDonations } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import {
  DONATION_CATEGORIES, PAYMENT_METHODS, APPROVAL_STATUS,
  formatCurrency, formatDate, exportToCSV, printArea,
  type Donation,
} from '@/lib/types';
import { toast } from 'sonner';

const emptyForm = {
  donor_name: '',
  amount: '',
  donation_date: new Date().toISOString().slice(0, 10),
  category: 'general',
  payment_method: 'cash',
  receipt_no: '',
  notes: '',
};

const PAGE_SIZE = 10;

export function TreasurerDonationsPage() {
  const { data: donations, setData } = useDonations();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Donation | null>(null);
  const [editing, setEditing] = useState<Donation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      if (search && !d.donor_name.toLowerCase().includes(search.toLowerCase()) && !(d.receipt_no ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (methodFilter !== 'all' && d.payment_method !== methodFilter) return false;
      if (statusFilter !== 'all' && d.approval_status !== statusFilter) return false;
      return true;
    });
  }, [donations, search, categoryFilter, methodFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, receipt_no: `R-${new Date().getFullYear()}-${String(donations.length + 1).padStart(3, '0')}` });
    setDialogOpen(true);
  };

  const openEdit = (d: Donation) => {
    setEditing(d);
    setForm({
      donor_name: d.donor_name, amount: String(d.amount), donation_date: d.donation_date,
      category: d.category, payment_method: d.payment_method,
      receipt_no: d.receipt_no ?? '', notes: d.notes ?? '',
    });
    setDialogOpen(true);
  };

  const openView = (d: Donation) => {
    setViewing(d);
    setViewOpen(true);
  };

  const handleSave = async () => {
    if (!form.donor_name || !form.amount) { toast.error('Donor name and amount are required'); return; }
    setSubmitting(true);
    const payload = {
      donor_name: form.donor_name, amount: parseFloat(form.amount), donation_date: form.donation_date,
      category: form.category, payment_method: form.payment_method,
      receipt_no: form.receipt_no || null, notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('donations').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((d) => (d.id === editing.id ? (data as Donation) : d)));
      await logActivity('update_donation', 'donations', `Updated ${form.donor_name}`, profile?.full_name);
      toast.success('Donation updated');
    } else {
      const { data, error } = await supabase.from('donations').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as Donation, ...prev]);
      await logActivity('create_donation', 'donations', `Added ${form.donor_name}`, profile?.full_name);
      toast.success('Donation added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (d: Donation) => {
    if (!confirm(`Delete donation from ${d.donor_name}?`)) return;
    const { error } = await supabase.from('donations').delete().eq('id', d.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== d.id));
    await logActivity('delete_donation', 'donations', `Deleted ${d.donor_name}`, profile?.full_name);
    toast.success('Donation deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_donations', filtered.map((d) => ({
      Donor: d.donor_name, Amount: d.amount, Date: d.donation_date,
      Category: DONATION_CATEGORIES[d.category]?.en ?? d.category,
      Method: PAYMENT_METHODS[d.payment_method]?.en ?? d.payment_method,
      Receipt: d.receipt_no ?? '', Status: d.approval_status, Notes: d.notes ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const printReceipt = (d: Donation) => {
    const html = `
      <html><head><title>Receipt ${d.receipt_no ?? ''}</title>
      <style>
        body { font-family: 'Noto Sans Khmer', Inter, sans-serif; max-width: 400px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0F766E; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 20px; color: #0F766E; margin: 0; }
        .header p { font-size: 12px; color: #666; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .row.total { font-weight: bold; font-size: 18px; color: #0F766E; border-bottom: none; margin-top: 12px; }
        .receipt-no { text-align: center; font-family: monospace; font-size: 16px; margin: 16px 0; }
      </style></head><body>
      <div class="header">
        <h1>កុដិលេខ ១៧</h1>
        <p>Wat Botumvatey Rajavararam</p>
        <p>KOT 17 Smart Administrative System</p>
      </div>
      <div class="receipt-no">Receipt No: ${d.receipt_no ?? '-'}</div>
      <div class="row"><span>Donor:</span><span>${d.donor_name}</span></div>
      <div class="row"><span>Date:</span><span>${formatDate(d.donation_date)}</span></div>
      <div class="row"><span>Category:</span><span>${DONATION_CATEGORIES[d.category]?.en ?? d.category}</span></div>
      <div class="row"><span>Method:</span><span>${PAYMENT_METHODS[d.payment_method]?.en ?? d.payment_method}</span></div>
      ${d.notes ? `<div class="row"><span>Notes:</span><span>${d.notes}</span></div>` : ''}
      <div class="row total"><span>Amount:</span><span>${formatCurrency(Number(d.amount))}</span></div>
      <p style="text-align:center;margin-top:32px;font-size:12px;color:#999;">Thank you for your generosity</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const columns: Column<Donation>[] = [
    { key: 'receipt', header: 'Receipt', headerKh: 'វិក្កយបត្រ', cell: (r) => <span className="font-mono text-xs">{r.receipt_no ?? '-'}</span> },
    { key: 'donor', header: 'Donor', headerKh: 'អ្នកបរិច្ចាគ', cell: (r) => <span className="font-medium">{r.donor_name}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold text-success">{formatCurrency(Number(r.amount))}</span> },
    { key: 'category', header: 'Category', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant="outline" className="font-khmer text-xs">{DONATION_CATEGORIES[r.category]?.kh ?? r.category}</Badge> },
    { key: 'method', header: 'Method', headerKh: 'វិធីសាស្ត្រ', cell: (r) => <span className="text-sm">{PAYMENT_METHODS[r.payment_method]?.en ?? r.payment_method}</span> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => {
      const s = APPROVAL_STATUS[r.approval_status] ?? APPROVAL_STATUS.approved;
      return <Badge variant={s.color === 'success' ? 'default' : s.color === 'destructive' ? 'destructive' : 'secondary'} className="text-xs">{s.en}</Badge>;
    } },
    { key: 'date', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.donation_date)}</span> },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => printReceipt(r)}><Printer className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  const total = filtered.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Donations</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Donation Management"
        titleKh="ការគ្រប់គ្រងការបរិច្ចាគ"
        subtitle="Track and manage all donations"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Donation</Button>
          </>
        }
      />

      {/* Filter Panel */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search donor or receipt..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(DONATION_CATEGORIES).map((c) => <SelectItem key={c} value={c}>{DONATION_CATEGORIES[c].en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {Object.keys(PAYMENT_METHODS).map((m) => <SelectItem key={m} value={m}>{PAYMENT_METHODS[m].en}</SelectItem>)}
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
            Donations / ការបរិច្ចាគ
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={paged} rowKey={(r) => r.id} />
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} · Showing {paged.length} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Donation' : 'Add Donation'} / {editing ? 'កែសម្រួល' : 'បន្ថែមការបរិច្ចាគ'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Donor Name / ឈ្មោះអ្នកបរិច្ចាគ *</Label>
              <Input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount / ចំនួន *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date / កាលបរិច្ឆេទ</Label>
              <Input type="date" value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category / ប្រភេទ</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(DONATION_CATEGORIES).map((c) => <SelectItem key={c} value={c}>{DONATION_CATEGORIES[c].en}</SelectItem>)}
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
            <div className="col-span-2 space-y-2">
              <Label>Receipt No / លេខវិក្កយបត្រ</Label>
              <Input value={form.receipt_no} onChange={(e) => setForm({ ...form, receipt_no: e.target.value })} />
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

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => !o && setViewOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Donation Details / ព័ត៌មានការបរិច្ចាគ</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                <p className="font-khmer text-lg font-bold">កុដិលេខ ១៧</p>
                <p className="text-xs text-muted-foreground">Wat Botumvatey Rajavararam</p>
                <p className="mt-4 font-mono text-sm font-semibold">{viewing.receipt_no ?? '-'}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Donor:</span><span className="font-medium">{viewing.donor_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>{formatDate(viewing.donation_date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span>{DONATION_CATEGORIES[viewing.category]?.en ?? viewing.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Method:</span><span>{PAYMENT_METHODS[viewing.payment_method]?.en ?? viewing.payment_method}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge variant="secondary">{APPROVAL_STATUS[viewing.approval_status]?.en ?? viewing.approval_status}</Badge></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Amount:</span><span className="text-lg font-bold text-primary">{formatCurrency(Number(viewing.amount))}</span></div>
                {viewing.notes && <div className="border-t border-border pt-2"><span className="text-muted-foreground">Notes: </span>{viewing.notes}</div>}
              </div>
              <Button onClick={() => printReceipt(viewing)} variant="outline" className="w-full"><Printer className="mr-2 h-4 w-4" />Print Receipt</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
