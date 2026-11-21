# Configuración de Variables de Entorno — Wattpad CLI v1.0.0

> **Guía oficial de configuración y arquitectura de variables de entorno para Wattpad CLI.**
>
> Toda la configuración del sistema está estrictamente centralizada, tipada y validada en tiempo de ejecución mediante **Zod** en [src/shared/config/env.config.ts](file:///C:/Users/isaki/Videos/Visual%20Studio%20Code/dbSalesWine/src/shared/config/env.config.ts).

---

## 🔒 Reglas Fundamentales de Seguridad

1. **Exclusión estricta de archivos `.env` en Git**:
   - Ningún archivo `.env`, `.env.*` ni credenciales privadas se suben al repositorio bajo ninguna circunstancia.
   - `.gitignore` excluye permanentemente `.env` y `.env.*`.
2. **Arquitectura Soberana sin Bases de Datos Externas**:
   - Wattpad CLI opera de forma local soberana. La persistencia de manuscritos, capítulos y borradores se almacena en el directorio de usuario (`~/.wattpad/`).
   - No requiere PostgreSQL, Redis, SQLite ni almacenamiento S3/R2 externo.
3. **Cero Almacenamiento de Contraseñas en Texto Plano**:
   - Las sesiones de Wattpad se gestionan mediante tokens y cookies oficiales, protegidas localmente mediante la bóveda criptográfica AES-256 (`CryptoVault`).

---

## 📋 Inventario de Variables de Entorno (.env.production)

### 1. Aplicación (Obligatorias)

| Variable | Tipo | Valor Predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `enum` | `production` | Entorno de ejecución (`production`, `development`, `test`). |
| `APP_ENV` | `enum` | `production` | Identificador de entorno de la aplicación. |
| `LOG_LEVEL` | `enum` | `info` | Nivel de registros en terminal (`silent`, `error`, `warn`, `info`, `debug`). |

### 2. Integración Oficial con Wattpad (Obligatorias)

| Variable | Tipo | Valor Predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `WATTPAD_BASE_URL` | `url` | `https://www.wattpad.com` | Dirección web oficial de Wattpad. |
| `WATTPAD_API_BASE` | `url` | `https://www.wattpad.com/api/v3` | Endpoint base de la API REST oficial de Wattpad v3. |
| `WATTPAD_TIMEOUT_MS`| `number` | `10000` | Tiempo límite en milisegundos para peticiones HTTP. |
| `WATTPAD_USER_AGENT`| `string` | *(Chrome User-Agent)* | Cadena User-Agent para garantizar compatibilidad con los servicios de Wattpad. |

### 3. Autenticación y Seguridad (Opcionales con fallback seguro)

| Variable | Tipo | Valor Predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `WATTPAD_VAULT_SALT`| `string` | `wattpad-sovereign-salt` | Sal adicional para la derivación de clave criptográfica local AES-256. |

### 4. Navegador y Playwright (Opcionales)

| Variable | Tipo | Valor Predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `WATTPAD_BROWSER_EXECUTABLE_PATH` | `string` | *(Detección automática)* | Ruta personalizada al ejecutable de Google Chrome o Microsoft Edge. |
| `WATTPAD_BROWSER_HEADLESS` | `boolean` | `false` | Ejecución en modo headless. Por defecto `false` para permitir inicio de sesión interactivo oficial. |

### 5. Persistencia Local (Opcionales)

| Variable | Tipo | Valor Predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `WATTPAD_DATA_DIR` | `string` | `~/.wattpad` | Ruta personalizada al directorio raíz de datos (permite modo portable o aislado). |
| `WATTPAD_AUTOSAVE_INTERVAL` | `number` | `20` | Intervalo de auto-guardado en segundos para el editor de capítulos. |

---

## 🛠️ Carga y Validación con Bun y TypeScript

El archivo [src/shared/config/env.config.ts](file:///C:/Users/isaki/Videos/Visual%20Studio%20Code/dbSalesWine/src/shared/config/env.config.ts) gestiona la carga sin colisiones:
1. Comprueba la existencia de `.env.production` y lo lee si está presente sin sobreescribir variables existentes en el entorno anfitrión.
2. Valida estrictamente todos los campos mediante el esquema `envSchema` de **Zod**.
3. Aplica valores por defecto seguros y previene fallos silenciosos.

---

## 🚀 Despliegue en Render (Web Service de Distribución)

Wattpad CLI incluye un servidor HTTP de distribución independiente en `src/server.ts` optimizado para Render:

- **Build Command:** `bun install --frozen-lockfile && bun run build`
- **Start Command:** `bun run start:server` (o `bun run start`)
- **Health Check Path:** `/health`
- **Host / IP:** `0.0.0.0`
- **Puerto:** Inyectado dinámicamente por Render mediante la variable `PORT`.
- **Funcionalidad:** Sirve instaladores oficiales (`/cli/install.ps1`, `/cli/install.sh`), comprobación de salud (`/health`), manifiesto de configuración (`/cli/config`) y redirecciones oficiales a GitHub Releases (`/cli/download/:target`).
