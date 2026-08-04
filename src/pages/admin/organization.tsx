import { useState } from 'react';
import {
  Network, Search, ZoomIn, ZoomOut, Maximize2, Printer, Download,
  ChevronDown, ChevronRight, Users, Crown, UserRound, GraduationCap,
  ShieldCheck, Wallet, BookOpen, UtensilsCrossed, Zap, ScrollText,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useMembers } from '@/hooks/use-list';
import { POSITION_LABELS, formatDate, exportToCSV, type Member, type MemberPosition } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrgNode {
  id: string;
  title: string;
  titleKh: string;
  icon: typeof Crown;
  positions: MemberPosition[];
  color: string;
  children?: OrgNode[];
}

const ORG_TREE: OrgNode = {
  id: 'root',
  title: 'Temple Administrator',
  titleKh: 'អ្នកគ្រប់គ្រងវត្ត',
  icon: Crown,
  positions: ['me_kuti'],
  color: 'primary',
  children: [
    {
      id: 'treasurer',
      title: 'Treasurer',
      titleKh: 'ហេរញ្ញិក',
      icon: Wallet,
      positions: ['treasurer'],
      color: 'success',
      children: [
        { id: 'utility', title: 'Utility Officer', titleKh: 'មន្ត្រីទឹក និងអគ្គិសនី', icon: Zap, positions: ['utility_officer'], color: 'info' },
        { id: 'food', title: 'Food Officer', titleKh: 'មន្ត្រីស្បៀងអាហារ', icon: UtensilsCrossed, positions: ['food_officer'], color: 'secondary' },
      ],
    },
    {
      id: 'secretary',
      title: 'Secretary',
      titleKh: 'លេខាធិការ',
      icon: ScrollText,
      positions: [],
      color: 'info',
    },
    {
      id: 'discipline',
      title: 'Discipline Officer',
      titleKh: 'មន្ត្រីសីល',
      icon: ShieldCheck,
      positions: [],
      color: 'warning',
    },
    {
      id: 'education',
      title: 'Education Officer',
      titleKh: 'មន្ត្រីអប់រំ',
      icon: BookOpen,
      positions: [],
      color: 'secondary',
    },
    {
      id: 'monks',
      title: 'Monks',
      titleKh: 'ព្រះសង្ឃ',
      icon: UserRound,
      positions: ['preah_ther', 'bhikkhu', 'samanera'],
      color: 'primary',
      children: [
        { id: 'preah_ther', title: 'ព្រះថេរ', titleKh: 'Preah Ther', icon: UserRound, positions: ['preah_ther'], color: 'primary' },
        { id: 'bhikkhu', title: 'ភិក្ខុ', titleKh: 'Bhikkhu', icon: UserRound, positions: ['bhikkhu'], color: 'primary' },
        { id: 'samanera', title: 'សមណេរ', titleKh: 'Samanera', icon: UserRound, positions: ['samanera'], color: 'primary' },
      ],
    },
    {
      id: 'students',
      title: 'Students',
      titleKh: 'សិស្ស',
      icon: GraduationCap,
      positions: ['ramachang', 'old_student', 'new_student'],
      color: 'info',
      children: [
        { id: 'ramachang', title: 'រាមច្បង', titleKh: 'Ramachang', icon: GraduationCap, positions: ['ramachang'], color: 'info' },
        { id: 'old_student', title: 'រាមកណ្ដាល', titleKh: 'Old Student', icon: GraduationCap, positions: ['old_student'], color: 'info' },
        { id: 'new_student', title: 'រាមតូច', titleKh: 'New Student', icon: GraduationCap, positions: ['new_student'], color: 'info' },
      ],
    },
  ],
};

function countMembers(node: OrgNode, members: Member[]): number {
  return node.positions.reduce((sum, pos) => sum + members.filter((m) => m.position === pos).length, 0);
}

