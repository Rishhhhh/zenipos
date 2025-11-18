import { useNavigate } from 'react-router-dom';
import { GlassLoginCard } from '@/components/auth/GlassLoginCard';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BranchSetup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-warning/10 via-transparent to-transparent" />
      
      <GlassLoginCard>
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 border border-warning/30 mb-4">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Branch Setup Required</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your organization doesn't have any branches set up yet.
              Please contact your administrator to complete the setup.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full"
            >
              Back to Organization Login
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Need help? Contact support or your system administrator
            </p>
          </div>
        </div>
      </GlassLoginCard>
    </div>
  );
}
