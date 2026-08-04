import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '@/lib/types';

export async function logActivity(
  action: string,
  entity?: string,
  details?: string,
  userName?: string,
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
      user_id: user?.id ?? null,
      user_name: userName ?? user?.email ?? 'Unknown',
      action,
      entity: entity ?? null,
      details: details ?? null,
    } satisfies Partial<ActivityLog>);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to log activity', e);
  }
}
