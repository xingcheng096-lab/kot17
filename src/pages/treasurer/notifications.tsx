import { useState, useMemo } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, Info, XCircle, Check, Trash2,
  Download, Search, BellOff, Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNotifications } from '@/hooks/use-list';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/hooks/use-auth';
import { formatDateTime, exportToCSV, type Notification } from '@/lib/types';
import { toast } from 'sonner';

const SEVERITY_ICONS: Record<string, typeof Bell> = {
  info: Info, warning: AlertTriangle, success: CheckCircle2, error: XCircle,
};

const TYPE_LABELS: Record<string, { en: string; kh: string }> = {
  budget: { en: 'Budget', kh: 'ថវិកា' },
  donation: { en: 'Donation', kh: 'ការបរិច្ចាគ' },
  approval: { en: 'Approval', kh: 'ការអនុម័ត' },
  receipt: { en: 'Receipt', kh: 'វិក្កយបត្រ' },
  system: { en: 'System', kh: 'ប្រព័ន្ធ' },
};

export function TreasurerNotificationsPage() {
  const { data: notifications, setData } = useNotifications();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (tab === 'unread' && n.read) return false;
      if (tab === 'read' && !n.read) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !(n.body ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [notifications, tab, typeFilter, search]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const budgetCount = notifications.filter((n) => n.type === 'budget').length;
  const approvalCount = notifications.filter((n) => n.type === 'approval').length;
  const donationCount = notifications.filter((n) => n.type === 'donation').length;

  const handleMarkRead = async (n: Notification) => {
    if (n.read) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.map((x) => ({ ...x, read: true })));
    await logActivity('mark_all_read', 'notifications', 'Marked all as read', profile?.full_name);
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (n: Notification) => {
    if (!confirm('Delete this notification?')) return;
    const { error } = await supabase.from('notifications').delete().eq('id', n.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== n.id));
    toast.success('Notification deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_notifications', filtered.map((n) => ({
      Type: n.type, Title: n.title, Body: n.body ?? '',
      Severity: n.severity, Read: n.read ? 'Yes' : 'No', Date: n.created_at,
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Notification>[] = [
    { key: 'severity', header: '', cell: (r) => {
      const Icon = SEVERITY_ICONS[r.severity] ?? Bell;
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          r.severity === 'error' ? 'bg-destructive/10 text-destructive' :
          r.severity === 'warning' ? 'bg-warning/10 text-warning' :
          r.severity === 'success' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
      );
    } },
    { key: 'type', header: 'Type', headerKh: 'ប្រភេទ', cell: (r) => <Badge variant="outline" className="text-xs">{TYPE_LABELS[r.type]?.en ?? r.type}</Badge> },
    { key: 'title', header: 'Title', headerKh: 'ចំណងជើង', cell: (r) => (
      <div>
        <p className={r.read ? 'font-medium' : 'font-bold'}>{r.title}</p>
        {r.body && <p className="text-xs text-muted-foreground">{r.body}</p>}
      </div>
    ) },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => (
      <Badge variant={r.read ? 'secondary' : 'default'} className="text-xs">
        {r.read ? <><Check className="mr-1 h-3 w-3" />Read</> : <><Bell className="mr-1 h-3 w-3" />Unread</>}
      </Badge>
    ) },
    { key: 'date', header: 'Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDateTime(r.created_at)}</span> },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1">
        {!r.read && <Button variant="ghost" size="icon" onClick={() => handleMarkRead(r)} title="Mark as read"><Check className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Notifications</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Notifications"
        titleKh="ការជូនដំណឹង"
        subtitle="Financial alerts, budget warnings, and system notifications"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              <Check className="mr-2 h-4 w-4" />Mark All Read
            </Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Unread" titleKh="មិនទាន់អាន" value={unreadCount} icon={Bell} accent="warning" />
        <StatCard title="Budget Alerts" titleKh="ការព្រមានថវិកា" value={budgetCount} icon={AlertTriangle} accent="destructive" />
        <StatCard title="Approval Alerts" titleKh="ការអនុម័ត" value={approvalCount} icon={Info} accent="info" />
        <StatCard title="Donation Alerts" titleKh="ការបរិច្ចាគ" value={donationCount} icon={CheckCircle2} accent="success" />
      </div>

      {/* Tabs + Filter */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
            </div>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.keys(TYPE_LABELS).map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t].en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications / ការជូនដំណឹង
                <span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <BellOff className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
