import fs from 'fs';
import path from 'path';
import { getEnv } from '../../shared/env-validator';
import { PublicCliConfig } from '../../shared/types';

export class CliController {
  public static getPublicConfig(): PublicCliConfig {
    const env = getEnv();
    return {
      version: '1.1.0',
      minCliVersion: '1.0.0',
      apiBaseUrl: env.WATTPAD_API_BASE_URL,
      publicAppUrl: env.PUBLIC_APP_URL,
      serverStatus: 'healthy',
      features: {
        googleDocsOAuth: true,
        wordImport: true,
        notepadImport: true,
        browserAuth: true,
      },
      installerEndpoints: {
        powershell: `${env.WATTPAD_API_BASE_URL}/cli/install.ps1`,
        linuxMac: `${env.WATTPAD_API_BASE_URL}/cli/install.sh`,
      },
      binaries: {
        'win32-x64': {
          filename: 'wattpad.exe',
          sha256: '8563063da27ed8985eba86432d1ec90fb2975a74a8ff235c2769b1e90748a8ee',
          size: 156900352,
          downloadUrl: `${env.WATTPAD_API_BASE_URL}/cli/download/win32-x64`,
        },
      },
      routes: {
        health: env.API_ROUTE_HEALTH,
        config: env.API_ROUTE_PUBLIC_CONFIG,
        authStart: env.API_ROUTE_AUTH_START,
        profile: env.API_ROUTE_PROFILE,
        stories: env.API_ROUTE_STORIES,
        chapters: env.API_ROUTE_CHAPTERS,
        sync: env.API_ROUTE_SYNC,
        explore: env.API_ROUTE_EXPLORE,
        search: env.API_ROUTE_SEARCH,
        publish: env.API_ROUTE_PUBLISH,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  public static getInstallPs1(): string {
    const scriptPath = path.resolve(process.cwd(), 'installers/install.ps1');
    if (fs.existsSync(scriptPath)) {
      let content = fs.readFileSync(scriptPath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }
    return '# Wattpad CLI installer\nWrite-Host "[ERROR] Instalador no encontrado." -ForegroundColor Red';
  }

  public static getInstallSh(): string {
    const scriptPath = path.resolve(process.cwd(), 'installers/install.sh');
    if (fs.existsSync(scriptPath)) {
      let content = fs.readFileSync(scriptPath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }
    return '#!/usr/bin/env bash\necho "Instalador no encontrado."';
  }

  public static getDownloadUrl(target: string): string {
    const filename = target.includes('win') ? 'wattpad.exe' : `wattpad-${target}`;
    return `https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/latest/download/${filename}`;
  }
}
