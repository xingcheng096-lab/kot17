import { Zap, ReceiptText, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { BarChart, PieChart } from '@/components/shared/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUtilityCollections, useUtilityBills } from '@/hooks/use-list';
import { formatCurrency, formatMonthLabel } from '@/lib/types';

export function UtilityDashboardPage() {
  const { data: collections } = useUtilityCollections();
  const { data: bills } = useUtilityBills();

  const totalCollected = collections.reduce((s, c) => s + Number(c.amount), 0);
  const totalBills = bills.reduce((s, b) => s + Number(b.amount), 0);
  const paidCount = collections.filter((c) => c.paid).length;
  const unpaidCount = collections.length - paidCount;

  const monthlyData = (() => {
    const map = new Map<string, number>();
    for (const c of collections) {
      map.set(c.month, (map.get(c.month) ?? 0) + Number(c.amount));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([k, v]) => ({ name: formatMonthLabel(k).split(' ')[0], value: v }));
  })();

  const billTypeData = (() => {
    const map = new Map<string, number>();
    for (const b of bills) {
      map.set(b.utility_type, (map.get(b.utility_type) ?? 0) + Number(b.amount));
    }
    return Array.from(map.entries()).map(([k, v]) => ({
      name: k === 'electricity' ? 'Electricity / អគ្គិសនី' : 'Water / ទឹក',
      value: v,
    }));
  })();

  return (
    <div className="space-y-6">
      <PageHeader title="Utility Dashboard" titleKh="ផ្ទាំងទឹក និងអគ្គិសនី" subtitle="Water & electricity fund overview" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Collected" titleKh="បានប្រមូលសរុប" value={formatCurrency(totalCollected)} icon={Zap} accent="primary" />
        <StatCard title="Total Bills" titleKh="វិក្កយបត្រសរុប" value={formatCurrency(totalBills)} icon={ReceiptText} accent="destructive" />
        <StatCard title="Paid" titleKh="បានបង់" value={paidCount} icon={CheckCircle2} accent="success" />
        <StatCard title="Unpaid" titleKh="មិនទាន់បង់" value={unpaidCount} icon={AlertCircle} accent="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Collection / ការប្រមូលប្រចាំខែ</CardTitle></CardHeader>
          <CardContent><BarChart data={monthlyData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bills by Type / វិក្កយបត្រតាមប្រភេទ</CardTitle></CardHeader>
          <CardContent><PieChart data={billTypeData} donut /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Collections / ការប្រមូលថ្មីៗ</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {collections.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{c.member_name}</p>
                <p className="text-xs text-muted-foreground">{formatMonthLabel(c.month)} • {c.electricity_kwh}kWh / {c.water_m3}m³</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatCurrency(Number(c.amount))}</span>
                <Badge variant={c.paid ? 'default' : 'secondary'} className="text-[10px]">{c.paid ? 'Paid' : 'Unpaid'}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
