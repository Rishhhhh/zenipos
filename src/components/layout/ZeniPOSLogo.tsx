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
  const logoSrc = 
    variant === 'full' 
      ? theme === 'color'
        ? '/logos/zenipos-full-color.svg'
        : '/logos/zenipos-full-white.svg'
      : theme === 'color'
        ? '/logos/zenipos-icon-color.png'
        : '/logos/zenipos-icon-white.svg';
  
  return (
    <img 
      src={logoSrc} 
      alt="ZeniPOS - Zero Error" 
      className={cn('h-8', className)}
    />
  );
}
