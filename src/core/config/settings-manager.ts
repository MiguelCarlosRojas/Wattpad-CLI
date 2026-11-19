import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';

export class SettingsManager {
  private settings: Map<string, string> = new Map();
  private commandHistory: string[] = [];
  private settingsFilePath: string;
  private historyFilePath: string;

  constructor(customConfigDir?: string) {
    const dir = customConfigDir || CONFIG.configDir;
    this.settingsFilePath = path.join(dir, 'settings.json');
    this.historyFilePath = path.join(dir, 'history.json');
    this.loadFromDisk();
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
      // Safe fallback: continue with empty settings in memory
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
      // Safe fallback: continue with empty history in memory
    }
  }

  private saveSettingsToDisk(): void {
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
      // Non-blocking in case of filesystem permissions or headless test envs
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
    return this.settings.get(key) ?? defaultValue ?? null;
  }

  public set(key: string, value: string): void {
    this.settings.set(key, value);
    this.saveSettingsToDisk();
  }

  public addCommandHistory(command: string): void {
    const trimmed = command.trim();
    if (!trimmed) return;
    this.commandHistory.push(trimmed);
    this.saveHistoryToDisk();
  }

  public getCommandHistory(limit: number = 50): string[] {
    const slice = this.commandHistory.slice(-limit);
    return slice;
  }

  public clear(): void {
    this.settings.clear();
    this.commandHistory = [];
  }
}
