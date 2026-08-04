import { useMemo, useState } from 'react';
import {
  UserRound, Search, Download, Eye, Pencil, ChevronLeft, ChevronRight,
  Printer, Home, GraduationCap, Phone, CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useMembers } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import {
  POSITION_LABELS, formatDate, exportToCSV, printArea,
  type Member, type MemberPosition,
} from '@/lib/types';
import { toast } from 'sonner';

const MONK_POSITIONS: MemberPosition[] = ['preah_ther', 'bhikkhu', 'samanera'];
const MONK_GROUPS = [
  { position: 'preah_ther' as MemberPosition, label: 'ព្រះថេរ', labelEn: 'Preah Ther (Senior Monk)' },
  { position: 'bhikkhu' as MemberPosition, label: 'ភិក្ខុ', labelEn: 'Bhikkhu (Fully Ordained)' },
  { position: 'samanera' as MemberPosition, label: 'សមណេរ', labelEn: 'Samanera (Novice)' },
];

const PAGE_SIZE = 10;

export function AdminMonksPage() {
  const { data: members, setData } = useMembers();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ temple_id: '', ordination_date: '', education: '', room: '', phone: '', guardian: '' });
  const [submitting, setSubmitting] = useState(false);

  const monks = useMemo(() => members.filter((m) => MONK_POSITIONS.includes(m.position)), [members]);

  const filtered = useMemo(() => {
    return monks.filter((m) => {
      if (groupFilter !== 'all' && m.position !== groupFilter) return false;
      if (search && !m.khmer_name.toLowerCase().includes(search.toLowerCase()) && !(m.english_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [monks, search, groupFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const groupCounts = MONK_GROUPS.map((g) => ({ ...g, count: monks.filter((m) => m.position === g.position).length }));
  const activeMonks = monks.filter((m) => m.status === 'active').length;

  const openView = (m: Member) => { setViewing(m); setViewOpen(true); };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ temple_id: m.temple_id ?? '', ordination_date: m.ordination_date ?? '', education: m.education ?? '', room: m.room ?? '', phone: m.phone ?? '', guardian: m.guardian ?? '' });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSubmitting(true);
    const { error } = await supabase.from('members').update({
      temple_id: form.temple_id || null,
      ordination_date: form.ordination_date || null,
      education: form.education || null,
      room: form.room || null,
      phone: form.phone || null,
      guardian: form.guardian || null,
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id);
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    setData((prev) => prev.map((m) => m.id === editing.id ? { ...m, temple_id: form.temple_id || null, ordination_date: form.ordination_date || null, education: form.education || null, room: form.room || null, phone: form.phone || null, guardian: form.guardian || null } : m));
    await logActivity('update_monk', 'members', `Updated monk ${editing.khmer_name}`, profile?.full_name);
    toast.success('Monk updated');
    setSubmitting(false);
    setEditOpen(false);
  };

  const handleExport = () => {
    exportToCSV('kot17_monks', filtered.map((m) => ({
      KhmerName: m.khmer_name, EnglishName: m.english_name ?? '',
      Group: POSITION_LABELS[m.position]?.en ?? m.position, TempleID: m.temple_id ?? '',
      OrdinationDate: m.ordination_date ?? '', Education: m.education ?? '',
      Room: m.room ?? '', Phone: m.phone ?? '', Guardian: m.guardian ?? '',
      Status: m.status, JoinDate: m.join_date,
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Member>[] = [
    { key: 'photo', header: 'Photo', headerKh: 'រូបថត', cell: (r) => (
      <Avatar className="h-9 w-9">
        {r.photo_url ? <img src={r.photo_url} alt={r.khmer_name} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="bg-primary/10 font-khmer text-sm font-semibold text-primary">{r.khmer_name.slice(0, 1)}</AvatarFallback>}
      </Avatar>
    ) },
    { key: 'khmer_name', header: 'Name', headerKh: 'ឈ្មោះ', cell: (r) => <div><p className="font-khmer font-medium">{r.khmer_name}</p>{r.english_name && <p className="text-xs text-muted-foreground">{r.english_name}</p>}</div> },
    { key: 'group', header: 'Group', headerKh: 'ក្រុម', cell: (r) => <Badge variant="outline" className="font-khmer">{POSITION_LABELS[r.position]?.kh ?? r.position}</Badge> },
    { key: 'temple_id', header: 'Temple ID', headerKh: 'លេខកុដិ', cell: (r) => <span className="font-mono text-xs">{r.temple_id ?? '-'}</span> },
    { key: 'ordination_date', header: 'Ordination', headerKh: 'កាលបរិច្ឆេទឧបសម្បទា', cell: (r) => <span className="text-sm text-muted-foreground">{r.ordination_date ? formatDate(r.ordination_date) : '-'}</span> },
    { key: 'education', header: 'Education', headerKh: 'ការអប់រំ', cell: (r) => <span className="text-sm">{r.education ?? '-'}</span> },
    { key: 'room', header: 'Room', headerKh: 'បន្ទប់', cell: (r) => <span className="text-sm">{r.room ?? '-'}</span> },
    { key: 'phone', header: 'Phone', headerKh: 'ទូរស័ព្ទ', cell: (r) => <span className="text-sm">{r.phone ?? '-'}</span> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge> },
    { key: 'actions', header: '', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Monks</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Monk Management" titleKh="ការគ្រប់គ្រងព្រះសង្ឃ"
        subtitle="Manage monks across three categories: ព្រះថេរ, ភិក្ខុ, សមណេរ"
        actions={<>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
        </>}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Monks" titleKh="ព្រះសង្ឃសរុប" value={monks.length} icon={UserRound} accent="primary" />
        <StatCard title="Active" titleKh="សកម្ម" value={activeMonks} icon={UserRound} accent="success" />
        {groupCounts.map((g) => (
          <StatCard key={g.position} title={g.labelEn} titleKh={g.label} value={g.count} icon={UserRound} accent="secondary" />
        ))}
      </div>

      {/* Group Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MONK_GROUPS.map((g) => {
          const groupMembers = monks.filter((m) => m.position === g.position);
          return (
            <Card key={g.position}>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" /><span className="font-khmer">{g.label}</span><Badge variant="secondary" className="ml-auto">{groupMembers.length}</Badge></CardTitle></CardHeader>
              <CardContent>
                {groupMembers.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 py-1.5">
                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 font-khmer text-xs text-primary">{m.khmer_name.slice(0, 1)}</AvatarFallback></Avatar>
                    <span className="font-khmer truncate text-sm">{m.khmer_name}</span>
                  </div>
                ))}
                {groupMembers.length > 3 && <p className="pt-1 text-xs text-muted-foreground">+ {groupMembers.length - 3} more</p>}
                {groupMembers.length === 0 && <p className="py-2 text-sm text-muted-foreground">No members</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search monk name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Group" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Groups</SelectItem>{MONK_GROUPS.map((g) => <SelectItem key={g.position} value={g.position}>{g.label} — {g.labelEn}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Monks / ព្រះសង្ឃ<span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span></CardTitle></CardHeader>
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

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Monk Profile / ប្រវត្តិព្រះសង្ឃ</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {viewing.photo_url ? <img src={viewing.photo_url} alt={viewing.khmer_name} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="bg-primary/10 font-khmer text-2xl font-semibold text-primary">{viewing.khmer_name.slice(0, 1)}</AvatarFallback>}
                </Avatar>
                <div><p className="font-khmer text-lg font-bold">{viewing.khmer_name}</p><p className="text-sm text-muted-foreground">{viewing.english_name ?? '-'}</p><Badge variant="outline" className="font-khmer mt-1">{POSITION_LABELS[viewing.position]?.kh}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /><span>Temple ID: {viewing.temple_id ?? '-'}</span></div>
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><span>Ordained: {viewing.ordination_date ? formatDate(viewing.ordination_date) : '-'}</span></div>
                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /><span>Education: {viewing.education ?? '-'}</span></div>
                <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /><span>Room: {viewing.room ?? '-'}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>Phone: {viewing.phone ?? '-'}</span></div>
                <div><span className="text-muted-foreground">Status: </span>{viewing.status}</div>
                {viewing.guardian && <div className="col-span-2"><span className="text-muted-foreground">Guardian: </span>{viewing.guardian}</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Monk Details / កែសម្រួលព័ត៌មានព្រះសង្ឃ</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2"><Label>Temple ID / លេខកុដិ</Label><Input value={form.temple_id} onChange={(e) => setForm({ ...form, temple_id: e.target.value })} /></div>
              <div className="space-y-2"><Label>Ordination Date / កាលបរិច្ឆេទឧបសម្បទា</Label><Input type="date" value={form.ordination_date} onChange={(e) => setForm({ ...form, ordination_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Education / ការអប់រំ</Label><Input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
              <div className="space-y-2"><Label>Room / បន្ទប់</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone / ទូរស័ព្ទ</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Guardian / អាណាព្យាបាល</Label><Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
