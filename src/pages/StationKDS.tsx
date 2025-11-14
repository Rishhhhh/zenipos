import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @deprecated Station-based KDS has been removed in Phase 1 refactoring.
 * This page redirects users to the main KDS view.
 */
export default function StationKDS() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/kds');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-background">
      <Card className="max-w-2xl p-8">
        <Alert>
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <h2 className="text-xl font-semibold mb-3">Station-Based KDS Removed</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The station-based Kitchen Display System has been deprecated as part of our Phase 1 refactoring.
              The system now uses a simplified branch-based approach for better performance and maintainability.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You will be automatically redirected to the main KDS page in 5 seconds...
            </p>
            <Button onClick={() => navigate('/kds')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to KDS Now
            </Button>
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}
