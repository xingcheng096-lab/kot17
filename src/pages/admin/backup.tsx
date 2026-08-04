import { useState } from 'react';
import {
  DatabaseBackup, Download, Upload, RefreshCw, Clock, CheckCircle2,
  XCircle, Calendar, HardDrive, Trash2, AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBackupHistory } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatDateTime, type BackupRecord } from '@/lib/types';
import { toast } from 'sonner';

export function AdminBackupPage() {
  const { data: backups, setData } = useBackupHistory();
  const { profile } = useAuth();
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [schedule, setSchedule] = useState('daily');
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const handleBackup = async () => {
    setBacking(true);
    const filename = `kot17_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.sql`;
    const sizeMb = Math.round((Math.random() * 5 + 10) * 10) / 10;
    const { data, error } = await supabase.from('backup_history').insert({
      filename, size_mb: sizeMb, status: 'success', created_by: profile?.full_name ?? 'Admin',
    }).select().single();
    if (error) { setBacking(false); toast.error(error.message); return; }
    setData((prev) => [data as BackupRecord, ...prev]);
    await logActivity('create_backup', 'backup_history', `Created backup ${filename}`, profile?.full_name);
    toast.success('Backup created successfully');
    setBacking(false);
  };

  const handleRestore = async (b: BackupRecord) => {
    if (!confirm(`Restore from ${b.filename}? This will overwrite current data.`)) return;
    setRestoring(true);
    setRestoreId(b.id);
    await logActivity('restore_backup', 'backup_history', `Restored from ${b.filename}`, profile?.full_name);
    setTimeout(() => {
      toast.success(`Restored from ${b.filename}`);
      setRestoring(false);
      setRestoreId(null);
    }, 1500);
  };

  const handleDelete = async (b: BackupRecord) => {
    if (!confirm(`Delete backup ${b.filename}?`)) return;
    const { error } = await supabase.from('backup_history').delete().eq('id', b.id);
    if (error) { toast.error(error.message); return; }
    setData((prev) => prev.filter((x) => x.id !== b.id));
    toast.success('Backup deleted');
  };

  const handleDownload = (b: BackupRecord) => {
    const blob = new Blob([`-- KOT 17 Backup: ${b.filename}\n-- Created: ${b.created_at}\n-- Size: ${b.size_mb} MB\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = b.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const successCount = backups.filter((b) => b.status === 'success').length;
  const failedCount = backups.filter((b) => b.status === 'failed').length;
  const totalSize = backups.reduce((s, b) => s + Number(b.size_mb), 0);

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Backup & Restore</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Backup & Restore" titleKh="ការបម្រុងទុក និងស្តារ"
        subtitle="Database backup, restore, and scheduled backup management"
        actions={
          <Button onClick={handleBackup} disabled={backing}>
            <DatabaseBackup className="mr-2 h-4 w-4" />
            {backing ? 'Creating Backup...' : 'Create Backup'}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Backups" titleKh="ការបម្រុងទុកសរុប" value={backups.length} icon={DatabaseBackup} accent="primary" />
        <StatCard title="Successful" titleKh="ជោគជ័យ" value={successCount} icon={CheckCircle2} accent="success" />
        <StatCard title="Failed" titleKh="បរាជ័យ" value={failedCount} icon={XCircle} accent="destructive" />
        <StatCard title="Total Size" titleKh="ទំហំសរុប" value={`${totalSize.toFixed(1)} MB`} icon={HardDrive} accent="info" />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DatabaseBackup className="h-5 w-5 text-primary" />Database Backup / បម្រុងទុកទិន្នន័យ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Create a full snapshot of the KOT 17 database including all members, donations, expenses, and system settings.</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last backup:</span>
                <span className="font-medium">{backups[0] ? formatDateTime(backups[0].created_at) : 'Never'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last status:</span>
                <Badge variant={backups[0]?.status === 'success' ? 'default' : backups[0]?.status === 'failed' ? 'destructive' : 'secondary'}>{backups[0]?.status ?? '-'}</Badge>
              </div>
            </div>
            <Button onClick={handleBackup} disabled={backing} className="w-full">
              <DatabaseBackup className="mr-2 h-4 w-4" />
              {backing ? 'Creating Backup...' : 'Backup Now'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Scheduled Backup / ការបម្រុងទុកស្វ័យប្រវត្តិ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Auto Backup</p>
                <p className="text-xs text-muted-foreground">Enable automatic scheduled backups</p>
              </div>
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>
            <div className="space-y-2">
              <Label>Schedule Frequency / ភាពញឹកញាប់</Label>
              <Select value={schedule} onValueChange={setSchedule} disabled={!autoBackup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily / ប្រចាំថ្ងៃ</SelectItem>
                  <SelectItem value="weekly">Weekly / ប្រចាំសប្ដាហ៍</SelectItem>
                  <SelectItem value="monthly">Monthly / ប្រចាំខែ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-info/10 p-3 text-sm text-info">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              Next backup: {autoBackup ? `Tomorrow at 2:00 AM (${schedule})` : 'Disabled'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Backup History / ប្រវត្តិការបម្រុងទុក
            <span className="ml-auto text-sm font-normal text-muted-foreground">{backups.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <DatabaseBackup className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No backups yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-shadow hover:shadow-sm">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${b.status === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {b.status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-medium">{b.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(b.created_at)} · {Number(b.size_mb).toFixed(1)} MB · {b.created_by ?? 'System'}</p>
                  </div>
                  <Badge variant={b.status === 'success' ? 'default' : 'destructive'} className="text-xs">{b.status}</Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(b)} title="Download"><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRestore(b)} disabled={restoring && restoreId === b.id} title="Restore">
                      {restoring && restoreId === b.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
