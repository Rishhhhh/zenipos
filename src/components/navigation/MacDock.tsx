import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { DockIcon } from './DockIcon';
import { DockSeparator } from './DockSeparator';
import { getVisibleApps, DOCK_UTILITIES } from './dockConfig';
import type { AppRole } from './dockConfig';

export function MacDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { role, logout } = useAuth();

  const visibleApps = getVisibleApps(role as AppRole);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      // App shortcuts: ⌘1-5
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= 5) {
        e.preventDefault();
        const app = visibleApps[numKey - 1];
        if (app) navigate(app.route);
        return;
      }

      // Utility shortcuts
      switch (e.key.toLowerCase()) {
        case 't':
          e.preventDefault();
          setTheme(theme === 'dark' ? 'light' : 'dark');
          break;
        case 'q':
          e.preventDefault();
          logout();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleApps, navigate, theme, setTheme, logout]);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
  };

  const isActive = (route: string) => {
    // Exact match for most routes
    if (location.pathname === route) return true;
    
    // Special handling for admin routes
    if (route === '/admin' && location.pathname.startsWith('/admin')) {
      // Only active if exactly /admin or /admin/*management pages
      return location.pathname === '/admin' || 
             location.pathname.includes('management');
    }
    
    return false;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10002] dock-container">
      <div className="glass-dock rounded-2xl px-3 py-2 flex items-center gap-1 shadow-2xl">
        {/* App Icons */}
        {visibleApps.map((app) => (
          <DockIcon
            key={app.id}
            icon={app.icon}
            label={app.label}
            shortcut={app.shortcut}
            isActive={isActive(app.route)}
            onClick={() => navigate(app.route)}
          />
        ))}

        {/* Separator */}
        <DockSeparator />

        {/* Utility Icons */}
        {DOCK_UTILITIES.map((utility) => {
          const Icon = theme === 'dark' && utility.iconDark 
            ? utility.iconDark 
            : utility.icon;
          
          return (
            <DockIcon
              key={utility.id}
              icon={Icon}
              label={utility.label}
              shortcut={utility.shortcut}
              onClick={utility.action === 'theme' ? handleThemeToggle : handleLogout}
            />
          );
        })}
      </div>
    </div>
  );
}
