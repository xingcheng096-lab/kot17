import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Member,
  Donation,
  Expense,
  UtilityCollection,
  UtilityBill,
  FoodContribution,
  FoodExpense,
  Budget,
  Announcement,
  ActivityLog,
  Profile,
  AppSetting,
  Approval,
  Notification,
  BackupRecord,
  AdminNotification,
} from '@/lib/types';

/**
 * Generic list fetcher with simple loading/error state.
 */
export function useList<T>(
  table: string,
  deps: unknown[] = [],
  opts: { order?: { column: string; ascending?: boolean }; select?: string } = {},
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let q = supabase.from(table).select(opts.select ?? '*');
      if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? false });
      const { data: rows, error: err } = await q;
      if (!active) return;
      if (err) setError(err.message);
      else setData((rows ?? []) as T[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}

export const useMembers = () => useList<Member>('members', [], { order: { column: 'created_at' } });
export const useDonations = () =>
  useList<Donation>('donations', [], { order: { column: 'donation_date' } });
export const useExpenses = () =>
  useList<Expense>('expenses', [], { order: { column: 'expense_date' } });
export const useUtilityCollections = () =>
  useList<UtilityCollection>('utility_collections', [], { order: { column: 'month' } });
export const useUtilityBills = () =>
  useList<UtilityBill>('utility_bills', [], { order: { column: 'bill_month' } });
export const useFoodContributions = () =>
  useList<FoodContribution>('food_contributions', [], { order: { column: 'contribution_date' } });
export const useFoodExpenses = () =>
  useList<FoodExpense>('food_expenses', [], { order: { column: 'expense_date' } });
export const useBudgets = () => useList<Budget>('budgets', [], { order: { column: 'budget_month' } });
export const useAnnouncements = () =>
  useList<Announcement>('announcements', [], { order: { column: 'created_at' } });
export const useActivityLogs = () =>
  useList<ActivityLog>('activity_logs', [], { order: { column: 'created_at' } });
export const useProfiles = () => useList<Profile>('profiles', [], { order: { column: 'created_at' } });
export const useSettings = () => useList<AppSetting>('app_settings', [], { order: { column: 'key', ascending: true } });
export const useApprovals = () => useList<Approval>('approvals', [], { order: { column: 'created_at' } });
export const useNotifications = () => useList<Notification>('notifications', [], { order: { column: 'created_at' } });
export const useBackupHistory = () => useList<BackupRecord>('backup_history', [], { order: { column: 'created_at' } });
export const useAdminNotifications = () => useList<AdminNotification>('admin_notifications', [], { order: { column: 'created_at' } });
