import { useMemo, useState } from 'react';
import {
  GraduationCap, Search, Download, Eye, Pencil, ChevronLeft, ChevronRight,
  Printer, School, Phone, MapPin, UserCircle,
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

const STUDENT_POSITIONS: MemberPosition[] = ['ramachang', 'old_student', 'new_student'];
const STUDENT_GROUPS = [
  { position: 'ramachang' as MemberPosition, label: 'រាមច្បង', labelEn: 'Ramachang (Senior Student)' },
  { position: 'old_student' as MemberPosition, label: 'រាមកណ្ដាល', labelEn: 'Middle Student' },
  { position: 'new_student' as MemberPosition, label: 'រាមតូច', labelEn: 'New Student' },
];

const PAGE_SIZE = 10;

export function AdminStudentsPage() {
  const { data: members, setData } = useMembers();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', school: '', grade: '', education: '', guardian: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const students = useMemo(() => members.filter((m) => STUDENT_POSITIONS.includes(m.position)), [members]);

  const filtered = useMemo(() => {
    return students.filter((m) => {
      if (groupFilter !== 'all' && m.position !== groupFilter) return false;
      if (search && !m.khmer_name.toLowerCase().includes(search.toLowerCase()) && !(m.english_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, search, groupFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const groupCounts = STUDENT_GROUPS.map((g) => ({ ...g, count: students.filter((m) => m.position === g.position).length }));
  const activeStudents = students.filter((m) => m.status === 'active').length;

  const openView = (m: Member) => { setViewing(m); setViewOpen(true); };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ student_id: m.student_id ?? '', school: m.school ?? '', grade: m.grade ?? '', education: m.education ?? '', guardian: m.guardian ?? '', phone: m.phone ?? '', address: m.address ?? '' });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSubmitting(true);
    const { error } = await supabase.from('members').update({
      student_id: form.student_id || null,
      school: form.school || null,
      grade: form.grade || null,
      education: form.education || null,
      guardian: form.guardian || null,
      phone: form.phone || null,
      address: form.address || null,
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id);
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    setData((prev) => prev.map((m) => m.id === editing.id ? { ...m, student_id: form.student_id || null, school: form.school || null, grade: form.grade || null, education: form.education || null, guardian: form.guardian || null, phone: form.phone || null, address: form.address || null } : m));
    await logActivity('update_student', 'members', `Updated student ${editing.khmer_name}`, profile?.full_name);
    toast.success('Student updated');
    setSubmitting(false);
    setEditOpen(false);
  };

  const handleExport = () => {
    exportToCSV('kot17_students', filtered.map((m) => ({
      KhmerName: m.khmer_name, EnglishName: m.english_name ?? '',
      Group: POSITION_LABELS[m.position]?.en ?? m.position, StudentID: m.student_id ?? '',
      School: m.school ?? '', Grade: m.grade ?? '', Education: m.education ?? '',
      Guardian: m.guardian ?? '', Phone: m.phone ?? '', Address: m.address ?? '',
      Status: m.status, JoinDate: m.join_date,
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Member>[] = [
    { key: 'photo', header: 'Photo', headerKh: 'រូបថត', cell: (r) => (
      <Avatar className="h-9 w-9">
        {r.photo_url ? <img src={r.photo_url} alt={r.khmer_name} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="bg-info/10 font-khmer text-sm font-semibold text-info">{r.khmer_name.slice(0, 1)}</AvatarFallback>}
      </Avatar>
    ) },
    { key: 'khmer_name', header: 'Name', headerKh: 'ឈ្មោះ', cell: (r) => <div><p className="font-khmer font-medium">{r.khmer_name}</p>{r.english_name && <p className="text-xs text-muted-foreground">{r.english_name}</p>}</div> },
    { key: 'group', header: 'Group', headerKh: 'ក្រុម', cell: (r) => <Badge variant="outline" className="font-khmer">{POSITION_LABELS[r.position]?.kh ?? r.position}</Badge> },
    { key: 'student_id', header: 'Student ID', headerKh: 'លេខសិស្ស', cell: (r) => <span className="font-mono text-xs">{r.student_id ?? '-'}</span> },
    { key: 'school', header: 'School', headerKh: 'សាលា', cell: (r) => <span className="text-sm">{r.school ?? '-'}</span> },
    { key: 'grade', header: 'Grade', headerKh: 'ថ្នាក់', cell: (r) => <span className="text-sm">{r.grade ?? '-'}</span> },
    { key: 'guardian', header: 'Guardian', headerKh: 'អាណាព្យាបាល', cell: (r) => <span className="text-sm">{r.guardian ?? '-'}</span> },
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
          <BreadcrumbItem><BreadcrumbPage>Students</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Student Management" titleKh="ការគ្រប់គ្រងសិស្ស"
        subtitle="Manage students across three groups: រាមច្បង, រាមកណ្ដាល, រាមតូច"
        actions={<>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
        </>}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" titleKh="សិស្សសរុប" value={students.length} icon={GraduationCap} accent="info" />
        <StatCard title="Active" titleKh="សកម្ម" value={activeStudents} icon={GraduationCap} accent="success" />
        {groupCounts.map((g) => (
          <StatCard key={g.position} title={g.labelEn} titleKh={g.label} value={g.count} icon={GraduationCap} accent="primary" />
        ))}
      </div>

      {/* Group Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STUDENT_GROUPS.map((g) => {
          const groupMembers = students.filter((m) => m.position === g.position);
          return (
            <Card key={g.position}>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-info" /><span className="font-khmer">{g.label}</span><Badge variant="secondary" className="ml-auto">{groupMembers.length}</Badge></CardTitle></CardHeader>
              <CardContent>
                {groupMembers.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 py-1.5">
                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-info/10 font-khmer text-xs text-info">{m.khmer_name.slice(0, 1)}</AvatarFallback></Avatar>
                    <span className="font-khmer truncate text-sm">{m.khmer_name}</span>
                  </div>
                ))}
                {groupMembers.length > 3 && <p className="pt-1 text-xs text-muted-foreground">+ {groupMembers.length - 3} more</p>}
                {groupMembers.length === 0 && <p className="py-2 text-sm text-muted-foreground">No students</p>}
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
            <Input placeholder="Search student name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Group" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Groups</SelectItem>{STUDENT_GROUPS.map((g) => <SelectItem key={g.position} value={g.position}>{g.label} — {g.labelEn}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-info" />Students / សិស្ស<span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span></CardTitle></CardHeader>
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
          <DialogHeader><DialogTitle>Student Profile / ប្រវត្តិសិស្ស</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {viewing.photo_url ? <img src={viewing.photo_url} alt={viewing.khmer_name} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="bg-info/10 font-khmer text-2xl font-semibold text-info">{viewing.khmer_name.slice(0, 1)}</AvatarFallback>}
                </Avatar>
                <div><p className="font-khmer text-lg font-bold">{viewing.khmer_name}</p><p className="text-sm text-muted-foreground">{viewing.english_name ?? '-'}</p><Badge variant="outline" className="font-khmer mt-1">{POSITION_LABELS[viewing.position]?.kh}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-muted-foreground" /><span>Student ID: {viewing.student_id ?? '-'}</span></div>
                <div className="flex items-center gap-2"><School className="h-4 w-4 text-muted-foreground" /><span>School: {viewing.school ?? '-'}</span></div>
                <div><span className="text-muted-foreground">Grade: </span>{viewing.grade ?? '-'}</div>
                <div><span className="text-muted-foreground">Education: </span>{viewing.education ?? '-'}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>Phone: {viewing.phone ?? '-'}</span></div>
                <div><span className="text-muted-foreground">Guardian: </span>{viewing.guardian ?? '-'}</div>
                <div className="col-span-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>Address: {viewing.address ?? '-'}</span></div>
                <div><span className="text-muted-foreground">Status: </span>{viewing.status}</div>
                <div><span className="text-muted-foreground">Join Date: </span>{formatDate(viewing.join_date)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Student Details / កែសម្រួលព័ត៌មានសិស្ស</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2"><Label>Student ID / លេខសិស្ស</Label><Input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} /></div>
              <div className="space-y-2"><Label>School / សាលា</Label><Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /></div>
              <div className="space-y-2"><Label>Grade / ថ្នាក់</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
              <div className="space-y-2"><Label>Education / ការអប់រំ</Label><Input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
              <div className="space-y-2"><Label>Guardian / អាណាព្យាបាល</Label><Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone / ទូរស័ព្ទ</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="col-span-2 space-y-2"><Label>Address / អាសយដ្ឋាន</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
