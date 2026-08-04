import { useState, useMemo } from 'react';
import {
  BarChart3, Download, Printer, FileText, TrendingUp, TrendingDown,
  Calendar, FileSpreadsheet, FileBarChart,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, LineChart, PieChart, AreaChart } from '@/components/shared/charts';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDonations, useExpenses } from '@/hooks/use-list';
import { monthlySeries, categoryBreakdown } from '@/lib/stats';
import {
  DONATION_CATEGORIES, EXPENSE_CATEGORIES, formatCurrency,
  exportToCSV, printArea,
} from '@/lib/types';
import { toast } from 'sonner';

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';
type ReportType = 'income' | 'expense' | 'donation' | 'summary';

const QUARTERS = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

export function TreasurerReportsPage() {
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [reportType, setReportType] = useState<ReportType>('summary');

  const series = monthlySeries(donations, expenses, 12);
  const donationByCat = categoryBreakdown(donations, DONATION_CATEGORIES);
  const expenseByCat = categoryBreakdown(expenses, EXPENSE_CATEGORIES);

  const totalIncome = donations.reduce((s, d) => s + Number(d.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const quarterlyData = useMemo(() => {
    const quarters = [0, 0, 0, 0];
    const quartersExp = [0, 0, 0, 0];
    donations.forEach((d) => {
      const m = new Date(d.donation_date).getMonth();
      quarters[Math.floor(m / 3)] += Number(d.amount);
    });
    expenses.forEach((e) => {
      const m = new Date(e.expense_date).getMonth();
      quartersExp[Math.floor(m / 3)] += Number(e.amount);
    });
    return QUARTERS.map((name, i) => ({ name, income: quarters[i], expense: quartersExp[i] }));
  }, [donations, expenses]);

  const yearlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    donations.forEach((d) => {
      const y = d.donation_date.slice(0, 4);
      if (!map.has(y)) map.set(y, { income: 0, expense: 0 });
      map.get(y)!.income += Number(d.amount);
    });
    expenses.forEach((e) => {
      const y = e.expense_date.slice(0, 4);
      if (!map.has(y)) map.set(y, { income: 0, expense: 0 });
      map.get(y)!.expense += Number(e.amount);
    });
    return Array.from(map.entries()).sort().map(([name, v]) => ({ name, ...v }));
  }, [donations, expenses]);

  const chartData = period === 'quarterly' ? quarterlyData : period === 'yearly' ? yearlyData : series;

  const handleExportCSV = () => {
    const rows = chartData.map((d) => ({
      Period: d.name, Income: ('income' in d ? d.income : 0) as number, Expense: ('expense' in d ? d.expense : 0) as number,
    }));
    exportToCSV(`kot17_${reportType}_report`, rows);
    toast.success('Report exported to CSV');
  };

  const handleExportExcel = () => {
    exportToCSV(`kot17_${reportType}_report_excel`, chartData.map((d) => ({
      Period: d.name, Income: ('income' in d ? d.income : 0) as number, Expense: ('expense' in d ? d.expense : 0) as number,
    })));
    toast.success('Report exported to Excel (CSV)');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Financial Reports"
        titleKh="របាយការណ៍ហិរញ្ញវត្ថុ"
        subtitle="Generate, analyze and export financial reports"
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" onClick={handleExportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
            <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Income" titleKh="ប្រាក់ចូលសរុប" value={formatCurrency(totalIncome)} icon={TrendingUp} accent="success" />
        <StatCard title="Total Expense" titleKh="ប្រាក់ចេញសរុប" value={formatCurrency(totalExpense)} icon={TrendingDown} accent="destructive" />
        <StatCard title="Net Balance" titleKh="សមតុល្យសរុប" value={formatCurrency(netBalance)} icon={BarChart3} accent={netBalance >= 0 ? 'primary' : 'destructive'} />
      </div>

      {/* Report Controls */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Report Type:</span>
          </div>
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary Report / សង្ខេប</SelectItem>
              <SelectItem value="income">Income Report / ប្រាក់ចូល</SelectItem>
              <SelectItem value="expense">Expense Report / ប្រាក់ចេញ</SelectItem>
              <SelectItem value="donation">Donation Report / ការបរិច្ចាគ</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Period:</span>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly / ប្រចាំខែ</SelectItem>
              <SelectItem value="quarterly">Quarterly / ត្រីមាស</SelectItem>
              <SelectItem value="yearly">Yearly / ប្រចាំឆ្នាំ</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" />
              {period === 'monthly' ? 'Monthly Trend' : period === 'quarterly' ? 'Quarterly Trend' : 'Yearly Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={chartData}
              dataKeys={[
                { key: 'income', name: 'Income', color: 'hsl(var(--chart-1))' },
                { key: 'expense', name: 'Expense', color: 'hsl(var(--chart-5))' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Trend Line / បន្ទាត់និន្នាការ</CardTitle></CardHeader>
          <CardContent>
            <LineChart
              data={chartData}
              dataKeys={[
                { key: 'income', name: 'Income', color: 'hsl(var(--chart-1))' },
                { key: 'expense', name: 'Expense', color: 'hsl(var(--chart-5))' },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Category Analysis */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Donation Analysis / ការវិភាគការបរិច្ចាគ</CardTitle></CardHeader>
          <CardContent><PieChart data={donationByCat} donut /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expense Analysis / ការវិភាគការចំណាយ</CardTitle></CardHeader>
          <CardContent><PieChart data={expenseByCat} donut /></CardContent>
        </Card>
      </div>

      {/* Monthly Bar */}
      <Card>
        <CardHeader><CardTitle>Monthly Income vs Expense / ប្រាក់ចូល និងចេញ ប្រចាំខែ</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={series}
            dataKeys={[
              { key: 'income', name: 'Income', color: 'hsl(var(--chart-1))' },
              { key: 'expense', name: 'Expense', color: 'hsl(var(--chart-5))' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Report Summary / សង្ខេបរបាយការណ៍
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 text-right font-medium">Income</th>
                  <th className="pb-2 text-right font-medium">Expense</th>
                  <th className="pb-2 text-right font-medium">Net</th>
                  <th className="pb-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, i) => {
                  const income = ('income' in d ? d.income : 0) as number;
                  const expense = ('expense' in d ? d.expense : 0) as number;
                  const net = income - expense;
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 font-medium">{d.name}</td>
                      <td className="py-2 text-right text-success">{formatCurrency(income)}</td>
                      <td className="py-2 text-right text-destructive">{formatCurrency(expense)}</td>
                      <td className={`py-2 text-right font-medium ${net >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(net)}</td>
                      <td className="py-2 text-center">
                        <Badge variant={net >= 0 ? 'default' : 'destructive'} className="text-xs">
                          {net >= 0 ? 'Surplus' : 'Deficit'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
