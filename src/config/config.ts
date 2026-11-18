import path from 'path';
import os from 'os';
import fs from 'fs';
import { env } from './env';

export interface AppConfig {
  appDir: string;
  dbPath: string;
  docsDir: string;
  backupDir: string;
  language: 'es' | 'en';
  theme: {
    primary: string; // Wattpad Orange #FF6122
    secondary: string; // Grey #6C757D
    success: string; // Green #28A745
    warning: string; // Yellow #FFC107
    error: string; // Red #DC3545
    info: string; // Cyan #17A2B8
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
const docsDir = env.WATTPAD_DOCS_DIR || path.join(homeDir, 'Documents', 'Wattpad', 'Novelas');
const backupDir = path.join(appDir, 'backups');
const dbPath = env.WATTPAD_DB_PATH || path.join(appDir, 'wattpad.db');

export function ensureDirectories(): void {
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

export const defaultConfig: AppConfig = {
  appDir,
  dbPath,
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
