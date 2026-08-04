import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Network,
  ShieldCheck,
  FileText,
  ScrollText,
  Settings,
  HandCoins,
  Wallet,
  PiggyBank,
  ReceiptText,
  BarChart3,
  Zap,
  UtensilsCrossed,
  UserCircle,
  Megaphone,
  History,
  ClipboardCheck,
  Bell,
  UserCog,
  UserRound,
  GraduationCap,
  DatabaseBackup,
  BellRing,
  Crown,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavItem {
  label: string;
  labelKh: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  // Admin
  {
    label: 'Dashboard',
    labelKh: 'ផ្ទាំងគ្រប់គ្រង',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'User Management',
    labelKh: 'ការគ្រប់គ្រងអ្នកប្រើ',
    path: '/admin/users',
    icon: Users,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Member Management',
    labelKh: 'ការគ្រប់គ្រងសមាជិក',
    path: '/admin/members',
    icon: Users,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Monk Management',
    labelKh: 'ការគ្រប់គ្រងព្រះសង្ឃ',
    path: '/admin/monks',
    icon: UserRound,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Student Management',
    labelKh: 'ការគ្រប់គ្រងសិស្ស',
    path: '/admin/students',
    icon: GraduationCap,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Organization Structure',
    labelKh: 'រចនាសម្ព័ន្ធអង្គភាព',
    path: '/admin/organization',
    icon: Network,
    roles: ['admin', 'member'],
    group: 'Administration',
  },
  {
    label: 'Roles & Permissions',
    labelKh: 'តួនាទី និងសិទ្ធិ',
    path: '/admin/roles',
    icon: ShieldCheck,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Administrative Records',
    labelKh: 'កំណត់ហេតុរដ្ឋបាល',
    path: '/admin/records',
    icon: FileText,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Activity Logs',
    labelKh: 'កំណត់ហេតុសកម្មភាព',
    path: '/admin/logs',
    icon: ScrollText,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'System Settings',
    labelKh: 'ការកំណត់ប្រព័ន្ធ',
    path: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Backup & Restore',
    labelKh: 'ការបម្រុងទុក និងស្តារ',
    path: '/admin/backup',
    icon: DatabaseBackup,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Notification Center',
    labelKh: 'មជ្ឈមណ្ឌលការជូនដំណឹង',
    path: '/admin/notifications',
    icon: BellRing,
    roles: ['admin'],
    group: 'Administration',
  },
  {
    label: 'Admin Profile',
    labelKh: 'ប្រវត្តិអ្នកគ្រប់គ្រង',
    path: '/admin/profile',
    icon: Crown,
    roles: ['admin'],
    group: 'Administration',
  },

  // Treasurer
  {
    label: 'Treasurer Dashboard',
    labelKh: 'ផ្ទាំងហេរញ្ញិក',
    path: '/treasurer/dashboard',
    icon: LayoutDashboard,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Donation Management',
    labelKh: 'ការគ្រប់គ្រងការបរិច្ចាគ',
    path: '/treasurer/donations',
    icon: HandCoins,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Expense Management',
    labelKh: 'ការគ្រប់គ្រងការចំណាយ',
    path: '/treasurer/expenses',
    icon: Wallet,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Budget Management',
    labelKh: 'ការគ្រប់គ្រងថវិកា',
    path: '/treasurer/budget',
    icon: PiggyBank,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Transaction History',
    labelKh: 'ប្រវត្តិប្រតិបត្តិការ',
    path: '/treasurer/transactions',
    icon: History,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Financial Reports',
    labelKh: 'របាយការណ៍ហិរញ្ញវត្ថុ',
    path: '/treasurer/reports',
    icon: BarChart3,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Receipt Management',
    labelKh: 'ការគ្រប់គ្រងវិក្កយបត្រ',
    path: '/treasurer/receipts',
    icon: ReceiptText,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Member Payments',
    labelKh: 'ការបង់ប្រាក់សមាជិក',
    path: '/treasurer/member-payments',
    icon: Users,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Approval Center',
    labelKh: 'មជ្ឈមណ្ឌលអនុម័ត',
    path: '/treasurer/approvals',
    icon: ClipboardCheck,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Notifications',
    labelKh: 'ការជូនដំណឹង',
    path: '/treasurer/notifications',
    icon: Bell,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Treasurer Profile',
    labelKh: 'ប្រវត្តិហេរញ្ញិក',
    path: '/treasurer/profile',
    icon: UserCog,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },
  {
    label: 'Settings',
    labelKh: 'ការកំណត់',
    path: '/treasurer/settings',
    icon: Settings,
    roles: ['treasurer', 'admin'],
    group: 'Treasury',
  },

  // Utility
  {
    label: 'Utility Dashboard',
    labelKh: 'ផ្ទាំងទឹក និងអគ្គិសនី',
    path: '/utility/dashboard',
    icon: LayoutDashboard,
    roles: ['utility', 'admin'],
    group: 'Water & Electricity',
  },
  {
    label: 'Utility Collection',
    labelKh: 'ការប្រមូលថ្លៃទឹក និងអគ្គិសនី',
    path: '/utility/collections',
    icon: Zap,
    roles: ['utility', 'admin'],
    group: 'Water & Electricity',
  },
  {
    label: 'Monthly Bills',
    labelKh: 'វិក្កយបត្រប្រចាំខែ',
    path: '/utility/bills',
    icon: ReceiptText,
    roles: ['utility', 'admin'],
    group: 'Water & Electricity',
  },
  {
    label: 'Payment History',
    labelKh: 'ប្រវត្តិការបង់ប្រាក់',
    path: '/utility/payments',
    icon: History,
    roles: ['utility', 'admin'],
    group: 'Water & Electricity',
  },
  {
    label: 'Utility Reports',
    labelKh: 'របាយការណ៍ទឹក និងអគ្គិសនី',
    path: '/utility/reports',
    icon: BarChart3,
    roles: ['utility', 'admin'],
    group: 'Water & Electricity',
  },

  // Food
  {
    label: 'Food Dashboard',
    labelKh: 'ផ្ទាំងស្បៀងអាហារ',
    path: '/food/dashboard',
    icon: LayoutDashboard,
    roles: ['food', 'admin'],
    group: 'Daily Food',
  },
  {
    label: 'Daily Contributions',
    labelKh: 'ការបរិច្ចាប្រចាំថ្ងៃ',
    path: '/food/contributions',
    icon: HandCoins,
    roles: ['food', 'admin'],
    group: 'Daily Food',
  },
  {
    label: 'Food Expenses',
    labelKh: 'ការចំណាយស្បៀងអាហារ',
    path: '/food/expenses',
    icon: UtensilsCrossed,
    roles: ['food', 'admin'],
    group: 'Daily Food',
  },
  {
    label: 'Food Reports',
    labelKh: 'របាយការណ៍ស្បៀងអាហារ',
    path: '/food/reports',
    icon: BarChart3,
    roles: ['food', 'admin'],
    group: 'Daily Food',
  },

  // Member
  {
    label: 'Member Dashboard',
    labelKh: 'ផ្ទាំងសមាជិក',
    path: '/member/dashboard',
    icon: LayoutDashboard,
    roles: ['member'],
    group: 'Member',
  },
  {
    label: 'Personal Profile',
    labelKh: 'ប្រវត្តិផ្ទាល់ខ្លួន',
    path: '/member/profile',
    icon: UserCircle,
    roles: ['member'],
    group: 'Member',
  },
  {
    label: 'Organization Structure',
    labelKh: 'រចនាសម្ព័ន្ធអង្គភាព',
    path: '/member/organization',
    icon: Network,
    roles: ['member'],
    group: 'Member',
  },
  {
    label: 'Announcements',
    labelKh: 'ការប្រកាស',
    path: '/member/announcements',
    icon: Megaphone,
    roles: ['member'],
    group: 'Member',
  },
];

export function getNavForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getDefaultPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'treasurer':
      return '/treasurer/dashboard';
    case 'utility':
      return '/utility/dashboard';
    case 'food':
      return '/food/dashboard';
    case 'member':
      return '/member/dashboard';
    default:
      return '/login';
  }
}
