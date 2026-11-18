import dotenv from 'dotenv';
import path from 'path';
import { envSchema, type EnvConfig } from './env-schema';

// Load .env if present in current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let cachedEnv: EnvConfig | null = null;

export function loadAndValidateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('\x1b[31m[Error fatal de configuración .env]:\x1b[0m');
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
