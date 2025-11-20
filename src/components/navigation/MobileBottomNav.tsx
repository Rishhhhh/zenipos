import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DOCK_APPS } from './dockConfig';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleApps } from './dockConfig';

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  
  // Get visible apps based on role
  const visibleApps = getVisibleApps(role);
  
  // Filter to essential 4-5 apps for mobile
  const essentialApps = visibleApps.filter(app => 
    ['pos', 'tables', 'kds', 'reports', 'admin'].includes(app.id)
  ).slice(0, 5);

  const isActive = (route: string) => {
    if (route === '/' && location.pathname === '/') return true;
    if (route === '/admin' && location.pathname.startsWith('/admin')) return true;
    if (route !== '/' && location.pathname.startsWith(route)) return true;
    return false;
  };

  const handleNavigation = (route: string) => {
    haptics.light();
    navigate(route);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-[10001] safe-area-bottom"
      aria-label="Main navigation"
    >
      <div 
        className="grid gap-0" 
        style={{ gridTemplateColumns: `repeat(${essentialApps.length}, 1fr)` }}
      >
        {essentialApps.map((app) => {
          const active = isActive(app.route);
          return (
            <button
              key={app.id}
              onClick={() => handleNavigation(app.route)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 relative',
                'min-h-[60px] transition-colors duration-200',
                'active:bg-primary/10',
                active 
                  ? 'text-primary bg-primary/5' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={app.label}
              aria-current={active ? 'page' : undefined}
            >
              <app.icon 
                className={cn(
                  'w-6 h-6 mb-1 transition-transform',
                  active && 'scale-110'
                )} 
              />
              <span className="text-[10px] font-medium tracking-tight">
                {app.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
