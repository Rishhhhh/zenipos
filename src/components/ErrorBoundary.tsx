import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ React Error Boundary caught:', error, errorInfo);
    
    // Enhanced error details
    console.group('🔍 Error Details');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Device Info:', {
      width: window.innerWidth,
      height: window.innerHeight,
      device: window.innerWidth < 768 ? 'mobile' : 
              window.innerWidth < 834 ? 'portrait-tablet' :
              window.innerWidth < 1024 ? 'landscape-tablet' : 'desktop',
      userAgent: navigator.userAgent
    });
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    
    // Clear potentially corrupted state
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('dashboard-layout-') || 
              key.startsWith('pos_') ||
              key.includes('device')) {
            localStorage.removeItem(key);
            console.log('🧹 Cleared:', key);
          }
        });
      }
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  }

  handleReset = () => {
    // Clear all localStorage
    localStorage.clear();
    // Reload page
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-danger mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2 text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground">
                ZeniPOS encountered an error. This might be due to corrupted session data.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Data & Restart
              </Button>
              <p className="text-xs text-muted-foreground">
                This will clear your local session and reload the app.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
