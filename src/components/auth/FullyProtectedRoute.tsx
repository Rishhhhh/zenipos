import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface FullyProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'manager' | 'staff';
}

const roleHierarchy = {
  owner: 3,
  manager: 2,
  staff: 1,
};

export function FullyProtectedRoute({ children, requiredRole }: FullyProtectedRouteProps) {
  const { 
    isOrganizationAuthenticated, 
    isEmployeeAuthenticated, 
    role, 
    isLoading,
    employeeLogout,
  } = useAuth();
  const location = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

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

  // Redirect to organization login if org not authenticated
  if (!isOrganizationAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to employee PIN login if employee not authenticated
  if (!isEmployeeAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role hierarchy if requiredRole is specified
  if (requiredRole && role) {
    const userRoleLevel = roleHierarchy[role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <>
          {children}
          <AlertDialog open={true} onOpenChange={() => setShowAccessDenied(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-2 text-danger">
                  <ShieldAlert className="h-5 w-5" />
                  <AlertDialogTitle>Access Denied</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                  You don't have permission to access this page. This area requires{' '}
                  <span className="font-semibold capitalize">{requiredRole}</span> access or higher.
                  <br />
                  <br />
                  Your current role: <span className="font-semibold capitalize">{role}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAccessDenied(false);
                    window.history.back();
                  }}
                >
                  Go Back
                </Button>
                <Button
                  variant="default"
                  onClick={async () => {
                    await employeeLogout();
                    setShowAccessDenied(false);
                  }}
                >
                  Switch User
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }
  }

  // Render children if fully authenticated and authorized
  return <>{children}</>;
}
