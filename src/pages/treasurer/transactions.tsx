import { useState, useMemo } from 'react';
import {
  History, Search, Download, ArrowDownCircle, ArrowUpCircle, Filter,
  ChevronLeft, ChevronRight, Calendar, List, GitBranch,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDonations, useExpenses } from '@/hooks/use-list';
import {
  DONATION_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, APPROVAL_STATUS,
  formatCurrency, formatDate, formatDateTime, exportToCSV,
} from '@/lib/types';
import { toast } from 'sonner';

interface Txn {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  method: string;
  status: string;
}

const PAGE_SIZE = 10;

export function TreasurerTransactionsPage() {
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'table' | 'timeline'>('table');

  const transactions: Txn[] = useMemo(() => {
    return [
      ...donations.map((d) => ({
        id: `d-${d.id}`, date: d.donation_date, description: `Donation from ${d.donor_name}`,
        type: 'income' as const, amount: Number(d.amount), category: d.category,
        method: d.payment_method, status: d.approval_status,
      })),
      ...expenses.map((e) => ({
        id: `e-${e.id}`, date: e.expense_date, description: e.title,
        type: 'expense' as const, amount: Number(e.amount), category: e.category,
        method: e.payment_method, status: e.approval_status,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
  }, [donations, expenses]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (methodFilter !== 'all' && t.method !== methodFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (maxAmount && t.amount > parseFloat(maxAmount)) return false;
      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter, methodFilter, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleExport = () => {
    exportToCSV('kot17_transactions', filtered.map((t) => ({
      Date: t.date, Description: t.description, Type: t.type, Amount: t.amount,
      Category: (t.type === 'income' ? DONATION_CATEGORIES : EXPENSE_CATEGORIES)[t.category]?.en ?? t.category,
      Method: PAYMENT_METHODS[t.method]?.en ?? t.method, Status: t.status,
    })));
    toast.success('Exported to CSV');
  };

  const clearFilters = () => {
    setSearch(''); setTypeFilter('all'); setCategoryFilter('all');
    setMethodFilter('all'); setStatusFilter('all');
    setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount('');
    setPage(1);
  };

  const columns: Column<Txn>[] = [
    { key: 'date', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.date)}</span> },
    { key: 'description', header: 'Description', headerKh: 'ការពិពណ៌នា', cell: (r) => (
      <div className="flex items-center gap-2">
        {r.type === 'income' ? <ArrowDownCircle className="h-4 w-4 text-success" /> : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
        <span className="font-medium">{r.description}</span>
      </div>
    ) },
    { key: 'type', header: 'Type', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant={r.type === 'income' ? 'default' : 'destructive'} className="text-xs">{r.type}</Badge> },
    { key: 'category', header: 'Category', headerKh: 'ប្រភេទ', cell: (r) => <span className="text-sm">{(r.type === 'income' ? DONATION_CATEGORIES : EXPENSE_CATEGORIES)[r.category]?.en ?? r.category}</span> },
    { key: 'method', header: 'Method', headerKh: 'វិធី', cell: (r) => <span className="text-sm text-muted-foreground">{PAYMENT_METHODS[r.method]?.en ?? r.method}</span> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => {
      const s = APPROVAL_STATUS[r.status] ?? APPROVAL_STATUS.approved;
      return <Badge variant={s.color === 'success' ? 'default' : s.color === 'destructive' ? 'destructive' : 'secondary'} className="text-xs">{s.en}</Badge>;
    } },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => (
      <span className={r.type === 'income' ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
        {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
      </span>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Transactions</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Transaction History"
        titleKh="ប្រវត្តិប្រតិបត្តិការ"
        subtitle="All income and expense transactions with advanced filters"
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setView('table')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={view === 'timeline' ? 'default' : 'ghost'} size="sm" onClick={() => setView('timeline')}>
                <GitBranch className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Income / ប្រាក់ចូល</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Expense / ប្រាក់ចេញ</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Net Balance / សមតុល្យ</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(totalIncome - totalExpense)}</p>
        </CardContent></Card>
      </div>

      {/* Advanced Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            Advanced Filters / តម្រងកម្រិតខ្ពស់
            <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>Clear All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys({ ...DONATION_CATEGORIES, ...EXPENSE_CATEGORIES }).map((c) => <SelectItem key={c} value={c}>{DONATION_CATEGORIES[c]?.en ?? EXPENSE_CATEGORIES[c]?.en ?? c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {Object.keys(PAYMENT_METHODS).map((m) => <SelectItem key={m} value={m}>{PAYMENT_METHODS[m].en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(APPROVAL_STATUS).map((s) => <SelectItem key={s} value={s}>{APPROVAL_STATUS[s].en}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" placeholder="From" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" placeholder="To" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <Input type="number" placeholder="Min Amount" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(1); }} />
            <Input type="number" placeholder="Max Amount" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }} />
          </div>
        </CardContent>
      </Card>

      {/* Table View */}
      {view === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Transactions / ប្រតិបត្តិការ
              <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={paged} rowKey={(r) => r.id} />
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Timeline / បន្ទាត់ពេលវេលា
              <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4 pl-6">
              <div className="absolute left-2 top-0 h-full w-0.5 bg-border" />
              {paged.map((t) => (
                <div key={t.id} className="relative">
                  <div className={`absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-background ${t.type === 'income' ? 'bg-success' : 'bg-destructive'}`} />
                  <div className="rounded-lg border border-border p-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.type === 'income' ? <ArrowDownCircle className="h-4 w-4 text-success" /> : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
                        <span className="font-medium">{t.description}</span>
                      </div>
                      <span className={`font-semibold ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDateTime(t.date)}</span>
                      <Badge variant="outline" className="text-xs">{(t.type === 'income' ? DONATION_CATEGORIES : EXPENSE_CATEGORIES)[t.category]?.en ?? t.category}</Badge>
                      <span>{PAYMENT_METHODS[t.method]?.en ?? t.method}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
