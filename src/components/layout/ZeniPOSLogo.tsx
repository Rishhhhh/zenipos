import { cn } from '@/lib/utils';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

interface ZeniPOSLogoProps {
  variant?: 'full' | 'icon';
  theme?: 'auto' | 'light' | 'dark' | 'color';
  className?: string;
}

export function ZeniPOSLogo({ 
  variant = 'full', 
  theme = 'auto',
  className 
}: ZeniPOSLogoProps) {
  // Safely get theme context with fallback
  let themeId = 'zenipos-light';
  try {
    const context = useThemeContext();
    themeId = context.themeId;
  } catch {
    // ThemeProvider not available, use default
  }
  
  // Auto-detect theme if 'auto' is specified
  let effectiveTheme = theme;
  if (theme === 'auto') {
    const isDark = themeId.includes('dark') || 
                   ['professional-dark', 'retro-terminal', 'brutalism'].includes(themeId);
    effectiveTheme = isDark ? 'dark' : 'light';
  }
  
  // Determine logo source based on variant and effective theme
  const logoSrc = 
    variant === 'full' 
      ? effectiveTheme === 'color'
        ? '/logos/zenipos-full-color.svg'
        : effectiveTheme === 'dark'
          ? '/logos/zenipos-full-white.svg'
          : '/logos/zenipos-full-color.svg'
      : effectiveTheme === 'color'
        ? '/logos/zenipos-icon-black.svg'
        : effectiveTheme === 'dark'
          ? '/logos/zenipos-icon-white.svg'
          : '/logos/zenipos-icon-black.svg';
  
  return (
    <img 
      src={logoSrc} 
      alt="ZeniPOS - Zero Error" 
      className={cn('h-8', className)}
    />
  );
}
