import { useState } from 'react';
import { FileText, Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAnnouncements } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatDate, type Announcement } from '@/lib/types';
import { toast } from 'sonner';

export function AdminRecordsPage() {
  const { data: announcements, setData } = useAnnouncements();
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', pinned: false });
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', body: '', audience: 'all', pinned: false });
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, audience: a.audience, pinned: a.pinned });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) {
      toast.error('Title and body are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title,
      body: form.body,
      audience: form.audience,
      pinned: form.pinned,
      author_name: profile?.full_name ?? 'Admin',
    };
    if (editing) {
      const { data, error } = await supabase.from('announcements').update(payload).eq('id', editing.id).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => prev.map((a) => (a.id === editing.id ? (data as Announcement) : a)));
      await logActivity('update_announcement', 'announcements', `Updated ${form.title}`, profile?.full_name);
      toast.success('Record updated');
    } else {
      const { data, error } = await supabase.from('announcements').insert(payload).select().single();
      if (error) { setSubmitting(false); toast.error(error.message); return; }
      setData((prev) => [data as Announcement, ...prev]);
      await logActivity('create_announcement', 'announcements', `Created ${form.title}`, profile?.full_name);
      toast.success('Record created');
    }
    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async (a: Announcement) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    const { error } = await supabase.from('announcements').delete().eq('id', a.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== a.id));
    await logActivity('delete_announcement', 'announcements', `Deleted ${a.title}`, profile?.full_name);
    toast.success('Record deleted');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Records"
        titleKh="កំណត់ហេតុរដ្ឋបាល"
        subtitle="Announcements and administrative records"
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            New Record
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Records / កំណត់ហេតុ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No records yet</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.pinned && <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-medium text-secondary">Pinned</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(a.created_at)}</span>
                      <span>•</span>
                      <span>Audience: {a.audience}</span>
                      {a.author_name && <><span>•</span><span>by {a.author_name}</span></>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Record' : 'New Record'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title / ចំណងជើង</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Body / មាតិធាន័យ</Label>
              <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="members">Members</option>
                  <option value="officers">Officers</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
                Pinned
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
