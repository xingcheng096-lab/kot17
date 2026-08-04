/*
# Administrator Module Enhancements

1. New Tables
- `backup_history` — tracks database backup operations
  - id, filename, size_mb, status (success/failed), created_by, created_at
- `admin_notifications` — system-wide admin notifications (separate from treasurer notifications)
  - id, type (system/approval/member/financial), title, body, severity, read, created_at

2. Modified Tables
- `members` — add columns for monk/student management:
  - ordination_date (date, nullable) — for monks
  - education (text, nullable) — for monks and students
  - room (text, nullable) — for monks
  - guardian (text, nullable) — for students
  - school (text, nullable) — for students
  - grade (text, nullable) — for students
  - address (text, nullable) — for students
  - student_id (text, nullable) — for students
  - temple_id (text, nullable) — for monks

3. Security
- Enable RLS on backup_history and admin_notifications.
- Allow anon + authenticated CRUD.
*/

-- Add columns to members
DO $$ BEGIN
  ALTER TABLE members ADD COLUMN IF NOT EXISTS ordination_date date;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS education text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS room text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS guardian text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS school text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS grade text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS address text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS student_id text;
  ALTER TABLE members ADD COLUMN IF NOT EXISTS temple_id text;
END $$;

-- Create backup_history table
CREATE TABLE IF NOT EXISTS backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  size_mb numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_backup_history" ON backup_history;
CREATE POLICY "anon_select_backup_history" ON backup_history FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_backup_history" ON backup_history;
CREATE POLICY "anon_insert_backup_history" ON backup_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_backup_history" ON backup_history;
CREATE POLICY "anon_delete_backup_history" ON backup_history FOR DELETE
  TO anon, authenticated USING (true);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_admin_notifications" ON admin_notifications;
CREATE POLICY "anon_select_admin_notifications" ON admin_notifications FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_admin_notifications" ON admin_notifications;
CREATE POLICY "anon_insert_admin_notifications" ON admin_notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_admin_notifications" ON admin_notifications;
CREATE POLICY "anon_update_admin_notifications" ON admin_notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_admin_notifications" ON admin_notifications;
CREATE POLICY "anon_delete_admin_notifications" ON admin_notifications FOR DELETE
  TO anon, authenticated USING (true);

-- Seed sample admin notifications
INSERT INTO admin_notifications (type, title, body, severity, read)
VALUES
  ('system', 'System Update Complete', 'KOT 17 Management System has been updated to v1.2.0', 'success', false),
  ('approval', 'Pending Member Approval', '2 new member registrations awaiting approval', 'warning', false),
  ('member', 'New Member Joined', 'Ven. Sok Chea has joined as a Samanera', 'info', false),
  ('financial', 'Monthly Budget Alert', 'Food fund budget is at 85% utilization', 'warning', false),
  ('system', 'Backup Scheduled', 'Automatic backup is scheduled for tonight at 2:00 AM', 'info', true)
ON CONFLICT DO NOTHING;

-- Seed sample backup history
INSERT INTO backup_history (filename, size_mb, status, created_by)
VALUES
  ('kot17_backup_2026_07_16.sql', 12.5, 'success', 'System'),
  ('kot17_backup_2026_07_15.sql', 12.3, 'success', 'System'),
  ('kot17_backup_2026_07_14.sql', 12.1, 'success', 'Admin'),
  ('kot17_backup_2026_07_13.sql', 11.9, 'failed', 'System')
ON CONFLICT DO NOTHING;
