/*
# KOT 17 Smart Administrative & Financial Management System — Schema

## Purpose
Digitizes administration of Kuti No. 17 (Kot 17) at Wat Botumvatey Rajavararam, Cambodia.
Covers: member management, donations, expenses, utility (water/electricity) funds,
daily food funds, financial reports, announcements, activity logs, and role-based access.

## 1. New Tables

### profiles
- Extends auth.users. Stores the app user's role, display name, avatar, and status.
- `id` (uuid, PK, references auth.users ON DELETE CASCADE)
- `full_name` (text, not null) — display name
- `role` (text, not null) — one of: admin, treasurer, utility, food, member
- `avatar_url` (text, nullable)
- `status` (text, default 'active') — active | inactive
- `created_at` (timestamptz, default now())

### members
- Members of the kuti (monks, students, officers). Managed by admin.
- `id` (uuid, PK)
- `khmer_name` (text, not null)
- `english_name` (text, nullable)
- `position` (text, not null) — one of: me_kuti, treasurer, utility_officer, food_officer, preah_ther, bhikkhu, samanera, ramachang, old_student, new_student
- `status` (text, default 'active') — active | inactive | left
- `photo_url` (text, nullable)
- `phone` (text, nullable)
- `join_date` (date, not null)
- `notes` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

### donations
- Monetary donations received by the kuti.
- `id` (uuid, PK)
- `donor_name` (text, not null)
- `amount` (numeric(14,2), not null)
- `currency` (text, default 'USD')
- `donation_date` (date, not null)
- `category` (text, default 'general') — general | utility | food | construction | ceremony
- `payment_method` (text, default 'cash') — cash | transfer | other
- `receipt_no` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### expenses
- General expenses paid from kuti funds.
- `id` (uuid, PK)
- `title` (text, not null)
- `amount` (numeric(14,2), not null)
- `currency` (text, default 'USD')
- `expense_date` (date, not null)
- `category` (text, default 'general') — general | utility | food | construction | ceremony | salary
- `payee` (text, nullable)
- `payment_method` (text, default 'cash')
- `receipt_no` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### utility_collections
- Monthly water & electricity collections from members.
- `id` (uuid, PK)
- `member_id` (uuid, references members ON DELETE SET NULL, nullable)
- `member_name` (text, not null)
- `month` (text, not null) — e.g. '2025-07'
- `electricity_kwh` (numeric(10,2), default 0)
- `water_m3` (numeric(10,2), default 0)
- `amount` (numeric(14,2), not null)
- `paid` (boolean, default false)
- `paid_date` (date, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### utility_bills
- Monthly utility bills received from the utility provider.
- `id` (uuid, PK)
- `bill_month` (text, not null) — e.g. '2025-07'
- `utility_type` (text, not null) — electricity | water
- `provider` (text, nullable)
- `amount` (numeric(14,2), not null)
- `usage` (numeric(10,2), default 0)
- `due_date` (date, nullable)
- `paid` (boolean, default false)
- `paid_date` (date, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### food_contributions
- Daily food fund contributions.
- `id` (uuid, PK)
- `member_id` (uuid, references members ON DELETE SET NULL, nullable)
- `member_name` (text, not null)
- `contribution_date` (date, not null)
- `amount` (numeric(14,2), not null)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### food_expenses
- Daily food fund expenses.
- `id` (uuid, PK)
- `expense_date` (date, not null)
- `item` (text, not null)
- `amount` (numeric(14,2), not null)
- `quantity` (numeric(10,2), default 1)
- `vendor` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### budgets
- Monthly budget allocations per category.
- `id` (uuid, PK)
- `budget_month` (text, not null) — e.g. '2025-07'
- `category` (text, not null)
- `planned_amount` (numeric(14,2), not null)
- `actual_amount` (numeric(14,2), default 0)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### announcements
- Announcements visible to members.
- `id` (uuid, PK)
- `title` (text, not null)
- `body` (text, not null)
- `audience` (text, default 'all') — all | members | officers
- `pinned` (boolean, default false)
- `author_name` (text, nullable)
- `created_at` (timestamptz)

### activity_logs
- Audit trail of user actions.
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users ON DELETE SET NULL, nullable)
- `user_name` (text, nullable)
- `action` (text, not null)
- `entity` (text, nullable)
- `details` (text, nullable)
- `created_at` (timestamptz, default now())

### app_settings
- Single-row system settings (key/value).
- `id` (uuid, PK)
- `key` (text, unique, not null)
- `value` (text, nullable)
- `updated_at` (timestamptz, default now())

## 2. Security (RLS)

This app HAS a sign-in screen with role-based access. All tables enable RLS.
- profiles: each authenticated user reads/updates their own profile; admins manage all.
- All operational tables (members, donations, expenses, utility_*, food_*, budgets,
  announcements, activity_logs, app_settings): authenticated users can read;
  admin & relevant officer roles can insert/update/delete.
- Ownership is enforced via `auth.uid()` for profiles; role checks use a helper
  that reads the requesting user's role from `profiles`.

## 3. Helper function

`current_user_role()` returns the role of the authenticated user from profiles,
or NULL if unauthenticated. Used by RLS policies to gate officer/admin actions.

## 4. Notes

- All numeric money columns use numeric(14,2).
- Timestamps default to now() in timestamptz.
- Idempotent: uses IF NOT EXISTS / DROP POLICY IF EXISTS so re-runs are safe.
*/

