import { useState } from 'react';
import { GlassLoginCard } from './GlassLoginCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';

interface AdminPasswordGateProps {
  onAuthenticated: () => void;
}

export function AdminPasswordGate({ onAuthenticated }: AdminPasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  const ADMIN_PASSWORD = '23n1p05@102025';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authenticated', 'true');
      onAuthenticated();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setError(`Invalid admin password. ${3 - newAttempts} attempts remaining.`);
      
      if (newAttempts >= 3) {
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
    }
  };

  return (
    <GlassLoginCard>
      <div className="text-center mb-8">
        <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Admin Authorization Required</h2>
        <p className="text-muted-foreground mt-2">
          Enter the admin password to register a new organization
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="admin-password">Admin Password</Label>
          <Input 
            id="admin-password"
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            className="bg-background/50"
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={failedAttempts >= 3}>
          Continue to Registration
        </Button>
      </form>
    </GlassLoginCard>
  );
}