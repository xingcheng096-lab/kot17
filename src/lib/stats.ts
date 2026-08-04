import type { Donation, Expense, Member, UtilityCollection, FoodContribution, FoodExpense } from '@/lib/types';

export interface DashboardStats {
  totalMembers: number;
  totalMonks: number;
  totalStudents: number;
  totalDonations: number;
  totalExpenses: number;
  utilityFund: number;
  dailyFoodFund: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

const MONK_POSITIONS = ['me_kuti', 'preah_ther', 'bhikkhu', 'samanera'];
const STUDENT_POSITIONS = ['ramachang', 'old_student', 'new_student'];

export function computeStats(
  members: Member[],
  donations: Donation[],
  expenses: Expense[],
  utilityCollections: UtilityCollection[],
  foodContributions: FoodContribution[],
  foodExpenses: FoodExpense[],
): DashboardStats {
  const totalMembers = members.length;
  const totalMonks = members.filter((m) => MONK_POSITIONS.includes(m.position)).length;
  const totalStudents = members.filter((m) => STUDENT_POSITIONS.includes(m.position)).length;

  const totalDonations = donations.reduce((s, d) => s + Number(d.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const utilityFund = utilityCollections.reduce((s, c) => s + Number(c.amount), 0);
  const dailyFoodFund = foodContributions.reduce((s, c) => s + Number(c.amount), 0) -
    foodExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyIncome = donations
    .filter((d) => d.donation_date.startsWith(monthKey))
    .reduce((s, d) => s + Number(d.amount), 0);

  const monthlyExpense = expenses
    .filter((e) => e.expense_date.startsWith(monthKey))
    .reduce((s, e) => s + Number(e.amount), 0);

  return {
    totalMembers,
    totalMonks,
    totalStudents,
    totalDonations,
    totalExpenses,
    utilityFund,
    dailyFoodFund,
    monthlyIncome,
    monthlyExpense,
  };
}

export function monthlySeries(
  donations: Donation[],
  expenses: Expense[],
  months = 7,
): { name: string; income: number; expense: number }[] {
  const now = new Date();
  const out: { name: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    out.push({
      name: label,
      income: donations.filter((x) => x.donation_date.startsWith(key)).reduce((s, x) => s + Number(x.amount), 0),
      expense: expenses.filter((x) => x.expense_date.startsWith(key)).reduce((s, x) => s + Number(x.amount), 0),
    });
  }
  return out;
}

export function categoryBreakdown(
  rows: { category: string; amount: number }[],
  labels: Record<string, { en: string; kh: string }>,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.category, (map.get(r.category) ?? 0) + Number(r.amount));
  }
  return Array.from(map.entries()).map(([k, v]) => ({
    name: labels[k]?.en ?? k,
    value: v,
  }));
}
