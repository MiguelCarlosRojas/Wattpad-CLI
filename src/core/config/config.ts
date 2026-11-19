import path from 'path';
import os from 'os';
import fs from 'fs';
import { env } from './env';

export interface AppConfig {
  appDir: string;
  browserProfileDir: string;
  cacheDir: string;
  logsDir: string;
  configDir: string;
  docsDir: string;
  backupDir: string;
  language: 'es' | 'en';
  theme: {
    primary: string; // Wattpad Orange #FF6122
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    foreground: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

const homeDir = os.homedir();
const appDir = env.WATTPAD_APP_DIR || path.join(homeDir, '.wattpad-cli');
const browserProfileDir = path.join(appDir, 'browser-profile');
const cacheDir = path.join(appDir, 'cache');
const logsDir = path.join(appDir, 'logs');
const configDir = path.join(appDir, 'config');
const docsDir = env.WATTPAD_DOCS_DIR || path.join(homeDir, 'Documents', 'Wattpad', 'Novelas');
const backupDir = path.join(appDir, 'backups');

export function ensureDirectories(): void {
  const dirs = [
    appDir,
    browserProfileDir,
    cacheDir,
    logsDir,
    configDir,
    docsDir,
    backupDir,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
  }
}

export const defaultConfig: AppConfig = {
  appDir,
  browserProfileDir,
  cacheDir,
  logsDir,
  configDir,
  docsDir,
  backupDir,
  language: 'es',
  theme: {
    primary: '#FF6122',
    secondary: '#6C757D',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    background: '#121212',
    foreground: '#FFFFFF',
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  },
};

export const CONFIG = defaultConfig;
