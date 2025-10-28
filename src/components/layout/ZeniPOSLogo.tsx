import { cn } from '@/lib/utils';

interface ZeniPOSLogoProps {
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark' | 'color';
  className?: string;
}

export function ZeniPOSLogo({ 
  variant = 'full', 
  theme = 'color',
  className 
}: ZeniPOSLogoProps) {
  // Determine logo source based on variant and theme
  const logoSrc = 
    variant === 'full' 
      ? theme === 'color'
        ? '/logos/zenipos-full-color.svg'    // Full logo with gold POS
        : '/logos/zenipos-full-white.svg'    // Full logo all white
      : theme === 'color'
        ? '/logos/zenipos-icon-black.svg'    // Z icon in black
        : '/logos/zenipos-icon-white.svg';   // Z icon in white
  
  return (
    <img 
      src={logoSrc} 
      alt="ZeniPOS - Zero Error" 
      className={cn('h-8', className)}
    />
  );
}