-- ============ profiles (must exist before the role helper) ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  avatar_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: role of the current authenticated user (SECURITY DEFINER so it can read profiles)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "select_profiles" ON public.profiles;
CREATE POLICY "select_profiles" ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles" ON public.profiles FOR UPDATE
  TO authenticated USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;
CREATE POLICY "admin_delete_profiles" ON public.profiles FOR DELETE
  TO authenticated USING (public.current_user_role() = 'admin');

-- ============ members ============
CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  khmer_name text NOT NULL,
  english_name text,
  position text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  photo_url text,
  phone text,
  join_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_members" ON public.members;
CREATE POLICY "select_members" ON public.members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_members" ON public.members;
CREATE POLICY "admin_insert_members" ON public.members FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility','food'));

DROP POLICY IF EXISTS "admin_update_members" ON public.members;
CREATE POLICY "admin_update_members" ON public.members FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','utility','food')) WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility','food'));

DROP POLICY IF EXISTS "admin_delete_members" ON public.members;
CREATE POLICY "admin_delete_members" ON public.members FOR DELETE
  TO authenticated USING (public.current_user_role() = 'admin');

-- ============ donations ============
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  donation_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'general',
  payment_method text NOT NULL DEFAULT 'cash',
  receipt_no text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_donations" ON public.donations;
CREATE POLICY "select_donations" ON public.donations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "treasurer_insert_donations" ON public.donations;
CREATE POLICY "treasurer_insert_donations" ON public.donations FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer'));

DROP POLICY IF EXISTS "treasurer_update_donations" ON public.donations;
CREATE POLICY "treasurer_update_donations" ON public.donations FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer')) WITH CHECK (public.current_user_role() IN ('admin','treasurer'));

DROP POLICY IF EXISTS "treasurer_delete_donations" ON public.donations;
CREATE POLICY "treasurer_delete_donations" ON public.donations FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer'));

-- ============ expenses ============
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'general',
  payee text,
  payment_method text NOT NULL DEFAULT 'cash',
  receipt_no text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_expenses" ON public.expenses;
CREATE POLICY "select_expenses" ON public.expenses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "treasurer_insert_expenses" ON public.expenses;
CREATE POLICY "treasurer_insert_expenses" ON public.expenses FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility','food'));

DROP POLICY IF EXISTS "treasurer_update_expenses" ON public.expenses;
CREATE POLICY "treasurer_update_expenses" ON public.expenses FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','utility','food')) WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility','food'));

DROP POLICY IF EXISTS "treasurer_delete_expenses" ON public.expenses;
CREATE POLICY "treasurer_delete_expenses" ON public.expenses FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer'));

-- ============ utility_collections ============
CREATE TABLE IF NOT EXISTS public.utility_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  member_name text NOT NULL,
  month text NOT NULL,
  electricity_kwh numeric(10,2) NOT NULL DEFAULT 0,
  water_m3 numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  paid_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.utility_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_utility_collections" ON public.utility_collections;
CREATE POLICY "select_utility_collections" ON public.utility_collections FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "officer_insert_utility_collections" ON public.utility_collections;
CREATE POLICY "officer_insert_utility_collections" ON public.utility_collections FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility'));

DROP POLICY IF EXISTS "officer_update_utility_collections" ON public.utility_collections;
CREATE POLICY "officer_update_utility_collections" ON public.utility_collections FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','utility')) WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility'));

DROP POLICY IF EXISTS "officer_delete_utility_collections" ON public.utility_collections;
CREATE POLICY "officer_delete_utility_collections" ON public.utility_collections FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','utility'));

-- ============ utility_bills ============
CREATE TABLE IF NOT EXISTS public.utility_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_month text NOT NULL,
  utility_type text NOT NULL,
  provider text,
  amount numeric(14,2) NOT NULL,
  usage numeric(10,2) NOT NULL DEFAULT 0,
  due_date date,
  paid boolean NOT NULL DEFAULT false,
  paid_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_utility_bills" ON public.utility_bills;
CREATE POLICY "select_utility_bills" ON public.utility_bills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "officer_insert_utility_bills" ON public.utility_bills;
CREATE POLICY "officer_insert_utility_bills" ON public.utility_bills FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility'));

DROP POLICY IF EXISTS "officer_update_utility_bills" ON public.utility_bills;
CREATE POLICY "officer_update_utility_bills" ON public.utility_bills FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','utility')) WITH CHECK (public.current_user_role() IN ('admin','treasurer','utility'));

