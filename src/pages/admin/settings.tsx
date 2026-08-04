import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Save, Building2, Globe, Bell, Shield,
  Database, Smartphone, Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { useSettings } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { toast } from 'sonner';

const TEMPLE_KEYS = [
  { key: 'temple_name_kh', label: 'Temple Name (Khmer)', labelKh: 'ឈ្មោះវត្ត (ខ្មែរ)' },
  { key: 'temple_name_en', label: 'Temple Name (English)', labelKh: 'ឈ្មោះវត្ត (អង់គ្លេស)' },
  { key: 'kuti_number', label: 'Kuti Number', labelKh: 'លេខកុដិ' },
  { key: 'currency', label: 'Currency', labelKh: 'រូបិយប័ណ្ណ' },
  { key: 'address', label: 'Address', labelKh: 'អាសយដ្ឋាន' },
  { key: 'phone', label: 'Phone', labelKh: 'ទូរស័ព្ទ' },
  { key: 'email', label: 'Email', labelKh: 'អ៊ីមែល' },
  { key: 'logo_url', label: 'Logo URL', labelKh: 'ឡូហ្គោ URL' },
];

export function AdminSettingsPage() {
  const { data: settings } = useSettings();
  const { profile } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [require2FA, setRequire2FA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  useEffect(() => {
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value ?? ''; });
    setValues(map);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    for (const { key } of TEMPLE_KEYS) {
      const existing = settings.find((s) => s.key === key);
      const value = values[key] ?? '';
      if (existing) {
        await supabase.from('app_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('app_settings').insert({ key, value });
      }
    }
    await logActivity('update_settings', 'app_settings', 'Updated system settings', profile?.full_name);
    setSaving(false);
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="System Settings" titleKh="ការកំណត់ប្រព័ន្ធ"
        subtitle="Configure temple information, system preferences, and security"
        actions={<Button onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</Button>}
      />

      <Tabs defaultValue="temple">
        <TabsList>
          <TabsTrigger value="temple"><Building2 className="mr-1 h-4 w-4" />Temple Info</TabsTrigger>
          <TabsTrigger value="system"><SettingsIcon className="mr-1 h-4 w-4" />System</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-1 h-4 w-4" />Security</TabsTrigger>
        </TabsList>

        {/* Temple Info Tab */}
        <TabsContent value="temple" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Temple Information / ព័ត៌មានវត្ត</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TEMPLE_KEYS.map(({ key, label, labelKh }) => (
                <div key={key} className="space-y-2">
                  <Label>{label} <span className="font-khmer text-muted-foreground">/ {labelKh}</span></Label>
                  <Input value={values[key] ?? ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Language & Display / ភាសា និងការបង្ហាញ</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Language / ភាសាលំនាំដើម</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="kh">Khmer / ខ្មែរ</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Theme / ប្រធានបទ</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Bilingual Labels</p><p className="text-xs text-muted-foreground">Show both Khmer and English</p></div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notifications / ការជូនដំណឹង</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Email Notifications</p><p className="text-xs text-muted-foreground">Receive system alerts via email</p></div>
                <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Push Notifications</p><p className="text-xs text-muted-foreground">Browser push alerts</p></div>
                <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Backup / ការបម្រុងទុក</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Auto Backup</p><p className="text-xs text-muted-foreground">Automatic daily database backup</p></div>
                <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Security Settings / ការកំណត់សុវត្ថិភាព</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Require 2FA for All Admins</p><p className="text-xs text-muted-foreground">Force two-factor authentication for admin accounts</p></div>
                <Switch checked={require2FA} onCheckedChange={setRequire2FA} />
              </div>
              <div className="space-y-2">
                <Label>Session Timeout (minutes) / ពេលវេលាសេស្សិន</Label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="15">15 minutes</SelectItem><SelectItem value="30">30 minutes</SelectItem><SelectItem value="60">60 minutes</SelectItem><SelectItem value="120">2 hours</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" />System Information / ព័ត៌មានប្រព័ន្ធ</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><p className="text-muted-foreground">System Version</p><p className="font-medium">KOT 17 v1.2.0</p></div>
              <div><p className="text-muted-foreground">Database</p><p className="font-medium">Supabase (PostgreSQL)</p></div>
              <div><p className="text-muted-foreground">Authentication</p><p className="font-medium">Supabase Auth</p></div>
              <div><p className="text-muted-foreground">Last Backup</p><p className="font-medium">Today, 2:00 AM</p></div>
              <div><p className="text-muted-foreground">Uptime</p><p className="font-medium">99.9%</p></div>
              <div><p className="text-muted-foreground">Storage Used</p><p className="font-medium">12.5 MB</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
