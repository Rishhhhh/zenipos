import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useThemeContext } from '@/contexts/ThemeContext';
import { themes } from '@/lib/themes/types';

export function ThemeSwitcher() {
  const { themeId, setTheme } = useThemeContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="glass">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 glass-card">
        <DropdownMenuLabel>Choose Your Experience</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          ZeniPOS Themes
        </DropdownMenuLabel>
        {['zenipos-light', 'zenipos-dark'].map(id => (
          <DropdownMenuItem
            key={id}
            onClick={() => setTheme(id as any)}
            className={themeId === id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{themes[id as keyof typeof themes].name}</span>
              <span className="text-xs text-muted-foreground">
                {themes[id as keyof typeof themes].description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Modern Themes
        </DropdownMenuLabel>
        {['cosmic-modern', 'professional-dark', 'material-3', 'neumorphism', 'fluent-11'].map(id => (
          <DropdownMenuItem
            key={id}
            onClick={() => setTheme(id as any)}
            className={themeId === id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{themes[id as keyof typeof themes].name}</span>
              <span className="text-xs text-muted-foreground">
                {themes[id as keyof typeof themes].description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Retro / Classic
        </DropdownMenuLabel>
        {['windows-xp', 'excel-classic', 'macos-aqua', 'retro-terminal'].map(id => (
          <DropdownMenuItem
            key={id}
            onClick={() => setTheme(id as any)}
            className={themeId === id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{themes[id as keyof typeof themes].name}</span>
              <span className="text-xs text-muted-foreground">
                {themes[id as keyof typeof themes].description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Special Themes
        </DropdownMenuLabel>
        {['brutalism', 'high-contrast'].map(id => (
          <DropdownMenuItem
            key={id}
            onClick={() => setTheme(id as any)}
            className={themeId === id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{themes[id as keyof typeof themes].name}</span>
              <span className="text-xs text-muted-foreground">
                {themes[id as keyof typeof themes].description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