DROP POLICY IF EXISTS "officer_delete_utility_bills" ON public.utility_bills;
CREATE POLICY "officer_delete_utility_bills" ON public.utility_bills FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','utility'));

-- ============ food_contributions ============
CREATE TABLE IF NOT EXISTS public.food_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  member_name text NOT NULL,
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(14,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_food_contributions" ON public.food_contributions;
CREATE POLICY "select_food_contributions" ON public.food_contributions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "officer_insert_food_contributions" ON public.food_contributions;
CREATE POLICY "officer_insert_food_contributions" ON public.food_contributions FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer','food'));

DROP POLICY IF EXISTS "officer_update_food_contributions" ON public.food_contributions;
CREATE POLICY "officer_update_food_contributions" ON public.food_contributions FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','food')) WITH CHECK (public.current_user_role() IN ('admin','treasurer','food'));

DROP POLICY IF EXISTS "officer_delete_food_contributions" ON public.food_contributions;
CREATE POLICY "officer_delete_food_contributions" ON public.food_contributions FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','food'));

-- ============ food_expenses ============
CREATE TABLE IF NOT EXISTS public.food_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  item text NOT NULL,
  amount numeric(14,2) NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  vendor text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_food_expenses" ON public.food_expenses;
CREATE POLICY "select_food_expenses" ON public.food_expenses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "officer_insert_food_expenses" ON public.food_expenses;
CREATE POLICY "officer_insert_food_expenses" ON public.food_expenses FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer','food'));

DROP POLICY IF EXISTS "officer_update_food_expenses" ON public.food_expenses;
CREATE POLICY "officer_update_food_expenses" ON public.food_expenses FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','food')) WITH CHECK (public.current_user_role() IN ('admin','treasurer','food'));

DROP POLICY IF EXISTS "officer_delete_food_expenses" ON public.food_expenses;
CREATE POLICY "officer_delete_food_expenses" ON public.food_expenses FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer','food'));

-- ============ budgets ============
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_month text NOT NULL,
  category text NOT NULL,
  planned_amount numeric(14,2) NOT NULL,
  actual_amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_budgets" ON public.budgets;
CREATE POLICY "select_budgets" ON public.budgets FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "treasurer_insert_budgets" ON public.budgets;
CREATE POLICY "treasurer_insert_budgets" ON public.budgets FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() IN ('admin','treasurer'));

DROP POLICY IF EXISTS "treasurer_update_budgets" ON public.budgets;
CREATE POLICY "treasurer_update_budgets" ON public.budgets FOR UPDATE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer')) WITH CHECK (public.current_user_role() IN ('admin','treasurer'));

DROP POLICY IF EXISTS "treasurer_delete_budgets" ON public.budgets;
CREATE POLICY "treasurer_delete_budgets" ON public.budgets FOR DELETE
  TO authenticated USING (public.current_user_role() IN ('admin','treasurer'));

-- ============ announcements ============
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  pinned boolean NOT NULL DEFAULT false,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_announcements" ON public.announcements;
CREATE POLICY "select_announcements" ON public.announcements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_announcements" ON public.announcements;
CREATE POLICY "admin_insert_announcements" ON public.announcements FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_update_announcements" ON public.announcements;
CREATE POLICY "admin_update_announcements" ON public.announcements FOR UPDATE
  TO authenticated USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_delete_announcements" ON public.announcements;
CREATE POLICY "admin_delete_announcements" ON public.announcements FOR DELETE
  TO authenticated USING (public.current_user_role() = 'admin');

-- ============ activity_logs ============
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL,
  entity text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_activity_logs" ON public.activity_logs;
CREATE POLICY "select_activity_logs" ON public.activity_logs FOR SELECT
  TO authenticated USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "insert_activity_logs" ON public.activity_logs;
CREATE POLICY "insert_activity_logs" ON public.activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ app_settings ============
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_app_settings" ON public.app_settings;
CREATE POLICY "select_app_settings" ON public.app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_app_settings" ON public.app_settings;
CREATE POLICY "admin_update_app_settings" ON public.app_settings FOR UPDATE
  TO authenticated USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_insert_app_settings" ON public.app_settings;
CREATE POLICY "admin_insert_app_settings" ON public.app_settings FOR INSERT
  TO authenticated WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_delete_app_settings" ON public.app_settings;
CREATE POLICY "admin_delete_app_settings" ON public.app_settings FOR DELETE
  TO authenticated USING (public.current_user_role() = 'admin');

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_members_position ON public.members(position);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_category ON public.donations(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_utility_collections_month ON public.utility_collections(month);
CREATE INDEX IF NOT EXISTS idx_utility_bills_month ON public.utility_bills(bill_month);
CREATE INDEX IF NOT EXISTS idx_food_contributions_date ON public.food_contributions(contribution_date);
CREATE INDEX IF NOT EXISTS idx_food_expenses_date ON public.food_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON public.budgets(budget_month);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);
