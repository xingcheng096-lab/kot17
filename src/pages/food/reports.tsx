import { BarChart3, Download, Printer } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart } from '@/components/shared/charts';
import { useFoodContributions, useFoodExpenses } from '@/hooks/use-list';
import { formatCurrency, exportToCSV, printArea } from '@/lib/types';
import { toast } from 'sonner';

export function FoodReportsPage() {
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
      .slice(-12)
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

  const handleExport = () => {
    exportToCSV('kot17_food_report', monthlyData.map((d) => ({
      Month: d.name, Contributions: d.contrib, Expenses: d.expense, Net: d.contrib - d.expense,
    })));
    toast.success('Report exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Reports"
        titleKh="របាយការណ៍ស្បៀងអាហារ"
        subtitle="Monthly food fund reports"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Contributions</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(totalContrib)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Fund Balance</p>
          <p className={`mt-1 text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(balance)}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Monthly Trend</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Expenses by Item / ការចំណាយតាមធាតុ</CardTitle></CardHeader>
          <CardContent><PieChart data={itemData} donut /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Contributions / ការបរិច្ចាប្រចាំខែ</CardTitle></CardHeader>
          <CardContent><BarChart data={monthlyData} dataKey="contrib" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Expenses / ការចំណាយប្រចាំខែ</CardTitle></CardHeader>
          <CardContent><BarChart data={monthlyData} dataKey="expense" /></CardContent>
        </Card>
      </div>
    </div>
  );
}
