# Manual de Compilación, Publicación y Distribución — Wattpad CLI

> **Guía oficial para la compilación local, validación de integridad criptográfica y publicación manual en GitHub Releases y Render Cloud.**
>
> **Política de Distribución:** Este repositorio ha eliminado por completo la dependencia de GitHub Actions. Todas las compilaciones de binarios nativos y publicaciones de versiones son manuales, verificables y controladas directamente por el desarrollador en su entorno local. El backend cloud en Render continúa desplegándose de forma continua y autónoma a través de la integración nativa de Git con Render.

---

## 📋 Arquitectura de Publicación Manual

```
┌────────────────────────────────────────────────────────┐
│               DESARROLLO Y VALIDACIÓN LOCAL            │
│  1. bun install                                        │
│  2. bun run typecheck                                  │
│  3. bun test                                           │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 COMPILACIÓN DE ARTEFACTOS              │
│  • CLI Nativo:    bun run build:cli (dist/wattpad.exe) │
│  • Backend API:   bun run build:api (dist/server.js)   │
│  • Integridad:    bun run build:checksums              │
│                   (dist/SHA256SUMS.txt)                │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│             DISTRIBUCIÓN Y SINCRONIZACIÓN              │
│  A. Publicar Release en GitHub (gh release create)     │
│  B. Validar descarga pública y hash SHA-256            │
│  C. Actualizar metadatos en backend (/cli/config)      │
│  D. Git push main -> Despliegue automático en Render   │
└────────────────────────────────────────────────────────┘
```

---

## 🛡️ Reglas y Políticas Críticas

1. **Sin Dependencia de GitHub Actions:** No existen ni deben crearse workflows YAML en `.github/workflows/`. Las compilaciones automáticas han sido retiradas debido a políticas de facturación de GitHub.
2. **Protección del Tag Histórico:** Queda terminantemente prohibido sobrescribir o eliminar el tag histórico `v1.0.0`.
3. **Cero Tokens en el Código:** Jamás almacenes ni insertes Personal Access Tokens (PAT), secretos de GitHub o credenciales en el código fuente ni en archivos de configuración rastreados por Git.
4. **Honestidad de Plataformas:** No declares ejecutables para sistemas operativos o arquitecturas en las que no se haya compilado y probado efectivamente el binario. Debido a dependencias nativas del motor TUI (OpenTUI), las compilaciones multiplataforma requieren ser ejecutadas en su respectivo entorno de destino (o contenedor nativo).
5. **Sincronización Secuencial:** Nunca actualices el hash de `/cli/config` en el backend antes de que el binario esté efectivamente subido y verificado en GitHub Releases.

---

## 🚀 Procedimiento de Publicación Paso a Paso

### Paso 1: Validaciones de Código y Pruebas

Antes de generar cualquier artefacto de distribución, asegúrate de que el código cumpla con las políticas de calidad estrictas:

```bash
# 1. Asegurar dependencias sincronizadas
bun install

# 2. Comprobación estricta de tipos TypeScript
bun run typecheck

# 3. Ejecución de la suite completa de pruebas (100% aprobadas requerido)
bun test
```

> [!IMPORTANT]
> No continúes si alguna prueba falla o si `tsc --noEmit` reporta errores tipográficos.

---

### Paso 2: Compilación de Artefactos

Compila el binario ejecutable de la CLI y el bundle de producción del servidor backend:

```bash
# 1. Compilar el ejecutable nativo de Wattpad CLI
bun run build:cli

# 2. Compilar el servidor backend para producción
bun run build:api
```

Verifica la existencia y validez de los artefactos generados en `dist/`:
- `dist/wattpad.exe` (en Windows x64): Tamaño aproximado ~126-130 MB.
- `dist/server.js`: Tamaño aproximado ~0.38 MB.

Verifica la ejecución local del binario generado antes de publicarlo:
```bash
./dist/wattpad.exe /version
./dist/wattpad.exe /help
```

---

### Paso 3: Generación de Sumas de Integridad (SHA-256)

Genera el archivo estándar `SHA256SUMS.txt` con el script oficial del proyecto:

```bash
bun run build:checksums
```

O de forma manual:

**En Windows (PowerShell):**
```powershell
Get-FileHash dist/wattpad.exe -Algorithm SHA256 | ForEach-Object { "$($_.Hash.ToLower())  $($_.Path | Split-Path -Leaf)" } | Out-File -Encoding utf8 dist/SHA256SUMS.txt
```

**En Linux / macOS:**
```bash
cd dist && sha256sum wattpad* > SHA256SUMS.txt && cd ..
```

Comprueba el contenido de `dist/SHA256SUMS.txt`:
```text
89f1f855dc6ab0946105e6bcb385bc1226c34c4da6a788ba5b329ad252a9fc74  wattpad.exe
```

---

### Paso 4: Publicación en GitHub Releases

#### Opción A: Mediante GitHub CLI (`gh`) — Recomendada

Asegúrate de haber iniciado sesión con `gh auth login` o verificar tu sesión con `gh auth status`.

```powershell
# Ejemplo para la versión v1.1.0:
gh release create v1.1.0 dist/wattpad.exe dist/SHA256SUMS.txt `
  --title "Wattpad CLI v1.1.0" `
  --notes "Versión v1.1.0 de Wattpad CLI compilada manualmente. Incluye binario nativo Windows x64 y archivo de verificación SHA-256."
```

#### Opción B: Mediante la Interfaz Web de GitHub

