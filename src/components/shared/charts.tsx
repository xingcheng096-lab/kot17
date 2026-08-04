import {
  Area,
  AreaChart as RAreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RLineChart,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/types';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface ChartDatum {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

interface BarChartProps {
  data: ChartDatum[];
  dataKey?: string;
  dataKeys?: { key: string; name?: string; color?: string }[];
  xKey?: string;
  height?: number;
  formatMoney?: boolean;
}

export function BarChart({
  data,
  dataKey = 'value',
  dataKeys,
  xKey = 'name',
  height = 280,
  formatMoney = true,
}: BarChartProps) {
  const keys = dataKeys ?? [{ key: dataKey, color: 'hsl(var(--chart-1))' }];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (formatMoney ? `${v}` : `${v}`)}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(v: number) => (formatMoney ? formatCurrency(Number(v)) : `${v}`)}
        />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {keys.map((dk, i) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.name ?? dk.key}
            fill={dk.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps {
  data: ChartDatum[];
  dataKeys?: { key: string; color?: string; name?: string }[];
  xKey?: string;
  height?: number;
  formatMoney?: boolean;
}

export function LineChart({
  data,
  dataKeys = [{ key: 'value' }],
  xKey = 'name',
  height = 280,
  formatMoney = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (formatMoney ? `$${v}` : `${v}`)}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(v: number) => (formatMoney ? formatCurrency(Number(v)) : `${v}`)}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {dataKeys.map((dk, i) => (
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name ?? dk.key}
            stroke={dk.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps {
  data: ChartDatum[];
  height?: number;
  donut?: boolean;
  formatMoney?: boolean;
}

export function PieChart({ data, height = 280, donut = false, formatMoney = true }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={donut ? 60 : 0}
          outerRadius={90}
          paddingAngle={donut ? 3 : 1}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(v: number) => (formatMoney ? formatCurrency(Number(v)) : `${v}`)}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </RPieChart>
    </ResponsiveContainer>
  );
}

export interface AreaChartProps {
  data: ChartDatum[];
  dataKeys: { key: string; name: string; color: string }[];
  height?: number;
  formatMoney?: boolean;
}

export function AreaChart({ data, dataKeys, height = 280, formatMoney = true }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAreaChart data={data}>
        <defs>
          {dataKeys.map((dk, i) => (
            <linearGradient key={dk.key} id={`areaGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(v) => (formatMoney ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(v: number) => (formatMoney ? formatCurrency(Number(v)) : `${v}`)}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {dataKeys.map((dk, i) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color}
            strokeWidth={2}
            fill={`url(#areaGradient-${i})`}
          />
        ))}
      </RAreaChart>
    </ResponsiveContainer>
  );
}
