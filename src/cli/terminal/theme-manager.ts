import { Theme, hexToRgb, ColorRgb } from './theme';

export type ThemeName = 'dark' | 'light' | 'tokyo-night' | 'terminal';

export interface ThemeColors {
  primary: string;
  orangeSecondary: string;
  background: string;
  surface: string;
  surfaceBorder: string;
  divider: string;
  white: string;
  text: string;
  textSecondary: string;
  muted: string;
  selectedBg: string;
  selectedText: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  purple: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  dark: {
    primary: '#FF6122',
    orangeSecondary: '#FF7849',
    background: '#0D0D0F',
    surface: '#17171B',
    surfaceBorder: '#29292F',
    divider: '#29292F',
    white: '#FFFFFF',
    text: '#F5F5F5',
    textSecondary: '#A1A1AA',
    muted: '#71717A',
    selectedBg: '#FF6122',
    selectedText: '#FFFFFF',
    success: '#32D583',
    error: '#F97066',
    warning: '#FEC84B',
    info: '#60A5FA',
    purple: '#A855F7',
  },
  light: {
    primary: '#FF6122',
    orangeSecondary: '#FF7849',
    background: '#FFFFFF',
    surface: '#F6F8FA',
    surfaceBorder: '#D0D7DE',
    divider: '#E1E4E8',
    white: '#FFFFFF',
    text: '#1F2328',
    textSecondary: '#57606A',
    muted: '#6E7781',
    selectedBg: '#FF6122',
    selectedText: '#FFFFFF',
    success: '#1A7F37',
    error: '#CF222E',
    warning: '#9A6700',
    info: '#0969DA',
    purple: '#8250DF',
  },
  'tokyo-night': {
    primary: '#FF9E64',
    orangeSecondary: '#FFA877',
    background: '#1A1B26',
    surface: '#24283B',
    surfaceBorder: '#414868',
    divider: '#565F89',
    white: '#FFFFFF',
    text: '#C0CAF5',
    textSecondary: '#9AA5CE',
    muted: '#565F89',
    selectedBg: '#FF9E64',
    selectedText: '#1A1B26',
    success: '#9ECE6A',
    error: '#F7768E',
    warning: '#E0AF68',
    info: '#7AA2F7',
    purple: '#BB9AF7',
  },
  terminal: {
    primary: '#FF6122',
    orangeSecondary: '#FF7849',
    background: '#000000',
    surface: '#111111',
    surfaceBorder: '#333333',
    divider: '#444444',
    white: '#FFFFFF',
    text: '#EEEEEE',
    textSecondary: '#AAAAAA',
    muted: '#666666',
    selectedBg: '#FF6122',
    selectedText: '#000000',
    success: '#00FF00',
    error: '#FF0000',
    warning: '#FFFF00',
    info: '#00FFFF',
    purple: '#FF00FF',
  },
};

export class ThemeManager {
  private static currentThemeName: ThemeName = 'dark';

  public static getThemeName(): ThemeName {
    return this.currentThemeName;
  }

  public static setTheme(name: ThemeName): void {
    if (!THEMES[name]) return;
    this.currentThemeName = name;
    Theme.colors = { ...THEMES[name] };
  }

  public static getAvailableThemes(): ThemeName[] {
    return Object.keys(THEMES) as ThemeName[];
  }
}