1. Navega a `https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases`.
2. Haz clic en **Draft a new release**.
3. Selecciona o crea la etiqueta de versión (ejemplo: `v1.1.0`) apuntando a la rama `main`.
4. Asigna el título de la release (ejemplo: `Wattpad CLI v1.1.0`).
5. Redacta las notas de la versión.
6. Arrastra y suelta en el área de archivos:
   - `dist/wattpad.exe`
   - `dist/SHA256SUMS.txt`
7. Haz clic en **Publish release**.

---

### Paso 5: Sincronización del Backend Cloud en Render

Una vez que el binario esté publicado en GitHub Releases:

1. Obtén el hash SHA-256 en mayúsculas de `wattpad.exe` y su tamaño en bytes exacto:
   ```powershell
   Get-FileHash dist/wattpad.exe -Algorithm SHA256
   (Get-Item dist/wattpad.exe).Length
   ```

2. Actualiza `src/api/controllers/cli.controller.ts` con la nueva versión y metadatos:
   ```typescript
   export class CliController {
     public static getPublicConfig(): PublicCliConfig {
       const env = getEnv();
       return {
         version: '1.1.0',
         minCliVersion: '1.0.0',
         // ...
         binaries: {
           'win32-x64': {
             filename: 'wattpad.exe',
             sha256: '<HASH_OBTENIDO_EN_MAYÚSCULAS>',
             size: <TAMAÑO_EN_BYTES>,
             downloadUrl: `${env.WATTPAD_API_BASE_URL}/cli/download/win32-x64`,
           },
         },
         // ...
       };
     }
   }
   ```

3. Actualiza la versión en `package.json` si corresponde.
4. Haz commit y push a la rama `main`:
   ```bash
   git add package.json src/api/controllers/cli.controller.ts
   git commit -m "chore(release): registrar metadatos de v1.1.0 en backend cloud"
   git push origin main
   ```
5. **Render** detectará el push a `main` y desplegará automáticamente la actualización del backend sin requerir GitHub Actions.

---

## 🖥️ Matriz de Compilación Multiplataforma

El motor de interfaz OpenTUI y ciertas extensiones de bajo nivel requieren binarios compilados en su arquitectura y sistema operativo anfitrión.

| Plataforma | Target | Estado Actual | Procedimiento de Compilación |
| :--- | :--- | :--- | :--- |
| **Windows x64** | `windows-x64` | **Soportado y Verificado** | `bun run build:cli --target=windows-x64` desde Windows x64. Genera `dist/wattpad.exe`. |
| **Linux x64** | `linux-x64` | **Pendiente de Entorno** | Ejecutar desde máquina Linux x64 o contenedor Ubuntu 24.04: `bun run build:cli --target=linux-x64`. Genera `dist/wattpad-linux-x64`. |
| **macOS ARM64** | `darwin-arm64` | **Pendiente de Entorno** | Ejecutar desde Mac Apple Silicon (M1/M2/M3/M4): `bun run build:cli --target=darwin-arm64`. Genera `dist/wattpad-darwin-arm64`. |
| **macOS x64** | `darwin-x64` | **Pendiente de Entorno** | Ejecutar desde Mac Intel x64: `bun run build:cli --target=darwin-x64`. Genera `dist/wattpad-darwin-x64`. |

> [!WARNING]
> Nunca simules compilaciones cruzadas ni publiques binarios renombrados sin haber sido compilados y ejecutados en su sistema anfitrión. Hasta disponer de máquinas Linux o macOS físicas o dedicadas, publica únicamente `wattpad.exe` (Windows x64).

---

## 🌐 Mantenimiento del Backend en Render

El backend oficial (`https://wattpad-cli.onrender.com`) **no tiene ninguna dependencia con GitHub Actions**:

- **Mecanismo de Despliegue:** Render monitorea directamente los commits en la rama `main` de `https://github.com/MiguelCarlosRojas/Wattpad-CLI`.
- **Comando de Compilación en Render:** `bun install && bun run build:api` (o `bun run build`).
- **Comando de Inicio en Render:** `bun run start:api`.
- **Servicios Integrados:**
  - PostgreSQL Remoto (`DATABASE_URL`).
  - Google Docs OAuth2 HTTPS (`/api/integrations/google/callback`).
  - Endpoints de Instalación (`/cli/install.ps1`, `/cli/install.sh`).
  - Autodescubrimiento (`/cli/config`).
  - Redirección de Descargas (`/cli/download/:target`).

---

## 🧹 Limpieza del Historial de GitHub Actions

Si en el futuro existen ejecuciones residuales o incompletas en la pestaña **Actions** de GitHub:

### Vía GitHub CLI (`gh`):
```bash
# Listar ejecuciones
gh run list

# Eliminar una ejecución por ID
gh run delete <RUN_ID>
```

### Vía Interfaz Web de GitHub:
1. Ve al repositorio en GitHub: `https://github.com/MiguelCarlosRojas/Wattpad-CLI`.
2. Haz clic en la pestaña **Actions**.
3. Selecciona la ejecución que deseas eliminar del listado.
4. En la esquina superior derecha de los detalles del run, haz clic en el botón de tres puntos `...` (**More options**).
5. Selecciona **Delete workflow run** y confirma la acción.

---

## 🔒 Desactivación de Actions en la Configuración del Repositorio

Para garantizar que GitHub Actions permanezca completamente deshabilitado en el repositorio (evitando cualquier intento de cobro o disparo involuntario):

1. Ve a **Settings** en el repositorio `Wattpad-CLI`.
2. En el menú lateral izquierdo, haz clic en **Actions** → **General**.
3. En la sección **Actions permissions**, selecciona:
   - 🔘 **Disable actions**: *No actions are allowed.*
4. Haz clic en **Save**.
