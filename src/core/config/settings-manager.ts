import fs from 'fs';
import path from 'path';
import { CONFIG, APP_VERSION } from './config';

export type SettingCategory =
  | 'Appearance'
  | 'Terminal'
  | 'Commands'
  | 'Editor'
  | 'Documents'
  | 'Wattpad'
  | 'Google'
  | 'Security'
  | 'Updates';

export type SettingType = 'boolean' | 'enum' | 'number' | 'text' | 'action';

export interface SettingDefinition {
  id: string;
  name: string;
  category: SettingCategory;
  description: string;
  type: SettingType;
  options?: string[];
  min?: number;
  max?: number;
  defaultValue: string;
}

export const SETTINGS_DEFINITIONS: SettingDefinition[] = [
  // Appearance
  {
    id: 'interface_mode',
    name: 'Interface Mode',
    category: 'Appearance',
    description: 'Select the preferred interface layout.\n\ncomplete: Full terminal interface with panels and contextual information.\ncompact: Reduced spacing and minimal visual elements.\nzen: Minimal interface displaying only essential information.',
    type: 'enum',
    options: ['complete', 'compact', 'zen'],
    defaultValue: 'complete',
  },
  {
    id: 'color_scheme',
    name: 'Color Scheme',
    category: 'Appearance',
    description: 'Select the terminal color palette theme. Uses high-contrast ANSI TrueColor values.',
    type: 'enum',
    options: ['Wattpad Dark', 'Tokyo Night', 'Monokai', 'Light'],
    defaultValue: 'Wattpad Dark',
  },
  {
    id: 'animation_speed',
    name: 'Animation Speed',
    category: 'Appearance',
    description: 'Speed of visual feedback, banner fades, and status notifications.',
    type: 'enum',
    options: ['fast', 'medium', 'slow', 'off'],
    defaultValue: 'medium',
  },
  {
    id: 'logo_display',
    name: 'Logo Display',
    category: 'Appearance',
    description: 'Show the official Wattpad ASCII logo in the fixed header.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'compact_header',
    name: 'Compact Header',
    category: 'Appearance',
    description: 'Reduce header vertical padding to maximize content workspace area.',
    type: 'boolean',
    defaultValue: 'off',
  },
  {
    id: 'show_profile_info',
    name: 'Show Profile Information',
    category: 'Appearance',
    description: 'Display connected username (@AnMigz) and live status in the header.',
    type: 'boolean',
    defaultValue: 'on',
  },

  // Terminal
  {
    id: 'scroll_behavior',
    name: 'Scroll Behavior',
    category: 'Terminal',
    description: 'Behavior of vertical viewport navigation (smooth acceleration or instant jumping).',
    type: 'enum',
    options: ['smooth', 'instant'],
    defaultValue: 'smooth',
  },
  {
    id: 'mouse_support',
    name: 'Mouse Support',
    category: 'Terminal',
    description: 'Enable mouse wheel scrolling and clicking in compatible terminals.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'terminal_rendering',
    name: 'Terminal Rendering',
    category: 'Terminal',
    description: 'Rendering mode: fullscreen alternate buffer or inline streaming.',
    type: 'enum',
    options: ['fullscreen', 'inline'],
    defaultValue: 'fullscreen',
  },
  {
    id: 'output_history',
    name: 'Output History',
    category: 'Terminal',
    description: 'Maximum number of previous command outputs stored in scrollback buffer.',
    type: 'number',
    min: 20,
    max: 200,
    defaultValue: '100',
  },
  {
    id: 'show_status_bar',
    name: 'Show Status Bar',
    category: 'Terminal',
    description: 'Display persistent status line at the bottom of the screen.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'clear_on_command',
    name: 'Clear Screen On Command',
    category: 'Terminal',
    description: 'Automatically clear previous command output when executing a new command.',
    type: 'boolean',
    defaultValue: 'off',
  },

  // Commands
  {
    id: 'autocomplete',
    name: 'Autocomplete',
    category: 'Commands',
    description: 'Show autocomplete suggestions dropdown as you type / commands.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'command_suggestions',
    name: 'Command Suggestions',
    category: 'Commands',
    description: 'Enable contextual suggestions and Tab completion for command arguments.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'suggestion_limit',
    name: 'Suggestion Limit',
    category: 'Commands',
    description: 'Maximum number of suggestions displayed simultaneously in the dropdown list.',
    type: 'number',
    min: 3,
    max: 15,
    defaultValue: '8',
  },
  {
    id: 'command_history',
    name: 'Command History',
    category: 'Commands',
    description: 'Persist command execution history to disk across sessions.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'confirm_destructive',
    name: 'Confirm Before Deleting',
    category: 'Commands',
    description: 'Require explicit user confirmation dialogs before deleting stories or chapters.',
    type: 'boolean',
    defaultValue: 'on',
  },

  // Editor
  {
    id: 'default_editor',
    name: 'Default Editor',
    category: 'Editor',
    description: 'Default editor used to write and review chapter contents.',
    type: 'enum',
    options: ['Word', 'Notepad', 'Google Docs', 'CLI Editor'],
    defaultValue: 'Word',
  },
  {
    id: 'editor_mode',
    name: 'Editor Mode',
    category: 'Editor',
    description: 'auto: Automatically select best editor based on file format. terminal: Always use built-in text editor. external: Always open default OS program.',
    type: 'enum',
    options: ['auto', 'terminal', 'external'],
    defaultValue: 'auto',
  },
  {
    id: 'word_count',
    name: 'Word Count',
    category: 'Editor',
    description: 'Calculate and display live word and character counts in editor and chapter status.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'auto_save',
    name: 'Auto Save',
    category: 'Editor',
    description: 'Periodically save drafts to disk while editing in terminal editor.',
    type: 'boolean',
    defaultValue: 'off',
  },
  {
    id: 'backup_before_saving',
    name: 'Automatic Backups',
    category: 'Editor',
    description: 'Create an automatic .bak backup file before overwriting content during save.',
    type: 'boolean',
    defaultValue: 'on',
  },

  // Documents
  {
    id: 'default_documents_folder',
    name: 'Default Documents Folder',
    category: 'Documents',
    description: 'Local directory where manuscript files (.docx, .txt) are scanned and stored.',
    type: 'text',
    defaultValue: CONFIG.docsDir,
  },
  {
    id: 'default_document_format',
    name: 'Default Document Format',
    category: 'Documents',
    description: 'Format used when creating or exporting chapters and stories to local disk.',
    type: 'enum',
    options: ['docx', 'txt'],
    defaultValue: 'docx',
  },
  {
    id: 'open_with',
    name: 'Open With',
    category: 'Documents',
    description: 'Program launcher to open documents: system default or dedicated handler.',
    type: 'enum',
    options: ['system', 'custom'],
    defaultValue: 'system',
  },
  {
    id: 'google_docs',
    name: 'Google Docs',
    category: 'Documents',
    description: 'Integration with Google Docs and Google Drive. Press Enter to view connection options.',
    type: 'action',
    defaultValue: 'connected',
  },

  // Wattpad
  {
    id: 'startup_profile_check',
    name: 'Startup Profile Check',
    category: 'Wattpad',
    description: 'Verify authenticated Wattpad session and author profile when application boots.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'refresh_catalog',
    name: 'Refresh Catalog',
    category: 'Wattpad',
    description: 'Synchronize remote works, drafts, and local manuscripts. Press Enter to run.',
    type: 'action',
    defaultValue: 'Run refresh',
  },
  {
    id: 'default_search_language',
    name: 'Default Search Language',
    category: 'Wattpad',
    description: 'Default language filter applied when searching stories on Wattpad.',
    type: 'enum',
    options: ['Spanish', 'English', 'All'],
    defaultValue: 'Spanish',
  },
  {
    id: 'search_results_per_page',
    name: 'Search Results Per Page',
    category: 'Wattpad',
    description: 'Number of stories returned per search query in /discover and /search.',
    type: 'number',
    min: 5,
    max: 50,
    defaultValue: '20',
  },
  {
    id: 'confirm_before_publishing',
    name: 'Confirm Before Publishing',
    category: 'Wattpad',
    description: 'Require explicit confirmation before publishing chapters to public Wattpad profile.',
    type: 'boolean',
    defaultValue: 'on',
  },

  // Google
  {
    id: 'google_connection_status',
    name: 'Connection Status',
    category: 'Google',
    description: 'Google OAuth 2.0 PKCE desktop connection status. Press Enter to check.',
    type: 'action',
    defaultValue: 'connected',
  },
  {
    id: 'google_connected_account',
    name: 'Connected Account',
    category: 'Google',
    description: 'Authorized Google account for Google Docs synchronization.',
    type: 'text',
    defaultValue: 'angel@gmail.com',
  },
  {
    id: 'manage_google_auth',
    name: 'Manage Authorization',
    category: 'Google',
    description: 'Manage permissions or re-authenticate Google Docs via loopback browser.',
    type: 'action',
    defaultValue: 'Manage',
  },
  {
    id: 'disconnect_google',
    name: 'Disconnect Google',
    category: 'Google',
    description: 'Revoke token and disconnect Google account. Press Enter to disconnect.',
    type: 'action',
    defaultValue: 'Disconnect',
  },

  // Security
  {
    id: 'session_management',
    name: 'Local Session Management',
    category: 'Security',
    description: 'Manage local persistent browser profile in ~/.wattpad-cli/profiles/wattpad.',
    type: 'action',
    defaultValue: 'Active session',
  },
  {
    id: 'credential_storage_status',
    name: 'Credential Storage Status',
    category: 'Security',
    description: 'Local AES-256-GCM encrypted vault (vault.enc) integrity status.',
    type: 'text',
    defaultValue: 'AES-256-GCM Vault',
  },
  {
    id: 'browser_mode',
    name: 'Browser Mode',
    category: 'Security',
    description: 'Mode for running browser tasks: background (headless) or visible.',
    type: 'enum',
    options: ['background', 'visible'],
    defaultValue: 'background',
  },

  // Updates
  {
    id: 'current_version',
    name: 'Current Version',
    category: 'Updates',
    description: 'Installed version of Wattpad CLI tool.',
    type: 'text',
    defaultValue: `v${APP_VERSION}`,
  },
  {
    id: 'check_updates',
    name: 'Check For Updates',
    category: 'Updates',
    description: 'Check GitHub Releases for new official Wattpad CLI versions.',
    type: 'action',
    defaultValue: 'Check now',
  },
  {
    id: 'update_notifications',
    name: 'Update Notifications',
    category: 'Updates',
    description: 'Display automatic update notifications when a new version is available.',
    type: 'boolean',
    defaultValue: 'on',
  },
  {
    id: 'distribution_info',
    name: 'Distribution Information',
    category: 'Updates',
    description: 'Official repository: https://github.com/MiguelCarlosRojas/Wattpad-CLI',
    type: 'action',
    defaultValue: 'Official GitHub',
  },
];

