import { useState } from 'react';
import { UserCircle, Save, Mail, Shield, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { ROLE_LABELS, formatDate } from '@/lib/types';
import { toast } from 'sonner';

export function MemberProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const initials = profile.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    if (error) { setSaving(false); toast.error(error.message); return; }
    await refreshProfile();
    await logActivity('update_profile', 'profiles', `Updated name to ${name}`, profile.full_name);
    setSaving(false);
    toast.success('Profile updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Personal Profile" titleKh="ប្រវត្តិផ្ទាល់ខ្លួន" subtitle="View and edit your profile" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-lg font-bold">{profile.full_name}</h2>
            <Badge variant="secondary" className="font-khmer mt-2">{ROLE_LABELS[profile.role].kh}</Badge>
            <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABELS[profile.role].en}</p>
            <div className="mt-4 w-full space-y-2 border-t border-border pt-4 text-left text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{profile.id}@kot17.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Status: {profile.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined: {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Edit Profile / កែសម្រួលប្រវត្តិ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name / ឈ្មោះពេញ</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role / តួនាទី</Label>
              <Input value={ROLE_LABELS[profile.role].en} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Role is assigned by the administrator.</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
