import fs from 'fs';
import path from 'path';
import { getEnv } from '../../shared/env-validator';
import { PublicCliConfig } from '../../shared/types';

export class CliController {
  public static getPublicConfig(): PublicCliConfig {
    const env = getEnv();
    return {
      version: '1.0.0',
      minCliVersion: '1.0.0',
      apiBaseUrl: env.WATTPAD_API_BASE_URL,
      publicAppUrl: env.PUBLIC_APP_URL,
      serverStatus: 'healthy',
      features: {
        googleDocsOAuth: true,
        wordCloudSync: true,
        cloudPostgres: true,
        s3Storage: true,
      },
      installerEndpoints: {
        powershell: `${env.WATTPAD_API_BASE_URL}/cli/install.ps1`,
        linuxMac: `${env.WATTPAD_API_BASE_URL}/cli/install.sh`,
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
      return fs.readFileSync(scriptPath, 'utf8');
    }
    return '# Wattpad CLI installer\nWrite-Host "Instalador no encontrado."';
  }

  public static getInstallSh(): string {
    const scriptPath = path.resolve(process.cwd(), 'installers/install.sh');
    if (fs.existsSync(scriptPath)) {
      return fs.readFileSync(scriptPath, 'utf8');
    }
    return '#!/usr/bin/env bash\necho "Instalador no encontrado."';
  }
}
