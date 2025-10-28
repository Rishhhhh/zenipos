/**
 * Curated color palettes per theme
 * Artistic selection for maximum visual impact + readability
 */

export interface ThemeColorPalette {
  primary: string[];
  accent: string[];
  gradient: [string, string];
  chartColors: string[];
}

export const themeColorPalettes: Record<string, ThemeColorPalette> = {
  'zenipos-light': {
    primary: ['#FFC100', '#E6AD00', '#CC9A00'],
    accent: ['#090A0E', '#1A1A1A', '#2A2A2A'],
    gradient: ['#FFC100', '#E6AD00'],
    chartColors: ['#FFC100', '#090A0E', '#10B981', '#EF4444', '#3B82F6', '#F59E0B'],
  },
  'zenipos-dark': {
    primary: ['#FFC100', '#FFD54F', '#FFE082'],
    accent: ['#FAFAFA', '#E5E5E5', '#D4D4D4'],
    gradient: ['#FFC100', '#FFD54F'],
    chartColors: ['#FFC100', '#FAFAFA', '#10B981', '#EF4444', '#60A5FA', '#FBBF24'],
  },
  'cosmic-modern': {
    primary: ['#8B5CF6', '#A78BFA', '#C4B5FD'], // Purple spectrum
    accent: ['#EC4899', '#F472B6', '#FBCFE8'],  // Pink spectrum
    gradient: ['#8B5CF6', '#EC4899'],
    chartColors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'], // Vibrant rainbow
  },
  
  'professional-dark': {
    primary: ['#0EA5E9', '#38BDF8', '#7DD3FC'], // Sky blue spectrum
    accent: ['#3B82F6', '#60A5FA', '#93C5FD'],  // Blue spectrum
    gradient: ['#0EA5E9', '#3B82F6'],
    chartColors: ['#0EA5E9', '#3B82F6', '#8B5CF6', '#06B6D4', '#14B8A6'], // Cool professional tones
  },
  
  'windows-xp': {
    primary: ['#0078D4', '#429CE3', '#73B6E8'], // Classic XP blue
    accent: ['#FFD700', '#FFC700', '#FFB700'],  // Gold accent
    gradient: ['#0078D4', '#00BCF2'],
    chartColors: ['#0078D4', '#FFD700', '#217346', '#D83B01', '#8764B8'], // XP iconic colors
  },
  
  'excel-classic': {
    primary: ['#217346', '#2F8C5A', '#4CAF50'], // Excel green spectrum
    accent: ['#10B981', '#34D399', '#6EE7B7'],  // Emerald accents
    gradient: ['#217346', '#10B981'],
    chartColors: ['#217346', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'], // Excel chart defaults
  },
  
  'material-3': {
    primary: ['#6750A4', '#7965AF', '#9080BA'], // Material purple
    accent: ['#625B71', '#7D7589', '#9A8FA2'],  // Neutral tones
    gradient: ['#6750A4', '#625B71'],
    chartColors: ['#6750A4', '#625B71', '#7D5260', '#006A6A', '#4F6128'], // Material dynamic colors
  },
  
  'high-contrast': {
    primary: ['#FFFFFF', '#E0E0E0', '#C0C0C0'], // White spectrum
    accent: ['#FFFF00', '#FFD700', '#FFC700'],  // Yellow for visibility
    gradient: ['#FFFFFF', '#FFFF00'],
    chartColors: ['#FFFFFF', '#FFFF00', '#FF0000', '#00FF00', '#00FFFF'], // Maximum contrast
  },
  
  'light': {
    primary: ['#6366F1', '#818CF8', '#A5B4FC'], // Indigo spectrum
    accent: ['#8B5CF6', '#A78BFA', '#C4B5FD'],  // Purple accents
    gradient: ['#6366F1', '#8B5CF6'],
    chartColors: ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
  },
  
  'dark': {
    primary: ['#3B82F6', '#60A5FA', '#93C5FD'], // Blue spectrum
    accent: ['#8B5CF6', '#A78BFA', '#C4B5FD'],  // Purple accents
    gradient: ['#3B82F6', '#8B5CF6'],
    chartColors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
  },
};

/**
 * Get chart colors for a theme
 */
export function getThemeColors(themeId: string): string[] {
  return themeColorPalettes[themeId]?.chartColors || themeColorPalettes['cosmic-modern'].chartColors;
}

/**
 * Get gradient colors for a theme
 */
export function getThemeGradient(themeId: string): [string, string] {
  return themeColorPalettes[themeId]?.gradient || ['#8B5CF6', '#EC4899'];
}

/**
 * Get primary color palette for a theme
 */
export function getThemePrimary(themeId: string): string[] {
  return themeColorPalettes[themeId]?.primary || themeColorPalettes['cosmic-modern'].primary;
}

/**
 * Get accent color palette for a theme
 */
export function getThemeAccent(themeId: string): string[] {
  return themeColorPalettes[themeId]?.accent || themeColorPalettes['cosmic-modern'].accent;
}
