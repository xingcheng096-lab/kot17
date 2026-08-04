import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { getDefaultPath } from '@/lib/navigation';
import type { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <p className="text-sm font-medium text-foreground">Profile not found</p>
        <p className="text-xs text-muted-foreground">
          Your account has no profile record. Please contact the administrator.
        </p>
      </div>
    );
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={getDefaultPath(profile.role)} replace />;
  }

  return <>{children}</>;
}
