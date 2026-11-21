import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar .env.production si existe en el entorno
const prodEnvPath = path.resolve(process.cwd(), '.env.production');
if (fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath, override: false });
}

/**
 * Esquema Zod tipado y validado para variables de entorno de Wattpad CLI
 */
export const envSchema = z.object({
  // === APLICACIÓN ===
  NODE_ENV: z.enum(['production', 'development', 'test']).default('production'),
  APP_ENV: z.enum(['production', 'development', 'staging']).default('production'),
  LOG_LEVEL: z.enum(['silent', 'error', 'warn', 'info', 'debug']).default('info'),

  // === WATTPAD ===
  WATTPAD_BASE_URL: z.string().url().default('https://www.wattpad.com'),
  WATTPAD_API_BASE: z.string().url().default('https://www.wattpad.com/api/v3'),
  WATTPAD_TIMEOUT_MS: z.coerce.number().positive().default(10000),
  WATTPAD_USER_AGENT: z
    .string()
    .default(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ),

  // === AUTENTICACIÓN Y SEGURIDAD ===
  WATTPAD_VAULT_SALT: z.string().default('wattpad-sovereign-salt'),

  // === NAVEGADOR (PLAYWRIGHT) ===
  WATTPAD_BROWSER_EXECUTABLE_PATH: z.string().optional(),
  WATTPAD_BROWSER_HEADLESS: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  // === PERSISTENCIA LOCAL ===
  WATTPAD_DATA_DIR: z.string().optional(),
  WATTPAD_AUTOSAVE_INTERVAL: z.coerce.number().positive().default(20),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    return envSchema.parse({});
  }
  return result.data;
}

export const env: EnvConfig = loadEnv();
