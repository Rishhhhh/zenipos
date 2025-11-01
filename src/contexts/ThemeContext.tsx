import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, type ThemeId } from '@/lib/themes/types';

interface ThemeContextType {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  config: typeof themes[ThemeId];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('theme-id');
    return (stored as ThemeId) || 'zenipos-light';
  });

  const config = themes[themeId];

  useEffect(() => {
    localStorage.setItem('theme-id', themeId);

    // Apply CSS variables with transition optimization
    const root = document.documentElement;
    
    // Remove theme-stable class before transition
    root.classList.remove('theme-stable');
    
    // OPTIMIZATION: Batch DOM updates in single frame
    requestAnimationFrame(() => {
      // Temporarily disable transitions for non-color properties
      root.style.setProperty('--transition-override', 'none');
      
      Object.entries(config.cssVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
      
      // Re-enable transitions after paint
      requestAnimationFrame(() => {
        root.style.removeProperty('--transition-override');
        
        // Add theme-stable class after 300ms to remove will-change
        setTimeout(() => {
          root.classList.add('theme-stable');
        }, 300);
      });
    });

    // Apply theme classes (no transition needed for boolean flags)
    root.classList.remove('animations-disabled', 'glass-disabled', 'gradients-disabled');
    if (!config.animations) root.classList.add('animations-disabled');
    if (!config.glassEffects) root.classList.add('glass-disabled');
    if (!config.gradients) root.classList.add('gradients-disabled');

    // Special theme-specific adjustments
    root.setAttribute('data-theme', themeId);
  }, [themeId, config]);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme: setThemeId, config }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
}
