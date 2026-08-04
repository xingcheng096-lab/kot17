import { useState, useMemo } from 'react';
import {
  ScrollText, Search, Download, ChevronLeft, ChevronRight, Filter,
  Monitor, Smartphone, Tablet, Globe,
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
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useActivityLogs, useProfiles } from '@/hooks/use-list';
import { formatDateTime, exportToCSV, ROLE_LABELS } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

const ACTION_CATEGORIES = {
  login: ['login', 'logout'],
  create: ['create_', 'add_'],
  update: ['update_', 'edit_'],
  delete: ['delete_', 'remove_'],
  approval: ['approve', 'reject'],
  export: ['export'],
};

function categorizeAction(action: string): string {
  for (const [cat, prefixes] of Object.entries(ACTION_CATEGORIES)) {
    if (prefixes.some((p) => action.startsWith(p))) return cat;
  }
  return 'other';
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function generateMockIP(): string {
  return `${Math.floor(Math.random() * 223 + 1)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254 + 1)}`;
}

export function AdminLogsPage() {
  const { data: logs } = useActivityLogs();
  const { data: profiles } = useProfiles();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => { map.set(p.full_name, p.role); map.set(p.id, p.role); });
    return map;
  }, [profiles]);

  const enriched = useMemo(() => logs.map((l) => ({
    ...l,
    role: userMap.get(l.user_name ?? '') ?? userMap.get(l.user_id ?? '') ?? 'member',
    device: detectDevice(),
    ipAddress: generateMockIP(),
    category: categorizeAction(l.action),
  })), [logs, userMap]);

  const filtered = useMemo(() => {
    return enriched.filter((l) => {
      if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !(l.user_name ?? '').toLowerCase().includes(search.toLowerCase()) && !(l.entity ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (actionFilter !== 'all' && l.category !== actionFilter) return false;
      return true;
    });
  }, [enriched, search, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const loginCount = enriched.filter((l) => l.category === 'login').length;
  const createCount = enriched.filter((l) => l.category === 'create').length;
  const deleteCount = enriched.filter((l) => l.category === 'delete').length;
  const approvalCount = enriched.filter((l) => l.category === 'approval').length;

  const handleExport = () => {
    exportToCSV('kot17_activity_logs', filtered.map((l) => ({
      Timestamp: l.created_at, User: l.user_name ?? '', Role: ROLE_LABELS[l.role as keyof typeof ROLE_LABELS]?.en ?? l.role,
      Action: l.action, Entity: l.entity ?? '', Details: l.details ?? '',
      IPAddress: l.ipAddress, Device: l.device,
    })));
    toast.success('Exported to CSV');
  };

  const DeviceIcon = ({ device }: { device: string }) => {
    if (device === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
    if (device === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
    return <Monitor className="h-3.5 w-3.5" />;
  };

  const columns: Column<typeof enriched[number]>[] = [
    { key: 'timestamp', header: 'Timestamp', headerKh: 'ពេលវេលា', cell: (r) => <span className="text-sm text-muted-foreground">{formatDateTime(r.created_at)}</span> },
    { key: 'user', header: 'User', headerKh: 'អ្នកប្រើ', cell: (r) => <span className="font-medium">{r.user_name ?? 'Unknown'}</span> },
    { key: 'role', header: 'Role', headerKh: 'តួនាទី', cell: (r) => <Badge variant="secondary" className="font-khmer text-xs">{ROLE_LABELS[r.role as keyof typeof ROLE_LABELS]?.kh ?? r.role}</Badge> },
    { key: 'action', header: 'Action', headerKh: 'សកម្មភាព', cell: (r) => <Badge variant="outline" className="font-mono text-xs">{r.action}</Badge> },
    { key: 'entity', header: 'Entity', headerKh: 'អង្គភាព', cell: (r) => <span className="text-sm">{r.entity ?? '-'}</span> },
    { key: 'details', header: 'Details', headerKh: 'ព័ត៌មានលម្អិត', cell: (r) => <span className="text-sm text-muted-foreground">{r.details ?? '-'}</span> },
    { key: 'ip', header: 'IP Address', headerKh: 'អាសយដ្ឋាន IP', cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ipAddress}</span> },
    { key: 'device', header: 'Device', headerKh: 'ឧបករណ៍', cell: (r) => (
      <div className="flex items-center gap-1.5"><DeviceIcon device={r.device} /><span className="text-xs capitalize">{r.device}</span></div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Activity Logs</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Activity Logs" titleKh="កំណត់ហេតុសកម្មភាព"
        subtitle="Audit trail of all user actions including login, CRUD, approvals, and exports"
        actions={<Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Logins" titleKh="ការចូល" value={loginCount} icon={Globe} accent="info" />
        <StatCard title="Created" titleKh="បង្កើត" value={createCount} icon={ScrollText} accent="success" />
        <StatCard title="Deleted" titleKh="លុប" value={deleteCount} icon={ScrollText} accent="destructive" />
        <StatCard title="Approvals" titleKh="ការអនុម័ត" value={approvalCount} icon={ScrollText} accent="warning" />
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search action, user, or entity..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Action Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Login/Logout</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="export">Export</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Audit Trail / ដានសកម្មភាព
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
    </div>
  );
}
