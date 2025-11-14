import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

interface OrgProtectedRouteProps {
  children: React.ReactNode;
}

export function OrgProtectedRoute({ children }: OrgProtectedRouteProps) {
  const { isOrganizationAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // DEVELOPMENT MODE: Bypass all checks
  if (APP_CONFIG.DEVELOPMENT_MODE) {
    console.log('[OrgProtectedRoute] 🛠️ DEV MODE: Bypassing protection');
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to organization login if not authenticated
  if (!isOrganizationAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}
