import { useState, useMemo } from 'react';
import {
  Users, Search, Download, Eye, HandCoins, Wallet, Receipt, UserCircle,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useMembers, useDonations, useExpenses } from '@/hooks/use-list';
import {
  POSITION_LABELS, DONATION_CATEGORIES,
  formatCurrency, formatDate, exportToCSV,
  type Member, type Donation, type Expense,
} from '@/lib/types';
import { toast } from 'sonner';

interface MemberFinance {
  member: Member;
  totalDonated: number;
  totalOwed: number;
  donationCount: number;
  lastDonationDate: string | null;
  donations: Donation[];
  payments: Expense[];
}

const PAGE_SIZE = 10;

export function TreasurerMemberPaymentsPage() {
  const { data: members } = useMembers();
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<MemberFinance | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const memberFinances: MemberFinance[] = useMemo(() => {
    return members.map((m) => {
      const memberName = m.khmer_name;
      const memberDonations = donations.filter((d) =>
        d.donor_name.toLowerCase().includes(memberName.toLowerCase()),
      );
      const totalDonated = memberDonations.reduce((s, d) => s + Number(d.amount), 0);
      const memberPayments = expenses.filter((e) =>
        e.payee?.toLowerCase().includes(memberName.toLowerCase()),
      );
      const totalOwed = memberPayments.reduce((s, e) => s + Number(e.amount), 0);
      const lastDonationDate = memberDonations.length > 0
        ? memberDonations.sort((a, b) => b.donation_date.localeCompare(a.donation_date))[0].donation_date
        : null;
      return {
        member: m, totalDonated, totalOwed, donationCount: memberDonations.length,
        lastDonationDate, donations: memberDonations, payments: memberPayments,
      };
    });
  }, [members, donations, expenses]);

  const filtered = memberFinances.filter((mf) =>
    !search || mf.member.khmer_name.toLowerCase().includes(search.toLowerCase()) ||
    (mf.member.phone ?? '').includes(search),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalDonations = memberFinances.reduce((s, mf) => s + mf.totalDonated, 0);
  const totalPayments = memberFinances.reduce((s, mf) => s + mf.totalOwed, 0);
  const activeDonors = memberFinances.filter((mf) => mf.donationCount > 0).length;

  const openView = (mf: MemberFinance) => { setViewing(mf); setViewOpen(true); };

  const handleExport = () => {
    exportToCSV('kot17_member_payments', filtered.map((mf) => ({
      Name: mf.member.khmer_name, Position: POSITION_LABELS[mf.member.position]?.en ?? mf.member.position,
      Phone: mf.member.phone ?? '', Donations: mf.donationCount,
      TotalDonated: mf.totalDonated, TotalOwed: mf.totalOwed,
      LastDonation: mf.lastDonationDate ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<MemberFinance>[] = [
    { key: 'member', header: 'Member', headerKh: 'សមាជិក', cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {r.member.khmer_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{r.member.khmer_name}</p>
          <p className="text-xs text-muted-foreground">{POSITION_LABELS[r.member.position]?.en ?? r.member.position}</p>
        </div>
      </div>
    ) },
    { key: 'position', header: 'Position', headerKh: 'តួនាទី', cell: (r) => <Badge variant="outline" className="text-xs">{POSITION_LABELS[r.member.position]?.en ?? r.member.position}</Badge> },
    { key: 'phone', header: 'Phone', headerKh: 'ទូរស័ព្ទ', cell: (r) => <span className="text-sm">{r.member.phone ?? '-'}</span> },
    { key: 'donations', header: 'Donations', headerKh: 'ការបរិច្ចាគ', align: 'center', cell: (r) => <span className="font-medium">{r.donationCount}</span> },
    { key: 'totalDonated', header: 'Total Donated', headerKh: 'បរិច្ចាគសរុប', align: 'right', cell: (r) => <span className="font-semibold text-success">{formatCurrency(r.totalDonated)}</span> },
    { key: 'totalOwed', header: 'Outstanding', headerKh: 'ប្រាក់ជំពាក់', align: 'right', cell: (r) => <span className={r.totalOwed > 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}>{formatCurrency(r.totalOwed)}</span> },
    { key: 'lastDonation', header: 'Last Donation', headerKh: 'បរិច្ចាគចុងក្រោយ', cell: (r) => <span className="text-sm text-muted-foreground">{r.lastDonationDate ? formatDate(r.lastDonationDate) : '-'}</span> },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <Button variant="ghost" size="icon" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Member Payments</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Member Payment History"
        titleKh="ប្រវត្តិការបង់ប្រាក់សមាជិក"
        subtitle="Connect members with financial records and payment history"
        actions={<Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Members" titleKh="សមាជិកសរុប" value={members.length} icon={Users} accent="primary" />
        <StatCard title="Active Donors" titleKh="អ្នកបរិច្ចាគសកម្ម" value={activeDonors} icon={HandCoins} accent="success" />
        <StatCard title="Total Donations" titleKh="ការបរិច្ចាគសរុប" value={formatCurrency(totalDonations)} icon={TrendingUp} accent="success" />
        <StatCard title="Outstanding" titleKh="ប្រាក់ជំពាក់" value={formatCurrency(totalPayments)} icon={TrendingDown} accent="destructive" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search member name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Member Payments / ការបង់ប្រាក់សមាជិក
            <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={paged} rowKey={(r) => r.member.id} />
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

      {/* Member Finance Detail Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => !o && setViewOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Member Financial Profile / ប្រវត្តិហិរញ្ញវត្ថុ</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2">
              {/* Profile Card */}
              <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {viewing.member.khmer_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{viewing.member.khmer_name}</h3>
                  <p className="text-sm text-muted-foreground">{POSITION_LABELS[viewing.member.position]?.en ?? viewing.member.position}</p>
                  {viewing.member.phone && <p className="mt-1 text-xs text-muted-foreground">{viewing.member.phone}</p>}
                </div>
              </div>

              {/* Finance Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-success/10 p-3 text-center">
                  <HandCoins className="mx-auto mb-1 h-5 w-5 text-success" />
                  <p className="text-xs text-muted-foreground">Donations</p>
                  <p className="font-bold text-success">{formatCurrency(viewing.totalDonated)}</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3 text-center">
                  <Wallet className="mx-auto mb-1 h-5 w-5 text-destructive" />
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="font-bold text-destructive">{formatCurrency(viewing.totalOwed)}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <Receipt className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-xs text-muted-foreground">Records</p>
                  <p className="font-bold text-primary">{viewing.donationCount + viewing.payments.length}</p>
                </div>
              </div>

              {/* Financial Timeline */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <UserCircle className="h-4 w-4 text-primary" />
                  Financial Timeline / បន្ទាត់ពេលវេលាហិរញ្ញវត្ថុ
                </h4>
                <div className="relative space-y-2 pl-4">
                  <div className="absolute left-1.5 top-0 h-full w-0.5 bg-border" />
                  {[
                    ...viewing.donations.map((d) => ({ id: `d-${d.id}`, date: d.donation_date, type: 'donation' as const, desc: `Donation: ${DONATION_CATEGORIES[d.category]?.en ?? d.category}`, amount: Number(d.amount) })),
                    ...viewing.payments.map((p) => ({ id: `p-${p.id}`, date: p.expense_date, type: 'payment' as const, desc: `Payment: ${p.title}`, amount: Number(p.amount) })),
                  ].sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
                    <div key={item.id} className="relative">
                      <div className={`absolute -left-2.5 top-1.5 h-2.5 w-2.5 rounded-full ${item.type === 'donation' ? 'bg-success' : 'bg-destructive'}`} />
                      <div className="rounded-lg border border-border p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.desc}</span>
                          <span className={`text-sm font-semibold ${item.type === 'donation' ? 'text-success' : 'text-destructive'}`}>
                            {item.type === 'donation' ? '+' : '-'}{formatCurrency(item.amount)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                      </div>
                    </div>
                  ))}
                  {viewing.donations.length === 0 && viewing.payments.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No financial records</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
