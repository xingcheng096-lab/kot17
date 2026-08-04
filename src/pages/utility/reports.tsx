import { BarChart3, Download, Printer } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, PieChart } from '@/components/shared/charts';
import { useUtilityCollections, useUtilityBills } from '@/hooks/use-list';
import { formatCurrency, formatMonthLabel, exportToCSV, printArea } from '@/lib/types';
import { toast } from 'sonner';

export function UtilityReportsPage() {
  const { data: collections } = useUtilityCollections();
  const { data: bills } = useUtilityBills();

  const totalCollected = collections.reduce((s, c) => s + Number(c.amount), 0);
  const totalBills = bills.reduce((s, b) => s + Number(b.amount), 0);
  const netUtility = totalCollected - totalBills;

  const monthlyData = (() => {
    const map = new Map<string, { collected: number; bills: number }>();
    for (const c of collections) {
      const e = map.get(c.month) ?? { collected: 0, bills: 0 };
      e.collected += Number(c.amount);
      map.set(c.month, e);
    }
    for (const b of bills) {
      const e = map.get(b.bill_month) ?? { collected: 0, bills: 0 };
      e.bills += Number(b.amount);
      map.set(b.bill_month, e);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([k, v]) => ({ name: formatMonthLabel(k).split(' ')[0], collected: v.collected, bills: v.bills }));
  })();

  const typeData = (() => {
    const map = new Map<string, number>();
    for (const b of bills) {
      map.set(b.utility_type, (map.get(b.utility_type) ?? 0) + Number(b.amount));
    }
    return Array.from(map.entries()).map(([k, v]) => ({
      name: k === 'electricity' ? 'Electricity' : 'Water',
      value: v,
    }));
  })();

  const handleExport = () => {
    exportToCSV('kot17_utility_report', monthlyData.map((d) => ({
      Month: d.name, Collected: d.collected, Bills: d.bills, Net: d.collected - d.bills,
    })));
    toast.success('Report exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utility Reports"
        titleKh="របាយការណ៍ទឹក និងអគ្គិសនី"
        subtitle="Water & electricity financial reports"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" onClick={printArea}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(totalCollected)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Bills</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(totalBills)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Net Utility</p>
          <p className={`mt-1 text-2xl font-bold ${netUtility >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(netUtility)}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Monthly Collected vs Bills</CardTitle></CardHeader>
          <CardContent><BarChart data={monthlyData} dataKey="collected" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bills by Type / វិក្កយបត្រតាមប្រភេទ</CardTitle></CardHeader>
          <CardContent><PieChart data={typeData} donut /></CardContent>
        </Card>
      </div>
    </div>
  );
}
