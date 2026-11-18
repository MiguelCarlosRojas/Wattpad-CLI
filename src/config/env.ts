import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { envSchema, type EnvConfig } from './env-schema';

// Suppress dotenv noise globally
process.env.DOTENV_QUIET = 'true';

let cachedEnv: EnvConfig | null = null;

/**
 * Detects if we are running from within the Wattpad CLI source repository.
 * If so, safely loads the repository's own .env file with { quiet: true }.
 * When running as a global installed CLI or from foreign directories,
 * it avoids touching process.cwd()/.env to prevent loading foreign secrets or noisy logs.
 */
function loadIsolatedEnvironment(): void {
  try {
    // 1. Check if user has global wattpad-cli configuration file
    const userHome = os.homedir();
    const globalConfigPath = path.join(userHome, '.wattpad-cli', 'config.json');
    if (fs.existsSync(globalConfigPath)) {
      try {
        const raw = fs.readFileSync(globalConfigPath, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string' && !process.env[key]) {
            process.env[key] = value;
          }
        }
      } catch {}
    }

    // 2. Identify if local development repository
    const baseDir = typeof import.meta !== 'undefined' && import.meta.dir ? import.meta.dir : __dirname;
    const repoRoot = path.resolve(baseDir, '../../');
    const repoPkgPath = path.join(repoRoot, 'package.json');
    const repoEnvPath = path.join(repoRoot, '..', '.env'); // fallback
    const directRepoEnvPath = path.join(repoRoot, '.env');

    if (fs.existsSync(repoPkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(repoPkgPath, 'utf8'));
        if (pkg.name === '@wattpad/cli') {
          // We are in the Wattpad CLI development repository
          if (fs.existsSync(directRepoEnvPath)) {
            dotenv.config({ path: directRepoEnvPath, quiet: true });
          } else if (fs.existsSync(repoEnvPath)) {
            dotenv.config({ path: repoEnvPath, quiet: true });
          }
        }
      } catch {}
    }
  } catch {
    // Fail silently in environment isolation check
  }
}

export function loadAndValidateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  loadIsolatedEnvironment();

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('\x1b[31m[Error fatal de configuración de entorno]:\x1b[0m');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Configuración de entorno inválida');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Global typed singleton
export const env: EnvConfig = loadAndValidateEnv();

// Alias helper
export function getEnv(): EnvConfig {
  return cachedEnv || loadAndValidateEnv();
}

export { envSchema, type EnvConfig };