function OrgNodeCard({
  node,
  members,
  search,
  collapsed,
  onToggle,
  level,
}: {
  node: OrgNode;
  members: Member[];
  search: string;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  level: number;
}) {
  const Icon = node.icon;
  const nodeMembers = node.positions.flatMap((pos) => members.filter((m) => m.position === pos));
  const count = countMembers(node, members);
  const isCollapsed = collapsed.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const filteredMembers = search
    ? nodeMembers.filter((m) => m.khmer_name.toLowerCase().includes(search.toLowerCase()) || (m.english_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : nodeMembers;

  return (
    <div className={cn('relative', level > 0 && 'ml-6 sm:ml-10')}>
      {level > 0 && (
        <div className="absolute -left-6 top-0 h-full w-6 sm:-left-10 sm:w-10">
          <div className="absolute left-0 top-0 h-full w-px bg-border" />
          <div className="absolute left-0 top-7 h-px w-6 sm:w-10 bg-border" />
        </div>
      )}

      <div className="mb-4">
        {/* Node Header */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
          {hasChildren && (
            <button onClick={() => onToggle(node.id)} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', `bg-${node.color}/10 text-${node.color}`)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{node.title}</p>
            <p className="font-khmer text-xs text-muted-foreground">{node.titleKh}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            {count}
          </Badge>
        </div>

        {/* Members */}
        {!isCollapsed && filteredMembers.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-shadow hover:shadow-sm">
                <Avatar className="h-9 w-9">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.khmer_name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 font-khmer text-xs font-semibold text-primary">
                      {m.khmer_name.slice(0, 1)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-khmer truncate text-sm font-medium">{m.khmer_name}</p>
                  {m.english_name && <p className="truncate text-xs text-muted-foreground">{m.english_name}</p>}
                  <p className="text-[10px] text-muted-foreground">Joined: {formatDate(m.join_date)}</p>
                </div>
                <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Children */}
        {!isCollapsed && hasChildren && (
          <div className="mt-4 space-y-4">
            {node.children!.map((child) => (
              <OrgNodeCard
                key={child.id}
                node={child}
                members={members}
                search={search}
                collapsed={collapsed}
                onToggle={onToggle}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminOrganizationPage() {
  const { data: members } = useMembers();
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(100);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(['treasurer', 'monks', 'students', 'preah_ther', 'bhikkhu', 'samanera', 'ramachang', 'old_student', 'new_student']));

  const handleExport = () => {
    exportToCSV('kot17_organization', members.map((m) => ({
      KhmerName: m.khmer_name,
      EnglishName: m.english_name ?? '',
      Position: POSITION_LABELS[m.position]?.en ?? m.position,
      Status: m.status,
      Phone: m.phone ?? '',
      JoinDate: m.join_date,
    })));
    toast.success('Organization exported');
  };

  const totalMonks = countMembers(ORG_TREE.children!.find((c) => c.id === 'monks')!, members);
  const totalStudents = countMembers(ORG_TREE.children!.find((c) => c.id === 'students')!, members);

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Organization</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Organization Structure"
        titleKh="រចនាសម្ព័ន្ធអង្គភាព"
        subtitle="Interactive organizational hierarchy of KOT 17"
        actions={
          <>
            <Button variant="outline" onClick={expandAll}><ChevronDown className="mr-2 h-4 w-4" />Expand All</Button>
            <Button variant="outline" onClick={collapseAll}><ChevronRight className="mr-2 h-4 w-4" />Collapse All</Button>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Crown className="h-5 w-5" /></div>
          <div><p className="text-sm text-muted-foreground">Total Members</p><p className="text-xl font-bold">{members.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
          <div><p className="text-sm text-muted-foreground">Total Monks</p><p className="text-xl font-bold">{totalMonks}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info"><GraduationCap className="h-5 w-5" /></div>
          <div><p className="text-sm text-muted-foreground">Total Students</p><p className="text-xl font-bold">{totalStudents}</p></div>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search member name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(50, z - 10))}><ZoomOut className="h-4 w-4" /></Button>
            <span className="w-12 text-center text-sm font-medium">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(150, z + 10))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(100)}><Maximize2 className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Org Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Organizational Hierarchy / ឋានានុក្រមតួនាទី
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ zoom: `${zoom}%` }} className="origin-top-left">
            <OrgNodeCard
              node={ORG_TREE}
              members={members}
              search={search}
              collapsed={collapsed}
              onToggle={toggleNode}
              level={0}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
