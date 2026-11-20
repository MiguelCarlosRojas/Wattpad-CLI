import fs from 'fs';
import path from 'path';
import { getEnv } from '../../core/config/env';
import { PublicCliConfig } from '../../core/types/distribution.types';

export class CliController {
  /**
   * Obtiene el manifiesto de distribución generado automáticamente
   */
  public static getManifest(): any {
    const candidates = [
      path.resolve(process.cwd(), 'src/platform/distribution/distribution-manifest.json'),
      path.resolve(process.cwd(), 'dist/distribution-manifest.json'),
      path.resolve(__dirname, 'distribution-manifest.json'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        try {
          const raw = fs.readFileSync(candidate, 'utf8');
          return JSON.parse(raw);
        } catch {}
      }
    }
    return null;
  }

  public static getPublicConfig(): PublicCliConfig {
    const env = getEnv();
    const manifest = this.getManifest();
    const version = manifest?.version || '1.2.0';

    const binaries: Record<string, any> = {};
    if (manifest && manifest.binaries) {
      for (const [targetKey, meta] of Object.entries<any>(manifest.binaries)) {
        binaries[targetKey] = {
          filename: meta.filename,
          sha256: meta.sha256,
          size: meta.size,
          downloadUrl: `${env.WATTPAD_API_BASE_URL}/cli/download/${targetKey}`,
        };
      }
    } else {
      // Fallback seguro si aún no se ha compilado el manifiesto
      binaries['win32-x64'] = {
        filename: 'wattpad.exe',
        sha256: 'fe1601513d87e9fa68a2cac72a1c6dde5451958f05af416b41ea640b744a4b96',
        size: 156960256,
        downloadUrl: `${env.WATTPAD_API_BASE_URL}/cli/download/win32-x64`,
      };
    }

    return {
      version,
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
      binaries,
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
      updatedAt: manifest?.generatedAt || new Date().toISOString(),
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
    const manifest = this.getManifest();
    const version = manifest?.version || '1.2.0';
    const filename = target.includes('win') ? 'wattpad.exe' : `wattpad-${target}`;
    return `https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${version}/${filename}`;
  }
}
