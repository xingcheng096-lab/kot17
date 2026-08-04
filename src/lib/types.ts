export type UserRole = 'admin' | 'treasurer' | 'utility' | 'food' | 'member';

export type MemberPosition =
  | 'me_kuti'
  | 'treasurer'
  | 'utility_officer'
  | 'food_officer'
  | 'preah_ther'
  | 'bhikkhu'
  | 'samanera'
  | 'ramachang'
  | 'old_student'
  | 'new_student';

export type MemberStatus = 'active' | 'inactive' | 'left';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

export interface Member {
  id: string;
  khmer_name: string;
  english_name: string | null;
  position: MemberPosition;
  status: MemberStatus;
  photo_url: string | null;
  phone: string | null;
  join_date: string;
  notes: string | null;
  ordination_date: string | null;
  education: string | null;
  room: string | null;
  guardian: string | null;
  school: string | null;
  grade: string | null;
  address: string | null;
  student_id: string | null;
  temple_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  currency: string;
  donation_date: string;
  category: string;
  payment_method: string;
  receipt_no: string | null;
  notes: string | null;
  approval_status: string;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  expense_date: string;
  category: string;
  payee: string | null;
  payment_method: string;
  receipt_no: string | null;
  notes: string | null;
  approval_status: string;
  invoice_url: string | null;
  budget_month: string | null;
  created_at: string;
}

export interface UtilityCollection {
  id: string;
  member_id: string | null;
  member_name: string;
  month: string;
  electricity_kwh: number;
  water_m3: number;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface UtilityBill {
  id: string;
  bill_month: string;
  utility_type: 'electricity' | 'water';
  provider: string | null;
  amount: number;
  usage: number;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface FoodContribution {
  id: string;
  member_id: string | null;
  member_name: string;
  contribution_date: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface FoodExpense {
  id: string;
  expense_date: string;
  item: string;
  amount: number;
  quantity: number;
  vendor: string | null;
  notes: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  budget_month: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  notes: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'members' | 'officers';
  pinned: boolean;
  author_name: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity: string | null;
  details: string | null;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  size_mb: number;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  severity: string;
  read: boolean;
  created_at: string;
}

export const POSITION_LABELS: Record<MemberPosition, { en: string; kh: string }> = {
  me_kuti: { en: 'Abbot (Me Kuti)', kh: 'មេកុដិ' },
  treasurer: { en: 'Treasurer', kh: 'ហេរញ្ញិក' },
  utility_officer: { en: 'Water & Electricity Officer', kh: 'មន្ត្រីទឹក និងអគ្គិសនី' },
  food_officer: { en: 'Daily Food Officer', kh: 'មន្ត្រីស្បៀងអាហារប្រចាំថ្ងៃ' },
  preah_ther: { en: 'Senior Monk (Preah Ther)', kh: 'ព្រះថេរ' },
  bhikkhu: { en: 'Bhikkhu (Monk)', kh: 'ភិក្ខុ' },
  samanera: { en: 'Samanera (Novice)', kh: 'សមណេរ' },
  ramachang: { en: 'Ramachang', kh: 'រាមច្បង' },
  old_student: { en: 'Senior Student', kh: 'សិស្សចាស់' },
  new_student: { en: 'New Student', kh: 'សិស្សថ្មី' },
};

export const ROLE_LABELS: Record<UserRole, { en: string; kh: string }> = {
  admin: { en: 'Administrator', kh: 'មេកុដិ' },
  treasurer: { en: 'Treasurer', kh: 'ហេរញ្ញិក' },
  utility: { en: 'Water & Electricity Officer', kh: 'មន្ត្រីទឹក និងអគ្គិសនី' },
  food: { en: 'Daily Food Officer', kh: 'មន្ត្រីស្បៀងអាហារប្រចាំថ្ងៃ' },
  member: { en: 'Member', kh: 'សមាជិក' },
};

export const DONATION_CATEGORIES: Record<string, { en: string; kh: string }> = {
  general: { en: 'General', kh: 'ទូទៅ' },
  utility: { en: 'Utility', kh: 'ទឹក និងអគ្គិសនី' },
  food: { en: 'Food', kh: 'ស្បៀងអាហារ' },
  construction: { en: 'Construction', kh: 'ការកសាង' },
  ceremony: { en: 'Ceremony', kh: 'ពិធីបុណ្យ' },
};

export const EXPENSE_CATEGORIES: Record<string, { en: string; kh: string }> = {
  general: { en: 'General', kh: 'ទូទៅ' },
  temple_maintenance: { en: 'Temple Maintenance', kh: 'ការជួសជុលវត្ត' },
  electricity: { en: 'Electricity', kh: 'អគ្គិសនី' },
  water: { en: 'Water', kh: 'ទឹក' },
  food: { en: 'Food', kh: 'ស្បៀងអាហារ' },
  medicine: { en: 'Medicine', kh: 'ឱសថ' },
  construction: { en: 'Construction', kh: 'ការកសាង' },
  ceremony: { en: 'Ceremony', kh: 'ពិធីបុណ្យ' },
  education: { en: 'Education', kh: 'ការអប់រំ' },
  transportation: { en: 'Transportation', kh: 'ការធ្វើដំណើរ' },
  salary: { en: 'Salary', kh: 'ប្រាក់ខែ' },
  other: { en: 'Other', kh: 'ផ្សេងទៀត' },
};

export const PAYMENT_METHODS: Record<string, { en: string; kh: string }> = {
  cash: { en: 'Cash', kh: 'សាច់ប្រាក់' },
  transfer: { en: 'Transfer', kh: 'ផ្ទេលប្រាក់' },
  cheque: { en: 'Cheque', kh: 'អាប៉ាង់' },
  card: { en: 'Card', kh: 'កាត' },
  other: { en: 'Other', kh: 'ផ្សេងទៀត' },
};

export const APPROVAL_STATUS: Record<string, { en: string; kh: string; color: string }> = {
  pending: { en: 'Pending', kh: 'រង់ចាំ', color: 'warning' },
  approved: { en: 'Approved', kh: 'អនុម័ត', color: 'success' },
  rejected: { en: 'Rejected', kh: 'បដិសេធ', color: 'destructive' },
};

export interface Approval {
  id: string;
  request_type: string;
  reference_id: string | null;
  title: string;
  amount: number;
  category: string | null;
  requested_by: string | null;
  status: string;
  reviewer_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  severity: string;
  read: boolean;
  reference_id: string | null;
  created_at: string;
}

export const MONTHS_KH = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

export const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return month;
  return `${MONTHS_EN[idx]} ${year}`;
}

export function formatMonthLabelKh(month: string): string {
  const [year, m] = month.split('-');
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return month;
  return `${MONTHS_KH[idx]} ${year}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Re-export from export module for convenience
export { exportToCSV, printArea } from '@/lib/export';
