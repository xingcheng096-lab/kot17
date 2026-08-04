import { useState } from 'react';
import { ReceiptText, Search, Download, Eye, Printer } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDonations, useExpenses } from '@/hooks/use-list';
import { DONATION_CATEGORIES, EXPENSE_CATEGORIES, formatCurrency, formatDate, exportToCSV, printArea } from '@/lib/types';
import { toast } from 'sonner';

interface Receipt {
  id: string;
  receipt_no: string;
  type: 'donation' | 'expense';
  party: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
}

export function TreasurerReceiptsPage() {
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Receipt | null>(null);

  const receipts: Receipt[] = [
    ...donations.map((d) => ({
      id: `d-${d.id}`,
      receipt_no: d.receipt_no ?? `R-${d.id.slice(0, 8)}`,
      type: 'donation' as const,
      party: d.donor_name,
      amount: Number(d.amount),
      date: d.donation_date,
      category: d.category,
      notes: d.notes,
    })),
    ...expenses.map((e) => ({
      id: `e-${e.id}`,
      receipt_no: e.receipt_no ?? `E-${e.id.slice(0, 8)}`,
      type: 'expense' as const,
      party: e.payee ?? e.title,
      amount: Number(e.amount),
      date: e.expense_date,
      category: e.category,
      notes: e.notes,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = receipts.filter(
    (r) => !search || r.receipt_no.toLowerCase().includes(search.toLowerCase()) || r.party.toLowerCase().includes(search.toLowerCase()),
  );

  const handleExport = () => {
    exportToCSV('kot17_receipts', filtered.map((r) => ({
      ReceiptNo: r.receipt_no,
      Type: r.type,
      Party: r.party,
      Amount: r.amount,
      Date: r.date,
      Category: (r.type === 'donation' ? DONATION_CATEGORIES : EXPENSE_CATEGORIES)[r.category]?.en ?? r.category,
    })));
    toast.success('Receipts exported');
  };

  const columns: Column<Receipt>[] = [
    {
      key: 'receipt_no',
      header: 'Receipt No',
      headerKh: 'លេខវិក្កយបត្រ',
      cell: (r) => <span className="font-mono text-xs font-medium">{r.receipt_no}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      headerKh: 'ប្រភេទ',
      cell: (r) => <Badge variant={r.type === 'donation' ? 'default' : 'destructive'} className="text-xs">{r.type}</Badge>,
    },
    {
      key: 'party',
      header: 'Party',
      headerKh: 'ភាគី',
      cell: (r) => <span className="font-medium">{r.party}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      headerKh: 'ចំនួន',
      align: 'right',
      cell: (r) => <span className={r.type === 'donation' ? 'font-semibold text-success' : 'font-semibold text-destructive'}>{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      headerKh: 'កាលបរិច្ឆេទ',
      cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.date)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <Button variant="ghost" size="icon" onClick={() => setViewing(r)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipt Management"
        titleKh="ការគ្រប់គ្រងវិក្កយបត្រ"
        subtitle="View and manage all receipts"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search receipt no or party..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Receipts / វិក្កយបត្រ
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} receipts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt / វិក្កយបត្រ</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                <p className="font-khmer text-lg font-bold">កុដិលេខ ១៧</p>
                <p className="text-xs text-muted-foreground">Wat Botumvatey Rajavararam</p>
                <p className="mt-4 font-mono text-sm font-semibold">{viewing.receipt_no}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><Badge variant={viewing.type === 'donation' ? 'default' : 'destructive'}>{viewing.type}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Party:</span><span className="font-medium">{viewing.party}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>{formatDate(viewing.date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span>{(viewing.type === 'donation' ? DONATION_CATEGORIES : EXPENSE_CATEGORIES)[viewing.category]?.en ?? viewing.category}</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Amount:</span><span className="text-lg font-bold text-primary">{formatCurrency(viewing.amount)}</span></div>
                {viewing.notes && <div className="border-t border-border pt-2"><span className="text-muted-foreground">Notes: </span>{viewing.notes}</div>}
              </div>
              <Button onClick={printArea} variant="outline" className="w-full"><Printer className="mr-2 h-4 w-4" />Print Receipt</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