export class SettingsManager {
  private settings: Map<string, string> = new Map();
  private commandHistory: string[] = [];
  private settingsFilePath: string;
  private historyFilePath: string;
  private changeListeners: Array<(key: string, value: string) => void> = [];

  constructor(customConfigDir?: string) {
    const dir = customConfigDir || CONFIG.configDir;
    this.settingsFilePath = path.join(dir, 'settings.json');
    this.historyFilePath = path.join(dir, 'history.json');
    this.initDefaults();
    this.loadFromDisk();
  }

  private initDefaults(): void {
    for (const def of SETTINGS_DEFINITIONS) {
      this.settings.set(def.id, def.defaultValue);
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'string') {
              this.settings.set(k, v);
            }
          }
        }
      }
    } catch {
      // Safe fallback: continue with memory defaults
    }

    try {
      if (fs.existsSync(this.historyFilePath)) {
        const raw = fs.readFileSync(this.historyFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.commandHistory = data.filter((item): item is string => typeof item === 'string');
        }
      }
    } catch {
      // Safe fallback
    }
  }

  public saveSettingsToDisk(): void {
    try {
      const dir = path.dirname(this.settingsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const obj: Record<string, string> = {};
      for (const [k, v] of this.settings.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {
      // Non-blocking
    }
  }

  private saveHistoryToDisk(): void {
    try {
      const dir = path.dirname(this.historyFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.historyFilePath, JSON.stringify(this.commandHistory.slice(-200), null, 2), 'utf-8');
    } catch {
      // Non-blocking
    }
  }

  public get(key: string, defaultValue?: string): string | null {
    const val = this.settings.get(key);
    if (val !== undefined) return val;
    const def = SETTINGS_DEFINITIONS.find((s) => s.id === key);
    return def ? def.defaultValue : (defaultValue ?? null);
  }

  public set(key: string, value: string): void {
    this.settings.set(key, value);
    this.saveSettingsToDisk();
    for (const listener of this.changeListeners) {
      try {
        listener(key, value);
      } catch {}
    }
  }

  public onSettingChange(listener: (key: string, value: string) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  public getAllDefinitions(): SettingDefinition[] {
    return SETTINGS_DEFINITIONS;
  }

  public getSettingValue(id: string): string {
    return this.get(id) || '';
  }

  public cycleNext(id: string): string {
    const def = SETTINGS_DEFINITIONS.find((s) => s.id === id);
    if (!def) return '';

    if (def.type === 'boolean') {
      const current = this.get(id) === 'on';
      const next = current ? 'off' : 'on';
      this.set(id, next);
      return next;
    }

    if (def.type === 'enum' && def.options && def.options.length > 0) {
      const current = this.get(id) || def.defaultValue;
      const idx = def.options.indexOf(current);
      const nextIdx = (idx + 1) % def.options.length;
      const next = def.options[nextIdx];
      this.set(id, next);
      return next;
    }

    if (def.type === 'number') {
      const current = parseInt(this.get(id) || def.defaultValue, 10) || 0;
      const min = def.min !== undefined ? def.min : 0;
      const max = def.max !== undefined ? def.max : 100;
      const step = max > 50 ? 5 : 1;
      const next = Math.min(max, current + step);
      this.set(id, String(next));
      return String(next);
    }

    return this.get(id) || '';
  }

  public cyclePrev(id: string): string {
    const def = SETTINGS_DEFINITIONS.find((s) => s.id === id);
    if (!def) return '';

    if (def.type === 'boolean') {
      const current = this.get(id) === 'on';
      const next = current ? 'off' : 'on';
      this.set(id, next);
      return next;
    }

    if (def.type === 'enum' && def.options && def.options.length > 0) {
      const current = this.get(id) || def.defaultValue;
      const idx = def.options.indexOf(current);
      const prevIdx = (idx - 1 + def.options.length) % def.options.length;
      const prev = def.options[prevIdx];
      this.set(id, prev);
      return prev;
    }

    if (def.type === 'number') {
      const current = parseInt(this.get(id) || def.defaultValue, 10) || 0;
      const min = def.min !== undefined ? def.min : 0;
      const max = def.max !== undefined ? def.max : 100;
      const step = max > 50 ? 5 : 1;
      const prev = Math.max(min, current - step);
      this.set(id, String(prev));
      return String(prev);
    }

    return this.get(id) || '';
  }

  public addCommandHistory(command: string): void {
    const trimmed = command.trim();
    if (!trimmed) return;
    this.commandHistory.push(trimmed);
    this.saveHistoryToDisk();
  }

  public getCommandHistory(limit: number = 50): string[] {
    return this.commandHistory.slice(-limit);
  }

  public clear(): void {
    this.settings.clear();
    this.initDefaults();
    this.commandHistory = [];
  }
}
