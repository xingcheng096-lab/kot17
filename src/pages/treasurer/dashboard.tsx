import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HandCoins, Wallet, PiggyBank, TrendingUp, TrendingDown, ReceiptText,
  ClipboardCheck, Bell, Eye, ArrowRight, AlertTriangle, CheckCircle2,
  Clock, CalendarDays, Activity,
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
  useDonations, useExpenses, useBudgets, useApprovals, useNotifications,
  useUtilityCollections, useFoodContributions, useFoodExpenses,
} from '@/hooks/use-list';
import { computeStats, monthlySeries, categoryBreakdown } from '@/lib/stats';
import {
  DONATION_CATEGORIES, EXPENSE_CATEGORIES, formatCurrency, formatDate,
} from '@/lib/types';

export function TreasurerDashboardPage() {
  const navigate = useNavigate();
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();
  const { data: budgets } = useBudgets();
  const { data: approvals } = useApprovals();
  const { data: notifications } = useNotifications();
  const { data: utilityCollections } = useUtilityCollections();
  const { data: foodContributions } = useFoodContributions();
  const { data: foodExpenses } = useFoodExpenses();

  const [showAllNotifs, setShowAllNotifs] = useState(false);

  const stats = computeStats([], donations, expenses, utilityCollections, foodContributions, foodExpenses);
  const series = monthlySeries(donations, expenses);
  const donationByCat = categoryBreakdown(donations, DONATION_CATEGORIES);
  const expenseByCat = categoryBreakdown(expenses, EXPENSE_CATEGORIES);

  const balance = stats.totalDonations - stats.totalExpenses;
  const recentBudgets = budgets.slice(0, 6);

  const today = new Date().toISOString().slice(0, 10);
  const todayDonations = donations.filter((d) => d.donation_date === today);
  const todayExpenses = expenses.filter((e) => e.expense_date === today);
  const todayActivities = [
    ...todayDonations.map((d) => ({
      id: `d-${d.id}`, type: 'donation' as const, desc: `Donation from ${d.donor_name}`, amount: Number(d.amount), time: d.donation_date,
    })),
    ...todayExpenses.map((e) => ({
      id: `e-${e.id}`, type: 'expense' as const, desc: e.title, amount: Number(e.amount), time: e.expense_date,
    })),
  ];

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const unreadNotifs = notifications.filter((n) => !n.read);
  const displayedNotifs = showAllNotifs ? notifications.slice(0, 8) : unreadNotifs.slice(0, 4);

  const budgetWarnings = recentBudgets.filter((b) => {
    const pct = b.planned_amount > 0 ? (Number(b.actual_amount) / Number(b.planned_amount)) * 100 : 0;
    return pct >= 80;
  });

  const donationTrend = series.length >= 2
    ? ((series[series.length - 1].income - series[series.length - 2].income) / Math.max(series[series.length - 2].income, 1)) * 100
    : 0;
  const expenseTrend = series.length >= 2
    ? ((series[series.length - 1].expense - series[series.length - 2].expense) / Math.max(series[series.length - 2].expense, 1)) * 100
    : 0;

  const quickActions = [
    { label: 'Add Donation', labelKh: 'បន្ថែមការបរិច្ចាគ', icon: HandCoins, path: '/treasurer/donations', color: 'success' },
    { label: 'Add Expense', labelKh: 'បន្ថែមការចំណាយ', icon: Wallet, path: '/treasurer/expenses', color: 'destructive' },
    { label: 'Set Budget', labelKh: 'កំណត់ថវិកា', icon: PiggyBank, path: '/treasurer/budget', color: 'primary' },
    { label: 'View Reports', labelKh: 'មើលរបាយការណ៍', icon: ReceiptText, path: '/treasurer/reports', color: 'info' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Dashboard</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Treasurer Dashboard"
        titleKh="ផ្ទាំងហេរញ្ញិក"
        subtitle="Financial overview and management"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/treasurer/approvals')}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="ml-1.5">{pendingApprovals.length}</Badge>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('/treasurer/notifications')}>
              <Bell className="mr-2 h-4 w-4" />
              Alerts
              {unreadNotifs.length > 0 && (
                <Badge variant="destructive" className="ml-1.5">{unreadNotifs.length}</Badge>
              )}
            </Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Total Donations" titleKh="ការបរិច្ចាសរុប" value={formatCurrency(stats.totalDonations)} icon={HandCoins} accent="success" trend={Math.round(donationTrend)} trendLabel="vs last month" />
        <StatCard title="Total Expenses" titleKh="ការចំណាយសរុប" value={formatCurrency(stats.totalExpenses)} icon={Wallet} accent="destructive" trend={Math.round(expenseTrend)} trendLabel="vs last month" />
        <StatCard title="Net Balance" titleKh="សមតុល្យសរុប" value={formatCurrency(balance)} icon={PiggyBank} accent={balance >= 0 ? 'primary' : 'destructive'} />
        <StatCard title="Monthly Income" titleKh="ប្រាក់ចូលខែ" value={formatCurrency(stats.monthlyIncome)} icon={TrendingUp} accent="success" />
        <StatCard title="Monthly Expense" titleKh="ប្រាក់ចេញខែ" value={formatCurrency(stats.monthlyExpense)} icon={TrendingDown} accent="destructive" />
        <StatCard title="Utility Fund" titleKh="មូលនិធិទឹក" value={formatCurrency(stats.utilityFund)} icon={ReceiptText} accent="info" />
        <StatCard title="Food Fund" titleKh="មូលនិធិស្បៀង" value={formatCurrency(stats.dailyFoodFund)} icon={PiggyBank} accent="secondary" />
        <StatCard title="Pending Approvals" titleKh="រង់ចាំអនុម័ត" value={pendingApprovals.length} icon={ClipboardCheck} accent="warning" />
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <CardHeader><CardTitle>Income vs Expense / ប្រាក់ចូល និងប្រាក់ចេញ</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Cash Flow Area / ស្ថានភាពសាច់ប្រាក់</CardTitle></CardHeader>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Income / ប្រាក់ចូលប្រចាំខែ</CardTitle></CardHeader>
          <CardContent><BarChart data={series} dataKey="income" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Donations by Category / ការបរិច្ចាតាមប្រភេទ</CardTitle></CardHeader>
          <CardContent><PieChart data={donationByCat} donut /></CardContent>
        </Card>
      </div>

      {/* Budget Status + Today's Activities */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Budget Status / ស្ថានភាពថវិកា
              {budgetWarnings.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {budgetWarnings.length} warning{budgetWarnings.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBudgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets set</p>
            ) : (
              recentBudgets.map((b) => {
                const pct = b.planned_amount > 0 ? Math.min(100, (Number(b.actual_amount) / Number(b.planned_amount)) * 100) : 0;
                const over = Number(b.actual_amount) > Number(b.planned_amount);
                const warning = pct >= 80 && !over;
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.budget_month} — {EXPENSE_CATEGORIES[b.category]?.en ?? b.category}</span>
                      <span className={over ? 'text-destructive' : warning ? 'text-warning' : 'text-muted-foreground'}>
                        {pct.toFixed(0)}% · {formatCurrency(Number(b.actual_amount))} / {formatCurrency(Number(b.planned_amount))}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={over ? 'h-full bg-destructive' : warning ? 'h-full bg-warning' : 'h-full bg-primary'}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Today's Activities / សកម្មភាពថ្ងៃនេះ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayActivities.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No activities today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayActivities.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.type === 'donation' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {a.type === 'donation' ? <HandCoins className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.desc}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(a.time)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${a.type === 'donation' ? 'text-success' : 'text-destructive'}`}>
                      {a.type === 'donation' ? '+' : '-'}{formatCurrency(a.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications + Pending Approvals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Notifications / ការជូនដំណឹង
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => navigate('/treasurer/notifications')}>
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayedNotifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/50" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedNotifs.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-3 ${n.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'}`}>
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
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))}
                {!showAllNotifs && unreadNotifs.length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllNotifs(true)}>
                    Show more
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Pending Approvals / រង់ចាំអនុម័ត
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => navigate('/treasurer/approvals')}>
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
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.request_type} · {a.requested_by ?? 'Unknown'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(Number(a.amount))}</span>
                    <Button variant="outline" size="sm" onClick={() => navigate('/treasurer/approvals')}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Category Chart */}
      <Card>
        <CardHeader><CardTitle>Expenses by Category / ការចំណាយតាមប្រភេទ</CardTitle></CardHeader>
        <CardContent><PieChart data={expenseByCat} donut /></CardContent>
      </Card>
    </div>
  );
}
