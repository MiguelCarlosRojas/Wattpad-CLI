import { z } from 'zod';

export const envSchema = z.object({
  // ==============================================
  // WATTPAD CLI - GENERAL & RUNTIME
  // ==============================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  APP_ENV: z.string().default('production'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().default(3000),

  // ==============================================
  // CLOUD URLs & DISCOVERY
  // ==============================================
  PUBLIC_APP_URL: z.string().url().default('https://wattpad-cli.onrender.com'),
  WATTPAD_API_BASE_URL: z.string().url().default('https://wattpad-cli.onrender.com'),
  WATTPAD_BOOTSTRAP_URL: z.string().url().default('https://wattpad-cli.onrender.com'),
  WATTPAD_CLI_CONFIG_URL: z.string().default('https://wattpad-cli.onrender.com/cli/config'),
  WATTPAD_CLI_INSTALL_PS1_URL: z.string().default('https://wattpad-cli.onrender.com/cli/install.ps1'),
  WATTPAD_CLI_INSTALL_SH_URL: z.string().default('https://wattpad-cli.onrender.com/cli/install.sh'),
  WATTPAD_CLI_NPM_PACKAGE: z.string().default('@wattpad/cli'),

  // ==============================================
  // POSTGRESQL CLOUD (OPCIONAL/DISTRIBUCIÓN)
  // ==============================================
  DATABASE_URL: z.string().optional().default(''),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // ==============================================
  // STORAGE CLOUD
  // ==============================================
  STORAGE_PROVIDER: z.string().default('s3'),
  STORAGE_ENDPOINT: z.string().default('https://s3.us-east-1.amazonaws.com'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_BUCKET: z.string().default('wattpad-cli-documents'),
  STORAGE_ACCESS_KEY: z.string().default(''),
  STORAGE_SECRET_KEY: z.string().default(''),
  STORAGE_PUBLIC_URL: z.string().default('https://wattpad-cli-documents.s3.us-east-1.amazonaws.com'),

  // ==============================================
  // SEGURIDAD Y CIFRADO
  // ==============================================
  JWT_ACCESS_SECRET: z.string().default('wattpad_access_super_secret_jwt_key_2026'),
  JWT_REFRESH_SECRET: z.string().default('wattpad_refresh_super_secret_jwt_key_2026'),
  SESSION_SECRET: z.string().default('wattpad_session_master_salt'),
  CREDENTIAL_ENCRYPTION_KEY: z.string().optional().default(''),
  TOKEN_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  SESSION_EXPIRATION: z.string().default('30d'),

  // ==============================================
  // GOOGLE DOCS (OAUTH HTTPS CLOUD)
  // ==============================================
  GOOGLE_CLIENT_ID: z.string().default('wattpad-cli-google-id.apps.googleusercontent.com'),
  GOOGLE_CLIENT_SECRET: z.string().default('wattpad_google_client_secret'),
  GOOGLE_REDIRECT_URI: z.string().default('https://wattpad-cli.onrender.com/api/integrations/google/callback'),
  GOOGLE_SCOPES: z.string().default('https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/drive.file'),

  // ==============================================
  // MICROSOFT WORD CLOUD
  // ==============================================
  MICROSOFT_CLIENT_ID: z.string().default('wattpad-cli-ms-client-id'),
  MICROSOFT_CLIENT_SECRET: z.string().default('wattpad_ms_client_secret'),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  MICROSOFT_REDIRECT_URI: z.string().default('https://wattpad-cli.onrender.com/api/integrations/word/callback'),
  MICROSOFT_SCOPES: z.string().default('Files.ReadWrite,offline_access'),

  // ==============================================
  // WATTPAD API INTEGRATION
  // ==============================================
  WATTPAD_AUTH_PROVIDER: z.string().default('official'),
  WATTPAD_API_CONFIGURATION: z.string().default('v4'),
  WATTPAD_REQUEST_TIMEOUT: z.coerce.number().default(15000),
  WATTPAD_RETRY_LIMIT: z.coerce.number().default(3),

  // ==============================================
  // API ROUTES
  // ==============================================
  API_ROUTE_HEALTH: z.string().default('/api/health'),
  API_ROUTE_PUBLIC_CONFIG: z.string().default('/cli/config'),
  API_ROUTE_AUTH_LOGIN: z.string().default('/api/auth/login'),
  API_ROUTE_AUTH_START: z.string().default('/api/auth/start'),
  API_ROUTE_AUTH_CALLBACK: z.string().default('/api/auth/callback'),
  API_ROUTE_AUTH_REFRESH: z.string().default('/api/auth/refresh'),
  API_ROUTE_AUTH_LOGOUT: z.string().default('/api/auth/logout'),
  API_ROUTE_PROFILE: z.string().default('/api/users/profile'),
  API_ROUTE_PROFILE_UPDATE: z.string().default('/api/users/profile'),
  API_ROUTE_INBOX: z.string().default('/api/inbox'),
  API_ROUTE_LIBRARY: z.string().default('/api/library'),
  API_ROUTE_STORIES: z.string().default('/api/stories'),
  API_ROUTE_STORY_CREATE: z.string().default('/api/stories'),
  API_ROUTE_STORY_UPDATE: z.string().default('/api/stories/:id'),
  API_ROUTE_STORY_DELETE: z.string().default('/api/stories/:id'),
  API_ROUTE_CHAPTERS: z.string().default('/api/chapters'),
  API_ROUTE_CHAPTER_CREATE: z.string().default('/api/chapters'),
  API_ROUTE_CHAPTER_UPDATE: z.string().default('/api/chapters/:id'),
  API_ROUTE_CHAPTER_DELETE: z.string().default('/api/chapters/:id'),
  API_ROUTE_DOCUMENT_UPLOAD: z.string().default('/api/documents/upload'),
  API_ROUTE_DOCUMENT_DOWNLOAD: z.string().default('/api/documents/:id/download'),
  API_ROUTE_SYNC: z.string().default('/api/sync'),
  API_ROUTE_SYNC_HISTORY: z.string().default('/api/sync/history'),
  API_ROUTE_EXPLORE: z.string().default('/api/explore'),
  API_ROUTE_SEARCH: z.string().default('/api/search'),
  API_ROUTE_PUBLISH: z.string().default('/api/publish'),

  // ==============================================
  // OPERACIONES Y LIMITES
  // ==============================================
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120),

  // ==============================================
  // OBSERVABILIDAD
  // ==============================================
  SENTRY_DSN: z.string().optional().default(''),
  TELEMETRY_ENABLED: z.coerce.boolean().default(false),

  // ==============================================
  // LOCAL DIRS (CONFIGURABLES)
  // ==============================================
  WATTPAD_APP_DIR: z.string().optional(),
  WATTPAD_DOCS_DIR: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
