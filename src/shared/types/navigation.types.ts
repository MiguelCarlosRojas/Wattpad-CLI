/**
 * Tipos de datos para el sistema de navegación universal y vistas
 */

export type ScreenId =
  | 'welcome'
  | 'login'
  | 'register'
  | 'main-menu'
  | 'search'
  | 'story-detail'
  | 'inbox'
  | 'conversation'
  | 'library'
  | 'create-story'
  | 'my-stories'
  | 'story-manage'
  | 'chapters'
  | 'chapter-editor';

export interface KeyPressEvent {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  raw: Buffer | string;
}

export interface MenuItem {
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface ViewInterface {
  id: ScreenId;
  init?(): Promise<void>;
  render(width: number, height: number): string[];
  handleKey(event: KeyPressEvent): Promise<boolean | void> | boolean | void;
  onEnter?(params?: any): Promise<void> | void;
  onLeave?(): Promise<void> | void;
}
