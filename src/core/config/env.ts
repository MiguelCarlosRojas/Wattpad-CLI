import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { envSchema, type EnvConfig } from './env-schema';

process.env.DOTENV_QUIET = 'true';

let cachedEnv: EnvConfig | null = null;

function loadIsolatedEnvironment(): void {
  try {
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

    const baseDir = typeof import.meta !== 'undefined' && import.meta.dir ? import.meta.dir : __dirname;
    // Walk up looking for package.json to find repo root
    let curr = baseDir;
    for (let i = 0; i < 5; i++) {
      const candidatePkg = path.join(curr, 'package.json');
      if (fs.existsSync(candidatePkg)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(candidatePkg, 'utf8'));
          if (pkg.name === '@wattpad/cli') {
            const directEnv = path.join(curr, '.env');
            if (fs.existsSync(directEnv)) {
              dotenv.config({ path: directEnv, quiet: true });
            }
            break;
          }
        } catch {}
      }
      curr = path.dirname(curr);
    }
  } catch {}
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

export const env: EnvConfig = loadAndValidateEnv();

export function getEnv(): EnvConfig {
  return cachedEnv || loadAndValidateEnv();
}

export { envSchema, type EnvConfig };
