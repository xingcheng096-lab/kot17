import { useState } from 'react';
import {
  UserPlus, Trash2, Shield, Pencil, KeyRound, UserCheck, UserX, Search,
  ChevronLeft, ChevronRight, Download,
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
import { useProfiles } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { ROLE_LABELS, formatDate, exportToCSV, type Profile, type UserRole } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const { data: profiles, setData } = useProfiles();
  const { profile: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [resetting, setResetting] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'member' as UserRole });
  const [editForm, setEditForm] = useState({ full_name: '', role: 'member' as UserRole, status: 'active' });
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = profiles.filter((p) => {
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount = profiles.filter((p) => p.status === 'active').length;
  const adminCount = profiles.filter((p) => p.role === 'admin').length;

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) { toast.error('All fields are required'); return; }
    setSubmitting(true);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email, password: form.password, email_confirm: true,
      user_metadata: { full_name: form.full_name, role: form.role },
    });
    if (authError) { setSubmitting(false); toast.error(authError.message); return; }
    if (authData.user) {
      await supabase.from('profiles').upsert({ id: authData.user.id, full_name: form.full_name, role: form.role, status: 'active' });
    }
    await logActivity('create_user', 'profiles', `Created user ${form.full_name}`, currentUser?.full_name);
    toast.success('User created successfully');
    setSubmitting(false);
    setDialogOpen(false);
    setForm({ full_name: '', email: '', password: '', role: 'member' });
    const { data: fresh } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (fresh) setData(fresh as Profile[]);
  };

  const handleEdit = async () => {
    if (!editing) return;
    setSubmitting(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editForm.full_name, role: editForm.role, status: editForm.status,
    }).eq('id', editing.id);
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    setData((prev) => prev.map((p) => p.id === editing.id ? { ...p, full_name: editForm.full_name, role: editForm.role, status: editForm.status } : p));
    await logActivity('update_user', 'profiles', `Updated ${editForm.full_name}`, currentUser?.full_name);
    toast.success('User updated');
    setSubmitting(false);
    setEditOpen(false);
  };

  const handleDelete = async (p: Profile) => {
    if (!confirm(`Delete user ${p.full_name}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== p.id));
    await logActivity('delete_user', 'profiles', `Deleted ${p.full_name}`, currentUser?.full_name);
    toast.success('User deleted');
  };

  const handleToggleStatus = async (p: Profile) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.map((x) => x.id === p.id ? { ...x, status: newStatus } : x));
    await logActivity(newStatus === 'active' ? 'activate_user' : 'deactivate_user', 'profiles', `${newStatus === 'active' ? 'Activated' : 'Deactivated'} ${p.full_name}`, currentUser?.full_name);
    toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handleResetPassword = async () => {
    if (!resetting || !newPassword) { toast.error('New password is required'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.admin.updateUserById(resetting.id, { password: newPassword });
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    await logActivity('reset_password', 'profiles', `Reset password for ${resetting.full_name}`, currentUser?.full_name);
    toast.success('Password reset successfully');
    setSubmitting(false);
    setResetOpen(false);
    setNewPassword('');
    setResetting(null);
  };

  const handleExport = () => {
    exportToCSV('kot17_users', filtered.map((p) => ({
      Name: p.full_name, Role: ROLE_LABELS[p.role]?.en ?? p.role, Status: p.status, Joined: p.created_at,
    })));
    toast.success('Exported to CSV');
  };

  const columns: Column<Profile>[] = [
    { key: 'name', header: 'Name', headerKh: 'ឈ្មោះ', cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">{r.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</AvatarFallback></Avatar>
        <span className="font-medium">{r.full_name}</span>
      </div>
    ) },
    { key: 'role', header: 'Role', headerKh: 'តួនាទី', cell: (r) => <Badge variant="secondary" className="font-khmer">{ROLE_LABELS[r.role]?.kh ?? r.role}</Badge> },
    { key: 'status', header: 'Status', headerKh: 'ស្ថានភាព', cell: (r) => <Badge variant={r.status === 'active' ? 'default' : r.status === 'locked' ? 'destructive' : 'outline'}>{r.status}</Badge> },
    { key: 'created', header: 'Joined', headerKh: 'កាលបរិច្ឆេទ', cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span> },
    { key: 'actions', header: 'Actions', headerKh: 'សកម្មភាព', align: 'right', cell: (r) => (
      r.id !== currentUser?.id && (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setEditForm({ full_name: r.full_name, role: r.role, status: r.status }); setEditOpen(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setResetting(r); setResetOpen(true); }} title="Reset Password"><KeyRound className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(r)} title={r.status === 'active' ? 'Deactivate' : 'Activate'}>
            {r.status === 'active' ? <UserX className="h-4 w-4 text-warning" /> : <UserCheck className="h-4 w-4 text-success" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    ) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Users</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="User Management" titleKh="ការគ្រប់គ្រងអ្នកប្រើ"
        subtitle="Create, edit, delete, reset passwords, activate and deactivate users"
        actions={<>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button onClick={() => setDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Add User</Button>
        </>}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" titleKh="អ្នកប្រើសរុប" value={profiles.length} icon={Shield} accent="primary" />
        <StatCard title="Active" titleKh="សកម្ម" value={activeCount} icon={UserCheck} accent="success" />
        <StatCard title="Admins" titleKh="អ្នកគ្រប់គ្រង" value={adminCount} icon={Shield} accent="secondary" />
        <StatCard title="Inactive" titleKh="អសកម្ម" value={profiles.length - activeCount} icon={UserX} accent="destructive" />
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Roles</SelectItem>{(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r].en}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="locked">Locked</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />System Users / អ្នកប្រើប្រព័ន្ធ<span className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} records</span></CardTitle></CardHeader>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User / បន្ថែមអ្នកប្រើថ្មី</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Full Name / ឈ្មោះពេញ</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email / អ៊ីមែល</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Password / ពាក្យសម្ងាត់</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role / តួនាទី</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r].en} — {ROLE_LABELS[r].kh}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create User'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User / កែសម្រួលអ្នកប្រើ</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Full Name / ឈ្មោះពេញ</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role / តួនាទី</Label><Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r].en}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status / ស្ថានភាព</Label><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="locked">Locked</SelectItem></SelectContent></Select></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={(o) => !o && setResetOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password / កំណត់ពាក្យសម្ងាត់ឡើងវិញ</DialogTitle></DialogHeader>
          {resetting && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Reset password for <span className="font-medium">{resetting.full_name}</span></p>
              <div className="space-y-2"><Label>New Password / ពាក្យសម្ងាត់ថ្មី</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button><Button onClick={handleResetPassword} disabled={submitting}>{submitting ? 'Resetting...' : 'Reset Password'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
