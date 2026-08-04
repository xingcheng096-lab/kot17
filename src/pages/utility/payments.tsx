import { useState } from 'react';
import { History, Search, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUtilityCollections, useUtilityBills } from '@/hooks/use-list';
import { formatCurrency, formatMonthLabel, formatDate, exportToCSV } from '@/lib/types';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  type: 'collection' | 'bill';
  party: string;
  month: string;
  amount: number;
  paidDate: string | null;
  status: 'paid' | 'unpaid';
}

export function UtilityPaymentsPage() {
  const { data: collections } = useUtilityCollections();
  const { data: bills } = useUtilityBills();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const records: PaymentRecord[] = [
    ...collections.map((c) => ({
      id: `c-${c.id}`,
      type: 'collection' as const,
      party: c.member_name,
      month: c.month,
      amount: Number(c.amount),
      paidDate: c.paid_date,
      status: c.paid ? 'paid' as const : 'unpaid' as const,
    })),
    ...bills.map((b) => ({
      id: `b-${b.id}`,
      type: 'bill' as const,
      party: b.provider ?? b.utility_type,
      month: b.bill_month,
      amount: Number(b.amount),
      paidDate: b.paid_date,
      status: b.paid ? 'paid' as const : 'unpaid' as const,
    })),
  ].sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''));

  const filtered = records.filter((r) => {
    if (search && !r.party.toLowerCase().includes(search.toLowerCase()) && !r.month.includes(search)) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    return true;
  });

  const totalPaid = filtered.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const totalUnpaid = filtered.filter((r) => r.status === 'unpaid').reduce((s, r) => s + r.amount, 0);

  const handleExport = () => {
    exportToCSV('kot17_utility_payments', filtered.map((r) => ({
      Type: r.type, Party: r.party, Month: r.month, Amount: r.amount,
      PaidDate: r.paidDate ?? '', Status: r.status,
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<PaymentRecord>[] = [
    { key: 'type', header: 'Type', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant={r.type === 'collection' ? 'default' : 'secondary'} className="text-xs">{r.type}</Badge> },
    { key: 'party', header: 'Party', headerKh: 'ភាគី', cell: (r) => <span className="font-medium">{r.party}</span> },
    { key: 'month', header: 'Month', headerKh: 'ខែ', cell: (r) => <span className="text-sm">{formatMonthLabel(r.month)}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: 'paidDate', header: 'Paid Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{r.paidDate ? formatDate(r.paidDate) : '-'}</span> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => <Badge variant={r.status === 'paid' ? 'default' : 'secondary'} className="text-xs">{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment History"
        titleKh="ប្រវត្តិការបង់ប្រាក់"
        subtitle="All utility payment records"
        actions={<Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Paid / បានបង់</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Unpaid / មិនទាន់បង់</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(totalUnpaid)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search party or month..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="collection">Collections</option>
            <option value="bill">Bills</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Payment History / ប្រវត្តិការបង់
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent><DataTable columns={columns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
