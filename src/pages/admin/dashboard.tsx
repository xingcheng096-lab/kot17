import { useNavigate } from 'react-router-dom';
import {
  Users, UserRound, GraduationCap, HandCoins, Wallet, TrendingUp,
  Zap, UtensilsCrossed, ClipboardCheck, Bell, ArrowRight, Activity, CheckCircle2,
  Clock, Network, ShieldCheck, DatabaseBackup, FileText, Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { BarChart, LineChart, PieChart, AreaChart } from '@/components/shared/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  useMembers, useDonations, useExpenses, useUtilityCollections,
  useFoodContributions, useFoodExpenses, useAnnouncements,
  useActivityLogs, useApprovals, useAdminNotifications,
} from '@/hooks/use-list';
import { computeStats, monthlySeries, categoryBreakdown } from '@/lib/stats';
import {
  DONATION_CATEGORIES, EXPENSE_CATEGORIES, formatCurrency,
  formatDateTime, POSITION_LABELS,
} from '@/lib/types';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: members } = useMembers();
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();
  const { data: utilityCollections } = useUtilityCollections();
  const { data: foodContributions } = useFoodContributions();
  const { data: foodExpenses } = useFoodExpenses();
  const { data: announcements } = useAnnouncements();
  const { data: logs } = useActivityLogs();
  const { data: approvals } = useApprovals();
  const { data: adminNotifs } = useAdminNotifications();

  const stats = computeStats(members, donations, expenses, utilityCollections, foodContributions, foodExpenses);
  const series = monthlySeries(donations, expenses);
  const donationByCat = categoryBreakdown(donations, DONATION_CATEGORIES);
  const expenseByCat = categoryBreakdown(expenses, EXPENSE_CATEGORIES);
  const balance = stats.totalDonations - stats.totalExpenses;

  const recentLogs = logs.slice(0, 6);
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const unreadNotifs = adminNotifs.filter((n) => !n.read).slice(0, 5);
  const recentMembers = [...members].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const pinnedAnnouncements = announcements.filter((a) => a.pinned).slice(0, 3);

  const monkPositions = ['me_kuti', 'preah_ther', 'bhikkhu', 'samanera'];
  const studentPositions = ['ramachang', 'old_student', 'new_student'];
  const totalMonks = members.filter((m) => monkPositions.includes(m.position)).length;
  const totalStudents = members.filter((m) => studentPositions.includes(m.position)).length;
  const activeMembers = members.filter((m) => m.status === 'active').length;

  const quickActions = [
    { label: 'Manage Members', labelKh: 'គ្រប់គ្រងសមាជិក', icon: Users, path: '/admin/members', color: 'primary' },
    { label: 'Organization', labelKh: 'រចនាសម្ព័ន្ធ', icon: Network, path: '/admin/organization', color: 'info' },
    { label: 'User Management', labelKh: 'អ្នកប្រើ', icon: ShieldCheck, path: '/admin/users', color: 'secondary' },
    { label: 'Activity Logs', labelKh: 'កំណត់ហេតុ', icon: FileText, path: '/admin/logs', color: 'warning' },
    { label: 'Settings', labelKh: 'ការកំណត់', icon: Settings, path: '/admin/settings', color: 'success' },
    { label: 'Backup', labelKh: 'បម្រុងទុក', icon: DatabaseBackup, path: '/admin/backup', color: 'destructive' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Dashboard</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Administrator Dashboard"
        titleKh="ផ្ទាំងអ្នកគ្រប់គ្រង"
        subtitle="System overview and management controls"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/admin/notifications')}>
              <Bell className="mr-2 h-4 w-4" />
              Alerts
              {unreadNotifs.length > 0 && <Badge variant="destructive" className="ml-1.5">{unreadNotifs.length}</Badge>}
            </Button>
            <Button onClick={() => navigate('/admin/members')}>
              <Users className="mr-2 h-4 w-4" />Manage Members
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Total Members" titleKh="សមាជិកសរុប" value={stats.totalMembers} icon={Users} accent="primary" trend={activeMembers > 0 ? Math.round((activeMembers / Math.max(stats.totalMembers, 1)) * 100) : 0} trendLabel="active" />
        <StatCard title="Total Monks" titleKh="ព្រះសង្ឃសរុប" value={totalMonks} icon={UserRound} accent="secondary" />
        <StatCard title="Total Students" titleKh="សិស្សសរុប" value={totalStudents} icon={GraduationCap} accent="info" />
        <StatCard title="Current Balance" titleKh="សមតុល្យបច្ចុប្បន្ន" value={formatCurrency(balance)} icon={TrendingUp} accent={balance >= 0 ? 'success' : 'destructive'} />
        <StatCard title="Total Donations" titleKh="ការបរិច្ចាសរុប" value={formatCurrency(stats.totalDonations)} icon={HandCoins} accent="success" />
        <StatCard title="Total Expenses" titleKh="ការចំណាយសរុប" value={formatCurrency(stats.totalExpenses)} icon={Wallet} accent="destructive" />
        <StatCard title="Utility Fund" titleKh="មូលនិធិទឹក និងអគ្គិសនី" value={formatCurrency(stats.utilityFund)} icon={Zap} accent="info" />
        <StatCard title="Daily Food Fund" titleKh="មូលនិធិស្បៀងអាហារ" value={formatCurrency(stats.dailyFoodFund)} icon={UtensilsCrossed} accent="secondary" />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions / សកម្មភាពរហ័ស
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${a.color}/10 text-${a.color} transition-transform group-hover:scale-110`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
                <span className="font-khmer text-xs text-muted-foreground">{a.labelKh}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense / ប្រាក់ចូល និងប្រាក់ចេញ</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={series}
              dataKeys={[
                { key: 'income', name: 'Income', color: 'hsl(var(--chart-1))' },
                { key: 'expense', name: 'Expense', color: 'hsl(var(--chart-5))' },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Area / ស្ថានភាពសាច់ប្រាក់</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={series}
              dataKeys={[
                { key: 'income', name: 'Income', color: 'hsl(var(--chart-1))' },
                { key: 'expense', name: 'Expense', color: 'hsl(var(--chart-5))' },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Monthly Income / ប្រាក់ចូលប្រចាំខែ</CardTitle></CardHeader>
          <CardContent><BarChart data={series} dataKey="income" /></CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Donations by Category / ការបរិច្ចាតាមប្រភេទ</CardTitle></CardHeader>
          <CardContent><PieChart data={donationByCat} donut /></CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Expenses by Category / ការចំណាយតាមប្រភេទ</CardTitle></CardHeader>
          <CardContent><PieChart data={expenseByCat} donut /></CardContent>
        </Card>
      </div>

      {/* Recent Activities + Pending Approvals + Notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activities / សកម្មភាពថ្មីៗ
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => navigate('/admin/logs')}>
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-2.5">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{log.user_name ?? 'Unknown'} · {formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Pending Approvals / រង់ចាំអនុម័ត
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => navigate('/admin/notifications')}>
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/50" />
                <p className="text-sm text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.requested_by ?? '-'}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(Number(a.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications / ការជូនដំណឹង
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => navigate('/admin/notifications')}>
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unreadNotifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/50" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unreadNotifs.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-2.5 ${n.read ? 'border-border' : 'border-primary/20 bg-primary/5'}`}>
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      n.severity === 'error' ? 'bg-destructive/10 text-destructive' :
                      n.severity === 'warning' ? 'bg-warning/10 text-warning' :
                      n.severity === 'success' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'
                    }`}>
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Members + Announcements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Members / សមាជិកថ្មីៗ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet</p>
            ) : (
              recentMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-khmer text-xs font-semibold text-primary">
                    {m.khmer_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-khmer truncate text-sm font-medium">{m.khmer_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{POSITION_LABELS[m.position]?.en}</p>
                  </div>
                  <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Announcements / ការប្រកាស
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pinnedAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pinned announcements</p>
            ) : (
              pinnedAnnouncements.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
