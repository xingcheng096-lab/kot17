import { useState, useMemo } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, MessageSquare, Download,
  Search, History, FileText, HandCoins, Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useApprovals } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import {
  APPROVAL_STATUS, EXPENSE_CATEGORIES, formatCurrency, formatDate, formatDateTime,
  exportToCSV, type Approval,
} from '@/lib/types';
import { toast } from 'sonner';

const REQUEST_TYPE_ICONS: Record<string, typeof FileText> = {
  expense: FileText, donation: HandCoins, receipt: Receipt,
};

export function TreasurerApprovalsPage() {
  const { data: approvals, setData } = useApprovals();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [reviewing, setReviewing] = useState<Approval | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return approvals.filter((a) => {
      if (tab === 'pending' && a.status !== 'pending') return false;
      if (tab === 'approved' && a.status !== 'approved') return false;
      if (tab === 'rejected' && a.status !== 'rejected') return false;
      if (tab === 'history' && a.status === 'pending') return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !(a.requested_by ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [approvals, tab, search]);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;
  const totalAmount = approvals.filter((a) => a.status === 'pending').reduce((s, a) => s + Number(a.amount), 0);

  const openReview = (a: Approval) => {
    setReviewing(a);
    setComment(a.reviewer_comment ?? '');
  };

  const handleApprove = async (a: Approval, decision: 'approved' | 'rejected') => {
    setSubmitting(true);
    const { data, error } = await supabase.from('approvals').update({
      status: decision,
      reviewer_comment: comment || null,
      reviewed_by: profile?.full_name ?? 'Treasurer',
      reviewed_at: new Date().toISOString(),
    }).eq('id', a.id).select().single();
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    setData((prev) => prev.map((x) => (x.id === a.id ? (data as Approval) : x)));
    await logActivity(decision === 'approved' ? 'approve_request' : 'reject_request', 'approvals', `${decision}: ${a.title}`, profile?.full_name);
    toast.success(`Request ${decision}`);
    setSubmitting(false);
    setReviewing(null);
    setComment('');
  };

  const handleExport = () => {
    exportToCSV('kot17_approvals', filtered.map((a) => ({
      Type: a.request_type, Title: a.title, Amount: a.amount,
      Category: EXPENSE_CATEGORIES[a.category ?? '']?.en ?? a.category ?? '',
      RequestedBy: a.requested_by ?? '', Status: a.status,
      Comment: a.reviewer_comment ?? '', ReviewedBy: a.reviewed_by ?? '',
      ReviewedAt: a.reviewed_at ?? '', CreatedAt: a.created_at,
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Approval>[] = [
    { key: 'type', header: 'Type', headerKh: 'ប្រភេទ', cell: (r) => {
      const Icon = REQUEST_TYPE_ICONS[r.request_type] ?? FileText;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm capitalize">{r.request_type}</span>
        </div>
      );
    } },
    { key: 'title', header: 'Title', headerKh: 'ចំណងជើង', cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'amount', header: 'Amount', headerKh: 'ចំនួន', align: 'right', cell: (r) => <span className="font-semibold text-primary">{formatCurrency(Number(r.amount))}</span> },
    { key: 'category', header: 'Category', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant="outline" className="text-xs">{EXPENSE_CATEGORIES[r.category ?? '']?.en ?? r.category ?? '-'}</Badge> },
    { key: 'requested_by', header: 'Requested By', headerKh: 'ស្នើដោយ', cell: (r) => <span className="text-sm">{r.requested_by ?? '-'}</span> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => {
      const s = APPROVAL_STATUS[r.status] ?? APPROVAL_STATUS.pending;
      const icon = s.color === 'success' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : s.color === 'destructive' ? <XCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />;
      return <Badge variant={s.color === 'success' ? 'default' : s.color === 'destructive' ? 'destructive' : 'secondary'} className="text-xs">{icon}{s.en}</Badge>;
    } },
    { key: 'created', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span> },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <Button variant="outline" size="sm" onClick={() => openReview(r)} disabled={r.status !== 'pending'}>
        {r.status === 'pending' ? <><MessageSquare className="mr-1 h-3.5 w-3.5" />Review</> : <><History className="mr-1 h-3.5 w-3.5" />View</>}
      </Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Approvals</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Approval Center"
        titleKh="មជ្ឈមណ្ឌលអនុម័ត"
        subtitle="Review and approve expense, donation, and receipt requests"
        actions={<Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" titleKh="រង់ចាំ" value={pendingCount} icon={Clock} accent="warning" />
        <StatCard title="Approved" titleKh="អនុម័ត" value={approvedCount} icon={CheckCircle2} accent="success" />
        <StatCard title="Rejected" titleKh="បដិសេធ" value={rejectedCount} icon={XCircle} accent="destructive" />
        <StatCard title="Pending Amount" titleKh="ចំនួនរង់ចាំ" value={formatCurrency(totalAmount)} icon={ClipboardCheck} accent="primary" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search title or requester..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {tab === 'pending' ? 'Pending Approvals' : tab === 'approved' ? 'Approved Requests' : tab === 'rejected' ? 'Rejected Requests' : 'Approval History'}
                <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Request / ពិនិត្យសំណើ</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{reviewing.request_type}</Badge>
                  {reviewing.category && <Badge variant="outline" className="text-xs">{EXPENSE_CATEGORIES[reviewing.category]?.en ?? reviewing.category}</Badge>}
                </div>
                <h3 className="mt-2 text-lg font-bold">{reviewing.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Requested by: {reviewing.requested_by ?? '-'}</p>
                <p className="mt-1 text-sm text-muted-foreground">Date: {formatDateTime(reviewing.created_at)}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(Number(reviewing.amount))}</span>
                </div>
              </div>
              {reviewing.status === 'pending' ? (
                <>
                  <div className="space-y-2">
                    <Label>Comment / មតិ</Label>
                    <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment for this decision..." />
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={() => handleApprove(reviewing, 'rejected')} disabled={submitting}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleApprove(reviewing, 'approved')} disabled={submitting}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={reviewing.status === 'approved' ? 'default' : 'destructive'}>
                      {APPROVAL_STATUS[reviewing.status]?.en ?? reviewing.status}
                    </Badge>
                  </div>
                  {reviewing.reviewer_comment && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Comment:</p>
                      <p className="mt-1 text-sm">{reviewing.reviewer_comment}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Reviewed by: {reviewing.reviewed_by ?? '-'} on {reviewing.reviewed_at ? formatDate(reviewing.reviewed_at) : '-'}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
