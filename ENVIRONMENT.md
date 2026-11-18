# Configuración de Variables de Entorno — Wattpad CLI

> **Guía oficial de configuración y arquitectura de variables de entorno para Wattpad CLI y su backend cloud.**
>
> Toda la configuración del sistema está estrictamente centralizada y validada mediante esquemas fuertemente tipados con **Zod** en `src/config/env-schema.ts` y administrada por el módulo singleton `src/config/env.ts`.

---

## 🔒 Reglas Fundamentales de Seguridad

1. **Exclusión estricta de archivos `.env` en Git**:
   - Ningún archivo `.env`, `.env.*` ni credenciales privadas se suben al repositorio bajo ninguna circunstancia.
   - Las variables en producción se configuran exclusivamente en el panel de control del servicio cloud (**Render**).
2. **Cero claves derivadas de información del equipo**:
   - Queda terminantemente prohibido utilizar `os.hostname()`, `COMPUTERNAME`, `USERNAME` o información de la máquina para derivar claves criptográficas.
   - La seguridad se basa en generación criptográfica aleatoria segura (256-bit AES-GCM) y secretos inyectados en la nube.
3. **Cero dependencias de Localhost**:
   - Los servicios en la nube y el CLI se comunican exclusivamente vía HTTPS con el backend oficial `https://wattpad.onrender.com`.

---

## 📋 Inventario Completo de Variables de Entorno

### 1. General & Runtime

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | `production` | Entorno de ejecución (`development`, `production`, `test`). |
| `APP_ENV` | `string` | `production` | Entorno de la aplicación. |
| `LOG_LEVEL` | `string` | `info` | Nivel de registro (`debug`, `info`, `warn`, `error`). |
| `PORT` | `number` | `3000` | Puerto en el que escucha el servidor API cloud de Bun. |

### 2. Cloud URLs & Descubrimiento

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `PUBLIC_APP_URL` | `url` | `https://wattpad.onrender.com` | URL pública de la aplicación. |
| `WATTPAD_API_BASE_URL` | `url` | `https://wattpad.onrender.com` | URL base del backend REST API consumido por el CLI. |
| `WATTPAD_BOOTSTRAP_URL` | `url` | `https://wattpad.onrender.com` | URL inicial de arranque y resolución de configuración. |
| `WATTPAD_CLI_CONFIG_URL` | `string` | `https://wattpad.onrender.com/cli/config` | Endpoint público de autodescubrimiento para el CLI. |
| `WATTPAD_CLI_INSTALL_PS1_URL` | `string` | `https://wattpad.onrender.com/cli/install.ps1` | Endpoint para el script instalador de Windows PowerShell. |
| `WATTPAD_CLI_INSTALL_SH_URL` | `string` | `https://wattpad.onrender.com/cli/install.sh` | Endpoint para el script instalador de Linux / macOS. |
| `WATTPAD_CLI_NPM_PACKAGE` | `string` | `@wattpad/cli` | Nombre del paquete en el registro oficial de NPM. |

### 3. Base de Datos Cloud (PostgreSQL)

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `string` | `""` *(memoria fallback)* | Cadena de conexión PostgreSQL administrada en Render. |
| `DATABASE_POOL_MIN` | `number` | `2` | Cantidad mínima de conexiones en el pool. |
| `DATABASE_POOL_MAX` | `number` | `10` | Cantidad máxima de conexiones en el pool. |

### 4. Almacenamiento Cloud de Documentos (S3 / Object Storage)

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `STORAGE_PROVIDER` | `string` | `s3` | Proveedor de almacenamiento cloud de documentos y respaldos. |
| `STORAGE_ENDPOINT` | `string` | `https://s3.us-east-1.amazonaws.com` | Endpoint del servicio S3 compatible. |
| `STORAGE_REGION` | `string` | `us-east-1` | Región del bucket cloud. |
| `STORAGE_BUCKET` | `string` | `wattpad-cli-documents` | Nombre del bucket para almacenar DOCX, TXT y backups. |
| `STORAGE_ACCESS_KEY` | `string` | `""` | Llave de acceso de la API de almacenamiento. |
| `STORAGE_SECRET_KEY` | `string` | `""` | Llave secreta de la API de almacenamiento. |
| `STORAGE_PUBLIC_URL` | `string` | `https://wattpad-cli-documents.s3.us-east-1.amazonaws.com` | URL pública de descarga o CDN. |

