/**
 * Theme System Types
 * 10+ themes for generational gap bridging
 */

export type ThemeId =
  | 'cosmic-modern'
  | 'professional-dark'
  | 'windows-xp'
  | 'excel-classic'
  | 'material-3'
  | 'neumorphism'
  | 'brutalism'
  | 'retro-terminal'
  | 'macos-aqua'
  | 'fluent-11'
  | 'high-contrast';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  cssVars: Record<string, string>;
  animations: boolean;
  glassEffects: boolean;
  gradients: boolean;
}

export const themes: Record<ThemeId, ThemeConfig> = {
  'cosmic-modern': {
    id: 'cosmic-modern',
    name: 'Cosmic Modern',
    description: '3D visuals, gradients, particle effects',
    animations: true,
    glassEffects: true,
    gradients: true,
    cssVars: {
      '--background': '222 10% 4%',
      '--foreground': '0 0% 98%',
      '--primary': '263 70% 60%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '280 80% 65%',
      '--muted': '240 5% 15%',
      '--border': '240 6% 20%',
    },
  },
  'professional-dark': {
    id: 'professional-dark',
    name: 'Professional Dark',
    description: 'Clean, enterprise-ready, minimal animations',
    animations: false,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '0 0% 8%',
      '--foreground': '0 0% 95%',
      '--primary': '210 100% 50%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '210 100% 40%',
      '--muted': '0 0% 15%',
      '--border': '0 0% 20%',
    },
  },
  'windows-xp': {
    id: 'windows-xp',
    name: 'Windows XP',
    description: 'Classic XP blue, Tahoma font, Luna theme',
    animations: false,
    glassEffects: false,
    gradients: true,
    cssVars: {
      '--background': '0 0% 100%',
      '--foreground': '0 0% 0%',
      '--primary': '212 100% 48%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '36 100% 50%',
      '--muted': '0 0% 95%',
      '--border': '212 50% 60%',
    },
  },
  'excel-classic': {
    id: 'excel-classic',
    name: 'Excel Classic',
    description: 'Grid-heavy, spreadsheet-like, green accents',
    animations: false,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '0 0% 100%',
      '--foreground': '0 0% 0%',
      '--primary': '140 70% 40%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '140 60% 50%',
      '--muted': '0 0% 96%',
      '--border': '0 0% 80%',
    },
  },
  'material-3': {
    id: 'material-3',
    name: 'Material Design 3',
    description: 'Google Material You, dynamic color',
    animations: true,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '0 0% 99%',
      '--foreground': '0 0% 10%',
      '--primary': '262 52% 47%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '345 80% 60%',
      '--muted': '0 0% 95%',
      '--border': '0 0% 90%',
    },
  },
  neumorphism: {
    id: 'neumorphism',
    name: 'Neumorphism',
    description: 'Soft shadows, embossed UI, tactile feel',
    animations: true,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '210 20% 95%',
      '--foreground': '0 0% 10%',
      '--primary': '210 80% 60%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '210 70% 50%',
      '--muted': '210 15% 92%',
      '--border': '210 15% 88%',
    },
  },
  brutalism: {
    id: 'brutalism',
    name: 'Brutalism',
    description: 'Bold, raw, high contrast, no fluff',
    animations: false,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '0 0% 100%',
      '--foreground': '0 0% 0%',
      '--primary': '0 0% 0%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '60 100% 50%',
      '--muted': '0 0% 90%',
      '--border': '0 0% 0%',
    },
  },
  'retro-terminal': {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    description: 'Green phosphor, monospace, hacker aesthetic',
    animations: true,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '0 0% 0%',
      '--foreground': '120 100% 70%',
      '--primary': '120 100% 50%',
      '--primary-foreground': '0 0% 0%',
      '--accent': '120 100% 40%',
      '--muted': '0 0% 10%',
      '--border': '120 100% 30%',
    },
  },
  'macos-aqua': {
    id: 'macos-aqua',
    name: 'macOS Aqua',
    description: 'OS X Aqua theme, blue tint, brushed metal',
    animations: true,
    glassEffects: true,
    gradients: true,
    cssVars: {
      '--background': '0 0% 98%',
      '--foreground': '0 0% 10%',
      '--primary': '211 100% 50%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '211 80% 60%',
      '--muted': '0 0% 94%',
      '--border': '0 0% 85%',
    },
  },
  'fluent-11': {
    id: 'fluent-11',
    name: 'Windows 11 Fluent',
    description: 'Fluent Design, Mica, rounded corners',
    animations: true,
    glassEffects: true,
    gradients: true,
    cssVars: {
      '--background': '0 0% 98%',
      '--foreground': '0 0% 10%',
      '--primary': '213 94% 55%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '213 90% 65%',
      '--muted': '0 0% 94%',
      '--border': '0 0% 88%',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Accessibility-first, WCAG AAA',
    animations: false,
    glassEffects: false,
    gradients: false,
    cssVars: {
      '--background': '0 0% 0%',
      '--foreground': '0 0% 100%',
      '--primary': '60 100% 50%',
      '--primary-foreground': '0 0% 0%',
      '--accent': '180 100% 50%',
      '--muted': '0 0% 20%',
      '--border': '0 0% 100%',
    },
  },
};
