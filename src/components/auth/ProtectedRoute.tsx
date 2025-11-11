import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'owner' | 'manager' | 'staff';
}

const roleHierarchy = {
  owner: 3,
  manager: 2,
  staff: 1,
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && role) {
      const hasAccess = roleHierarchy[role] >= roleHierarchy[requiredRole];
      setShowAccessDenied(!hasAccess);
    }
  }, [isAuthenticated, isLoading, role, requiredRole]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-pulse text-center">
            <div className="h-8 w-8 border-4 border-danger border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && role) {
    const hasAccess = roleHierarchy[role] >= roleHierarchy[requiredRole];
    
    if (!hasAccess) {
      return (
        <>
          {children}
          <AlertDialog open={showAccessDenied} onOpenChange={setShowAccessDenied}>
            <AlertDialogContent className="glass-card border-danger/30">
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-full bg-danger/20">
                    <ShieldAlert className="h-6 w-6 text-danger" />
                  </div>
                  <AlertDialogTitle className="text-xl">Access Denied</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-base">
                  You need <span className="font-semibold text-danger">{requiredRole}</span> privileges to access this area.
                  <br />
                  Your current role: <span className="font-semibold text-foreground">{role}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button 
                  variant="default" 
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  Go Back
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }
  }

  return <>{children}</>;
}
