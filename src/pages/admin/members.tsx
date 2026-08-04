import { useMemo, useState } from 'react';
import {
  Plus, Search, Download, Upload, Pencil, Trash2, Eye, Users as UsersIcon,
  ArrowUpDown, ChevronLeft, ChevronRight, QrCode, Printer,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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
  type Member, type MemberPosition, type MemberStatus,
} from '@/lib/types';
import { toast } from 'sonner';

type SortKey = 'khmer_name' | 'position' | 'join_date' | 'status';

const emptyForm = {
  khmer_name: '', english_name: '', position: 'new_student' as MemberPosition,
  status: 'active' as MemberStatus, phone: '', join_date: new Date().toISOString().slice(0, 10),
  notes: '', photo_url: '',
};

const PAGE_SIZE = 10;

export function AdminMembersPage() {
  const { data: members, setData } = useMembers();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('khmer_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [qrMember, setQrMember] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let out = members;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((m) => m.khmer_name.toLowerCase().includes(q) || (m.english_name ?? '').toLowerCase().includes(q) || (m.phone ?? '').includes(q));
    }
    if (posFilter !== 'all') out = out.filter((m) => m.position === posFilter);
    if (statusFilter !== 'all') out = out.filter((m) => m.status === statusFilter);
    out = [...out].sort((a, b) => {
      const av = String(a[sortKey] ?? ''); const bv = String(b[sortKey] ?? '');
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return out;
  }, [members, search, posFilter, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ khmer_name: m.khmer_name, english_name: m.english_name ?? '', position: m.position, status: m.status, phone: m.phone ?? '', join_date: m.join_date, notes: m.notes ?? '', photo_url: m.photo_url ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.khmer_name) { toast.error('Khmer name is required'); return; }
    setSubmitting(true);
    const payload = {
      khmer_name: form.khmer_name, english_name: form.english_name || null,
      position: form.position, status: form.status, phone: form.phone || null,
      join_date: form.join_date, notes: form.notes || null, photo_url: form.photo_url || null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { data, error } = await supabase.from('members').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((m) => (m.id === editing.id ? (data as Member) : m)));
      await logActivity('update_member', 'members', `Updated ${form.khmer_name}`, profile?.full_name);
      toast.success('Member updated');
    } else {
      const { data, error } = await supabase.from('members').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as Member, ...prev]);
      await logActivity('create_member', 'members', `Added ${form.khmer_name}`, profile?.full_name);
      toast.success('Member added');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Delete ${m.khmer_name}?`)) return;
    const { error } = await supabase.from('members').delete().eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== m.id));
    await logActivity('delete_member', 'members', `Deleted ${m.khmer_name}`, profile?.full_name);
    toast.success('Member deleted');
  };

  const handleExport = () => {
    exportToCSV('kot17_members', filtered.map((m) => ({
      KhmerName: m.khmer_name, EnglishName: m.english_name ?? '',
      Position: POSITION_LABELS[m.position]?.en ?? m.position, Status: m.status,
      Phone: m.phone ?? '', JoinDate: m.join_date, Notes: m.notes ?? '',
    })));
    toast.success('Exported to CSV');
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((s) => !s); else { setSortKey(key); setSortAsc(true); }
  };

  const generateQRData = (m: Member) => {
    return JSON.stringify({ id: m.id, name: m.khmer_name, position: m.position, phone: m.phone ?? '', temple: 'KOT 17' });
  };

  const columns: Column<Member>[] = [
    { key: 'khmer_name', header: 'Khmer Name', headerKh: 'ឈ្មោះខ្មែរ', cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          {r.photo_url ? <img src={r.photo_url} alt={r.khmer_name} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="bg-primary/10 font-khmer text-sm font-semibold text-primary">{r.khmer_name.slice(0, 1)}</AvatarFallback>}
        </Avatar>
        <div><p className="font-khmer font-medium">{r.khmer_name}</p>{r.english_name && <p className="text-xs text-muted-foreground">{r.english_name}</p>}</div>
      </div>
    ) },
    { key: 'position', header: 'Position', headerKh: 'តួនាទី', cell: (r) => <Badge variant="outline" className="font-khmer">{POSITION_LABELS[r.position]?.kh ?? r.position}</Badge> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => <Badge variant={r.status === 'active' ? 'default' : r.status === 'left' ? 'destructive' : 'secondary'}>{r.status}</Badge> },
    { key: 'join_date', header: 'Join Date', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.join_date)}</span> },
    { key: 'actions', header: 'Actions', headerKh: 'សកម្មភាព', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setViewing(r); setViewOpen(true); }} title="View"><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { setQrMember(r); setQrOpen(true); }} title="QR Code"><QrCode className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Edit"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Members</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Member Management" titleKh="ការគ្រប់គ្រងសមាជិក"
        subtitle="Search, filter, add, edit, and export members"
        actions={<>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Button variant="outline" onClick={() => toast.info('Import Excel — select a .xlsx file')}><Upload className="mr-2 h-4 w-4" />Import</Button>
          <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Member</Button>
        </>}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={posFilter} onValueChange={(v) => { setPosFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Position" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Positions</SelectItem>{(Object.keys(POSITION_LABELS) as MemberPosition[]).map((p) => <SelectItem key={p} value={p}>{POSITION_LABELS[p].en}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="left">Left</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" />Members</span>
            <span className="text-sm font-normal text-muted-foreground">{filtered.length} of {members.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {(['khmer_name', 'position', 'join_date', 'status'] as SortKey[]).map((k) => (
              <Button key={k} variant={sortKey === k ? 'default' : 'outline'} size="sm" onClick={() => toggleSort(k)} className="text-xs">
                <ArrowUpDown className="mr-1 h-3 w-3" />{k.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <DataTable columns={columns} data={paged} rowKey={(r) => r.id} />
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} · Showing {paged.length} of {filtered.length}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Member' : 'Add Member'} / {editing ? 'កែសម្រួលសមាជិក' : 'បន្ថែមសមាជិក'}</DialogTitle><DialogDescription>Enter the member's details below.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 font-khmer text-xl font-semibold text-primary">{form.khmer_name.slice(0, 1) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label>Photo URL / រូបថត URL</Label>
                <Input placeholder="https://..." value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2"><Label>Khmer Name / ឈ្មោះខ្មែរ *</Label><Input value={form.khmer_name} onChange={(e) => setForm({ ...form, khmer_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>English Name / ឈ្មោះអង់គ្លេស</Label><Input value={form.english_name} onChange={(e) => setForm({ ...form, english_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Position / តួនាទី</Label><Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v as MemberPosition })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(POSITION_LABELS) as MemberPosition[]).map((p) => <SelectItem key={p} value={p}>{POSITION_LABELS[p].en}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Status / ស្ថានភាព</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MemberStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="left">Left</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Phone / ទូរស័ព្ទ</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Join Date / កាលបរិច្ឆេទ</Label><Input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Notes / កំណត់ហេតុ</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Member Profile / ប្រវត្តិសមាជិក</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {viewing.photo_url ? <img src={viewing.photo_url} alt={viewing.khmer_name} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="bg-primary/10 font-khmer text-2xl font-semibold text-primary">{viewing.khmer_name.slice(0, 1)}</AvatarFallback>}
                </Avatar>
                <div>
                  <p className="font-khmer text-lg font-bold">{viewing.khmer_name}</p>
                  <p className="text-sm text-muted-foreground">{viewing.english_name ?? '-'}</p>
                  <Badge variant="outline" className="font-khmer mt-1">{POSITION_LABELS[viewing.position]?.kh}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div><span className="text-muted-foreground">Status: </span>{viewing.status}</div>
                <div><span className="text-muted-foreground">Phone: </span>{viewing.phone ?? '-'}</div>
                <div><span className="text-muted-foreground">Join Date: </span>{formatDate(viewing.join_date)}</div>
                <div><span className="text-muted-foreground">Position: </span>{POSITION_LABELS[viewing.position]?.en}</div>
                {viewing.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes: </span>{viewing.notes}</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={(o) => !o && setQrOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Member QR Code / QR Code សមាជិក</DialogTitle></DialogHeader>
          {qrMember && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8">
                <div className="grid grid-cols-8 gap-px">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const hash = generateQRData(qrMember).charCodeAt(i % generateQRData(qrMember).length) + i;
                    return <div key={i} className={`h-3 w-3 ${(hash % 3) === 0 ? 'bg-primary' : 'bg-transparent'}`} />;
                  })}
                </div>
              </div>
              <div className="text-center">
                <p className="font-khmer text-lg font-bold">{qrMember.khmer_name}</p>
                <p className="text-sm text-muted-foreground">{POSITION_LABELS[qrMember.position]?.en}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">ID: {qrMember.id.slice(0, 8)}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print QR Code</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