### 5. Seguridad & Criptografía

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `JWT_ACCESS_SECRET` | `string` | `wattpad_access_super_secret...` | Secreto maestro para firmar tokens JWT de acceso en la nube. |
| `JWT_REFRESH_SECRET` | `string` | `wattpad_refresh_super_secret...` | Secreto para firmar tokens de refresco de sesión. |
| `SESSION_SECRET` | `string` | `wattpad_session_master_salt` | Salting maestro para sesiones y cookies seguras. |
| `CREDENTIAL_ENCRYPTION_KEY`| `string` | `""` *(generada localmente)* | Llave criptográfica de 256 bits para el baúl local. |
| `TOKEN_ENCRYPTION_KEY` | `string` | `0123456789abcdef...` | Clave de cifrado simétrico para tokens en tránsito/reposo. |
| `SESSION_EXPIRATION` | `string` | `30d` | Tiempo de expiración de sesión del usuario. |

### 6. Integraciones Cloud (Google Docs & Microsoft Word)

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | `string` | *(ID cliente Google OAuth)* | Client ID oficial de la consola de Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | `string` | *(Secret cliente Google OAuth)* | Client Secret de la API de Google Docs. |
| `GOOGLE_REDIRECT_URI` | `string` | `https://wattpad.onrender.com/api/integrations/google/callback` | Callback HTTPS en Render (sin localhost). |
| `GOOGLE_SCOPES` | `string` | `documents,drive.file` | Permisos solicitados a Google Docs y Drive. |
| `MICROSOFT_CLIENT_ID` | `string` | *(ID cliente Microsoft)* | Client ID de Azure Active Directory para Office 365. |
| `MICROSOFT_CLIENT_SECRET` | `string` | *(Secret cliente Microsoft)* | Client Secret de Microsoft Graph. |
| `MICROSOFT_TENANT_ID` | `string` | `common` | Tenant ID de Azure AD. |
| `MICROSOFT_REDIRECT_URI` | `string` | `https://wattpad.onrender.com/api/integrations/word/callback` | Callback HTTPS en Render para Word Cloud. |

### 7. Integración con Wattpad

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `WATTPAD_AUTH_PROVIDER` | `string` | `official` | Proveedor de autenticación Wattpad Cloud. |
| `WATTPAD_API_CONFIGURATION` | `string` | `v4` | Versión de la API de Wattpad utilizada. |
| `WATTPAD_REQUEST_TIMEOUT` | `number` | `15000` | Tiempo límite de solicitudes en milisegundos. |
| `WATTPAD_RETRY_LIMIT` | `number` | `3` | Límite de reintentos automáticos ante fallas transitorias. |

### 8. Operaciones, Límites & Observabilidad

| Variable | Tipo | Valor Predeterminado (Dev) | Descripción |
| :--- | :--- | :--- | :--- |
| `CORS_ALLOWED_ORIGINS` | `string` | `*` | Orígenes CORS permitidos para la API REST. |
| `RATE_LIMIT_WINDOW` | `number` | `60000` | Ventana de rate limiting en milisegundos (1 minuto). |
| `RATE_LIMIT_MAX_REQUESTS` | `number` | `120` | Solicitudes máximas permitidas por ventana. |
| `SENTRY_DSN` | `string` | `""` | DSN de Sentry para reporte de excepciones. |
| `TELEMETRY_ENABLED` | `boolean` | `false` | Bandera para envío de telemetría anónima. |

---

## 🚀 Despliegue en Render (Producción)

Para desplegar el backend en **Render**:
1. Conecta el repositorio `https://github.com/MiguelCarlosRojas/Wattpad-CLI`.
2. Selecciona **Web Service** con entorno **Bun** o **Node/Bun Docker**.
3. Comando de inicio: `bun run src/api/server.ts`.
4. Añade un **PostgreSQL Database** en Render y vincula automáticamente la variable `DATABASE_URL`.
5. Define las variables secretas (`JWT_ACCESS_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.) en la pestaña **Environment** de Render.
