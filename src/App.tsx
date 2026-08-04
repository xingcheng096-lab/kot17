import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { getDefaultPath } from '@/lib/navigation';
import { LoginPage } from '@/pages/auth/login';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';

// Admin
import { AdminDashboardPage } from '@/pages/admin/dashboard';
import { AdminUsersPage } from '@/pages/admin/users';
import { AdminMembersPage } from '@/pages/admin/members';
import { AdminOrganizationPage } from '@/pages/admin/organization';
import { AdminRolesPage } from '@/pages/admin/roles';
import { AdminRecordsPage } from '@/pages/admin/records';
import { AdminLogsPage } from '@/pages/admin/logs';
import { AdminSettingsPage } from '@/pages/admin/settings';
import { AdminMonksPage } from '@/pages/admin/monks';
import { AdminStudentsPage } from '@/pages/admin/students';
import { AdminBackupPage } from '@/pages/admin/backup';
import { AdminNotificationsPage } from '@/pages/admin/notifications';
import { AdminProfilePage } from '@/pages/admin/profile';

// Treasurer
import { TreasurerDashboardPage } from '@/pages/treasurer/dashboard';
import { TreasurerDonationsPage } from '@/pages/treasurer/donations';
import { TreasurerExpensesPage } from '@/pages/treasurer/expenses';
import { TreasurerBudgetPage } from '@/pages/treasurer/budget';
import { TreasurerTransactionsPage } from '@/pages/treasurer/transactions';
import { TreasurerReportsPage } from '@/pages/treasurer/reports';
import { TreasurerReceiptsPage } from '@/pages/treasurer/receipts';
import { TreasurerMemberPaymentsPage } from '@/pages/treasurer/member-payments';
import { TreasurerApprovalsPage } from '@/pages/treasurer/approvals';
import { TreasurerNotificationsPage } from '@/pages/treasurer/notifications';
import { TreasurerProfilePage } from '@/pages/treasurer/profile';
import { TreasurerSettingsPage } from '@/pages/treasurer/settings';

// Utility
import { UtilityDashboardPage } from '@/pages/utility/dashboard';
import { UtilityCollectionsPage } from '@/pages/utility/collections';
import { UtilityBillsPage } from '@/pages/utility/bills';
import { UtilityPaymentsPage } from '@/pages/utility/payments';
import { UtilityReportsPage } from '@/pages/utility/reports';

// Food
import { FoodDashboardPage } from '@/pages/food/dashboard';
import { FoodContributionsPage } from '@/pages/food/contributions';
import { FoodExpensesPage } from '@/pages/food/expenses';
import { FoodReportsPage } from '@/pages/food/reports';

// Member
import { MemberDashboardPage } from '@/pages/member/dashboard';
import { MemberProfilePage } from '@/pages/member/profile';
import { MemberOrganizationPage } from '@/pages/member/organization';
import { MemberAnnouncementsPage } from '@/pages/member/announcements';

function HomeRedirect() {
  const { profile } = useAuth();
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(profile.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="organization" element={<AdminOrganizationPage />} />
                <Route path="roles" element={<AdminRolesPage />} />
                <Route path="records" element={<AdminRecordsPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="monks" element={<AdminMonksPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="backup" element={<AdminBackupPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/treasurer/*"
        element={
          <ProtectedRoute allowedRoles={['treasurer', 'admin']}>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<TreasurerDashboardPage />} />
                <Route path="donations" element={<TreasurerDonationsPage />} />
                <Route path="expenses" element={<TreasurerExpensesPage />} />
                <Route path="budget" element={<TreasurerBudgetPage />} />
                <Route path="transactions" element={<TreasurerTransactionsPage />} />
                <Route path="reports" element={<TreasurerReportsPage />} />
                <Route path="receipts" element={<TreasurerReceiptsPage />} />
                <Route path="member-payments" element={<TreasurerMemberPaymentsPage />} />
                <Route path="approvals" element={<TreasurerApprovalsPage />} />
                <Route path="notifications" element={<TreasurerNotificationsPage />} />
                <Route path="profile" element={<TreasurerProfilePage />} />
                <Route path="settings" element={<TreasurerSettingsPage />} />
                <Route path="*" element={<Navigate to="/treasurer/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/utility/*"
        element={
          <ProtectedRoute allowedRoles={['utility', 'admin']}>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<UtilityDashboardPage />} />
                <Route path="collections" element={<UtilityCollectionsPage />} />
                <Route path="bills" element={<UtilityBillsPage />} />
                <Route path="payments" element={<UtilityPaymentsPage />} />
                <Route path="reports" element={<UtilityReportsPage />} />
                <Route path="*" element={<Navigate to="/utility/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/food/*"
        element={
          <ProtectedRoute allowedRoles={['food', 'admin']}>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<FoodDashboardPage />} />
                <Route path="contributions" element={<FoodContributionsPage />} />
                <Route path="expenses" element={<FoodExpensesPage />} />
                <Route path="reports" element={<FoodReportsPage />} />
                <Route path="*" element={<Navigate to="/food/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/member/*"
        element={
          <ProtectedRoute allowedRoles={['member']}>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<MemberDashboardPage />} />
                <Route path="profile" element={<MemberProfilePage />} />
                <Route path="organization" element={<MemberOrganizationPage />} />
                <Route path="announcements" element={<MemberAnnouncementsPage />} />
                <Route path="*" element={<Navigate to="/member/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
