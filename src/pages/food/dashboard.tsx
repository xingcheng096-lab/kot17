import { UtensilsCrossed, HandCoins, Wallet, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { BarChart, LineChart, PieChart } from '@/components/shared/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodContributions, useFoodExpenses } from '@/hooks/use-list';
import { formatCurrency, formatDate } from '@/lib/types';

export function FoodDashboardPage() {
  const { data: contributions } = useFoodContributions();
  const { data: expenses } = useFoodExpenses();

  const totalContrib = contributions.reduce((s, c) => s + Number(c.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalContrib - totalExpense;

  const monthlyData = (() => {
    const map = new Map<string, { contrib: number; expense: number }>();
    for (const c of contributions) {
      const key = c.contribution_date.slice(0, 7);
      const e = map.get(key) ?? { contrib: 0, expense: 0 };
      e.contrib += Number(c.amount);
      map.set(key, e);
    }
    for (const e of expenses) {
      const key = e.expense_date.slice(0, 7);
      const entry = map.get(key) ?? { contrib: 0, expense: 0 };
      entry.expense += Number(e.amount);
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([k, v]) => {
        const d = new Date(k + '-01');
        return { name: d.toLocaleString('en-US', { month: 'short' }), contrib: v.contrib, expense: v.expense };
      });
  })();

  const itemData = (() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.item, (map.get(e.item) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, value: v }));
  })();

  return (
    <div className="space-y-6">
      <PageHeader title="Food Dashboard" titleKh="ផ្ទាំងស្បៀងអាហារ" subtitle="Daily food fund overview" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Contributions" titleKh="ការបរិច្ចាសរុប" value={formatCurrency(totalContrib)} icon={HandCoins} accent="success" />
        <StatCard title="Total Expenses" titleKh="ការចំណាយសរុប" value={formatCurrency(totalExpense)} icon={Wallet} accent="destructive" />
        <StatCard title="Fund Balance" titleKh="សមតុល្យមូលនិធិ" value={formatCurrency(balance)} icon={TrendingUp} accent={balance >= 0 ? 'primary' : 'destructive'} />
        <StatCard title="Contributors" titleKh="អ្នកបរិច្ចាគ" value={new Set(contributions.map((c) => c.member_name)).size} icon={UtensilsCrossed} accent="secondary" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contributions vs Expenses / ការបរិច្ចានិងការចំណាយ</CardTitle></CardHeader>
          <CardContent>
            <LineChart
              data={monthlyData}
              dataKeys={[
                { key: 'contrib', name: 'Contributions', color: 'hsl(var(--chart-1))' },
                { key: 'expense', name: 'Expenses', color: 'hsl(var(--chart-5))' },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Contributions / ការបរិច្ចាប្រចាំខែ</CardTitle></CardHeader>
          <CardContent><BarChart data={monthlyData} dataKey="contrib" /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Expenses by Item / ការចំណាយតាមធាតុ</CardTitle></CardHeader>
        <CardContent><PieChart data={itemData} donut /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Contributions / ការបរិច្ចាថ្មីៗ</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {contributions.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{c.member_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(c.contribution_date)}</p>
              </div>
              <span className="font-semibold text-success">{formatCurrency(Number(c.amount))}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
