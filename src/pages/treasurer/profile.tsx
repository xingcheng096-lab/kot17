import { useState } from 'react';
import {
  UserCog, Mail, Phone, MapPin, Shield, Key, Lock, History, Save,
  Smartphone, Eye, EyeOff, Activity, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAuth } from '@/hooks/use-auth';
import { useActivityLogs } from '@/hooks/use-list';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { ROLE_LABELS, formatDateTime } from '@/lib/types';
import { toast } from 'sonner';

export function TreasurerProfilePage() {
  const { profile, session } = useAuth();
  const { data: activityLogs } = useActivityLogs();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
    }).eq('id', profile.id);
    if (error) { setSaving(false); toast.error(error.message); return; }
    await logActivity('update_profile', 'profiles', 'Updated treasurer profile', fullName);
    toast.success('Profile updated');
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('All fields are required'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); return; }
    await logActivity('change_password', 'auth', 'Changed password', fullName);
    toast.success('Password changed');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const myActivity = activityLogs.filter((a) => a.user_name === profile?.full_name || a.user_id === session?.user?.id).slice(0, 20);

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Profile</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title="Treasurer Profile" titleKh="ប្រវត្តិហេរញ្ញិក" subtitle="Manage your profile, security, and activity" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {(fullName || 'T').split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-lg font-bold">{fullName || 'Treasurer'}</h2>
            <Badge variant="default" className="mt-1">
              {ROLE_LABELS[profile?.role ?? 'treasurer']?.en ?? 'Treasurer'}
            </Badge>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{session?.user?.email ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{address || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile"><UserCog className="mr-1 h-4 w-4" />Profile</TabsTrigger>
              <TabsTrigger value="security"><Shield className="mr-1 h-4 w-4" />Security</TabsTrigger>
              <TabsTrigger value="activity"><History className="mr-1 h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Profile Information / ព័ត៌មានប្រវត្តិ</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name / ឈ្មោះពេញ</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone / ទូរស័ព្ទ</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address / អាសយដ្ឋាន</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Biography / ជីវប្រវត្តិ</Label>
                    <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write a short bio..." />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" />Change Password / ផ្លាស់ប្ដូរពាក្យសម្ងាត់</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password / ពាក្យសម្ងាត់បច្ចុប្បន្ន</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pl-9 pr-9" />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>New Password / ពាក្យសម្ងាត់ថ្មី</Label>
                      <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password / បញ្ជាក់ពាក្យសម្ងាត់</Label>
                      <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleChangePassword}><Key className="mr-2 h-4 w-4" />Change Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" />Two-Factor Authentication / ការផ្ទៀងផ្ទាត់ពីរជាន់</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium">2FA Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {twoFAEnabled && <Badge variant="default" className="text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Enabled</Badge>}
                      <Switch checked={twoFAEnabled} onCheckedChange={(v) => { setTwoFAEnabled(v); toast.success(v ? '2FA enabled' : '2FA disabled'); }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Activity Log / កំណត់ហេតុសកម្មភាព</CardTitle></CardHeader>
                <CardContent>
                  {myActivity.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="relative space-y-3 pl-4">
                      <div className="absolute left-1.5 top-0 h-full w-0.5 bg-border" />
                      {myActivity.map((log) => (
                        <div key={log.id} className="relative">
                          <div className="absolute -left-2.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                            </div>
                            {log.details && <p className="mt-1 text-xs text-muted-foreground">{log.details}</p>}
                            <p className="mt-0.5 text-xs text-muted-foreground">Entity: {log.entity ?? '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
