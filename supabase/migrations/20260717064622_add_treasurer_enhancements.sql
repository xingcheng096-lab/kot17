/*
# Treasurer Module Enhancements

1. New Tables
- `approvals` — approval requests for expenses, donations, and receipts
  - id (uuid, PK)
  - request_type (text: expense | donation | receipt)
  - reference_id (uuid, nullable) — FK to expenses/donations row
  - title (text)
  - amount (numeric)
  - category (text, nullable)
  - requested_by (text, nullable)
  - status (text: pending | approved | rejected, default pending)
  - reviewer_comment (text, nullable)
  - reviewed_by (text, nullable)
  - reviewed_at (timestamptz, nullable)
  - created_at (timestamptz, default now())
- `notifications` — financial and system notifications for treasurer
  - id (uuid, PK)
  - type (text: budget | donation | approval | receipt | system)
  - title (text)
  - body (text, nullable)
  - severity (text: info | warning | success | error, default info)
  - read (boolean, default false)
  - reference_id (uuid, nullable)
  - created_at (timestamptz, default now())

2. Modified Tables
- `expenses` — add columns: approval_status (text default 'approved'), invoice_url (text nullable), budget_month (text nullable)
- `donations` — add column: approval_status (text default 'approved')

3. Security
- Enable RLS on approvals and notifications.
- Allow anon + authenticated CRUD (app uses sign-in but treasurer/admin manage these).

4. Notes
- approval_status defaults to 'approved' so existing rows are treated as already-approved.
- New expense entries created by treasurer can be set to 'pending' for admin review.
- approvals table tracks the review workflow separately for audit.
*/

-- Add columns to expenses
DO $$ BEGIN
  ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
  ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_url text;
  ALTER TABLE expenses ADD COLUMN IF NOT EXISTS budget_month text;
END $$;

-- Add column to donations
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
END $$;

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL DEFAULT 'expense',
  reference_id uuid,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text,
  requested_by text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_comment text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_approvals" ON approvals;
CREATE POLICY "anon_select_approvals" ON approvals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_approvals" ON approvals;
CREATE POLICY "anon_insert_approvals" ON approvals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_approvals" ON approvals;
CREATE POLICY "anon_update_approvals" ON approvals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_approvals" ON approvals;
CREATE POLICY "anon_delete_approvals" ON approvals FOR DELETE
  TO anon, authenticated USING (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

-- Seed a few sample notifications
INSERT INTO notifications (type, title, body, severity, read)
VALUES
  ('budget', 'Budget Warning', 'Food category budget is at 92% utilization for this month.', 'warning', false),
  ('donation', 'Large Donation Received', 'A donation of $1,500.00 was received from Chea Sokunthea.', 'success', false),
  ('approval', 'Pending Approval', '3 expense requests are awaiting your approval.', 'info', false),
  ('receipt', 'Missing Receipt', 'Expense E-2026-004 has no receipt attached.', 'error', false)
ON CONFLICT DO NOTHING;

-- Seed a few sample approval requests
INSERT INTO approvals (request_type, title, amount, category, requested_by, status)
VALUES
  ('expense', 'Temple roof repair materials', 450.00, 'temple_maintenance', 'Treasurer Office', 'pending'),
  ('expense', 'Monthly electricity bill', 180.50, 'electricity', 'Utility Officer', 'pending'),
  ('expense', 'Medicine for elderly monk', 75.00, 'medicine', 'Abbot Office', 'pending')
ON CONFLICT DO NOTHING;
