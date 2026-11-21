import { APP_CONSTANTS } from './shared/constants/app.constants';

/**
 * Script instalador oficial para Windows PowerShell
 */
export function getInstallPs1(): string {
  const version = APP_CONSTANTS.VERSION;
  return `# ==============================================================================
# Wattpad CLI - Official PowerShell Installer v${version}
# Usage: irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex
# ==============================================================================

function Invoke-WattpadInstall {
    [CmdletBinding()]
    param()

    $ErrorActionPreference = "Stop"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
    } catch {}

    $Check = [char]0x2713
    $Arrow = [char]0x25B8
    $Cross = [char]0x2717
    $Sep   = [string]([char]0x2500) * 52

    Write-Host ""
    Write-Host "                        Wattpad CLI v${version}" -ForegroundColor DarkYellow
    Write-Host "                  Instalador Oficial para Windows" -ForegroundColor White
    Write-Host ""
    Write-Host "   $Sep" -ForegroundColor DarkGray

    $InstallDir  = Join-Path $HOME ".wattpad\\bin"
    $ExePath     = Join-Path $InstallDir "wattpad.exe"
    $CmdPath     = Join-Path $InstallDir "wattpad.cmd"
    $TempFile    = Join-Path $InstallDir "wattpad.exe.tmp"
    $ChecksumUrl = "https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${version}/SHA256SUMS.txt"
    $DownloadUrl = "https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${version}/wattpad.exe"

    try {
        # 1. Asegurar únicamente el directorio bin (proteger manuscritos y datos locales en .wattpad)
        if (-not (Test-Path $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }

        # 2. Limpieza de archivos temporales de instalaciones anteriores en bin
        Get-ChildItem -Path $InstallDir -Filter "wattpad.exe.tmp*" -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $InstallDir -Filter "wattpad.exe.old*" -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

        # 3. Descarga del binario a archivo temporal
        Write-Host "   $Arrow Descargando Wattpad CLI v${version}..." -ForegroundColor Cyan
        $OldProgress = $ProgressPreference
        try {
            $ProgressPreference = "SilentlyContinue"
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempFile -UseBasicParsing -TimeoutSec 180 -ErrorAction Stop
        } finally {
            $ProgressPreference = $OldProgress
        }

        # 4. Validar existencia y tamaño del archivo descargado
        if (-not (Test-Path $TempFile)) {
            throw "El archivo de instalación temporal no fue creado."
        }
        $FileSize = (Get-Item $TempFile).Length
        if ($FileSize -lt 50000000) {
            throw "El tamaño del binario descargado es inválido ($([math]::Round($FileSize / 1MB, 2)) MB). Descarga incompleta."
        }

        # 5. Comprobar integridad criptográfica SHA-256
        Write-Host "   $Arrow Verificando integridad criptográfica (SHA-256)..." -ForegroundColor Cyan
        $ExpectedHash = "af4733bc2cacd2d8b8de080a8e6ffcc6ea70dd6e5007be04e30d8afe50d344a2"
        try {
            $OldProgress = $ProgressPreference
            $ProgressPreference = "SilentlyContinue"
            $ChecksumText = (Invoke-WebRequest -Uri $ChecksumUrl -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop).Content
            $ProgressPreference = $OldProgress
            if ($ChecksumText -match "([a-fA-F0-9]{64})\\s+wattpad\\.exe") {
                $ExpectedHash = $matches[1]
            }
        } catch {
            # Si no se pudo obtener el archivo remoto, se utiliza el hash oficial embebido
        }

        $ActualHash = (Get-FileHash -Path $TempFile -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($ActualHash -ne $ExpectedHash.ToLowerInvariant()) {
            throw "La suma SHA-256 no coincide (Esperado: $ExpectedHash, Obtenido: $ActualHash)."
        }
        Write-Host "   $Check Integridad criptográfica verificada con éxito." -ForegroundColor Green

        # 6. Reemplazo seguro del ejecutable anterior
        if (Test-Path $ExePath) {
            Remove-Item -Path $ExePath -Force -ErrorAction Stop
        }
        Move-Item -Path $TempFile -Destination $ExePath -Force -ErrorAction Stop
        Write-Host "   $Check Binario instalado en: $ExePath" -ForegroundColor Green

        # 7. Creación correcta del lanzador wattpad.cmd
        $LauncherContent = "@echo off\`r\`n\`"$ExePath\`" %*\`r\`n"
        [System.IO.File]::WriteAllText($CmdPath, $LauncherContent, [System.Text.Encoding]::ASCII)
        Write-Host "   $Check Lanzador wattpad.cmd generado correctamente." -ForegroundColor Green

        # 8. Configuración segura y desduplicada del PATH de usuario
        $UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        if ($null -eq $UserPath) { $UserPath = "" }
        $PathEntries = $UserPath -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        $AlreadyInUserPath = $false
        foreach ($Entry in $PathEntries) {
            if ($Entry.Trim().TrimEnd('\\', '/') -ieq $InstallDir.Trim().TrimEnd('\\', '/')) {
                $AlreadyInUserPath = $true
                break
            }
        }
        if (-not $AlreadyInUserPath) {
            $NewUserPath = if ([string]::IsNullOrWhiteSpace($UserPath)) { $InstallDir } else { "$InstallDir;$UserPath" }
            [Environment]::SetEnvironmentVariable("Path", $NewUserPath, [EnvironmentVariableTarget]::User)
            Write-Host "   $Check Registrado en PATH de usuario." -ForegroundColor Green
        } else {
            Write-Host "   $Check Ruta ya configurada en PATH de usuario." -ForegroundColor Green
        }

        # Actualizar PATH de la sesión actual de PowerShell
        $SessionPathEntries = $env:PATH -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        $AlreadyInSessionPath = $false
        foreach ($Entry in $SessionPathEntries) {
            if ($Entry.Trim().TrimEnd('\\', '/') -ieq $InstallDir.Trim().TrimEnd('\\', '/')) {
                $AlreadyInSessionPath = $true
                break
            }
        }
        if (-not $AlreadyInSessionPath) {
            $env:PATH = "$InstallDir;$env:PATH"
        }

        Write-Host "   $Sep" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   $Check ¡Instalación de Wattpad CLI v${version} completada con éxito!" -ForegroundColor Green
        Write-Host "   Ejecuta: wattpad" -ForegroundColor DarkYellow
        Write-Host ""
    } catch {
        Write-Host "   $Cross Error durante la instalación: $($_.Exception.Message)" -ForegroundColor Red
        throw $_
    } finally {
        if ($TempFile -and (Test-Path $TempFile)) {
            Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue
        }
    }
}

Invoke-WattpadInstall
`;
}

/**
 * Script instalador oficial para Linux y macOS
 */
export function getInstallSh(): string {
  const version = APP_CONSTANTS.VERSION;
  return `#!/usr/bin/env bash
# Wattpad CLI - Official Linux/macOS Installer v${version}
# Usage: curl -fsSL https://wattpad-cli.onrender.com/cli/install.sh | bash
set -e

echo -e "\\n\\033[38;2;255;97;34mWATTPAD CLI v${version}\\033[0m"
echo -e "Instalador Oficial para Linux y macOS\\n"

TARGET_DIR="$HOME/.local/bin"
mkdir -p "$TARGET_DIR"
TARGET_FILE="$TARGET_DIR/wattpad"

DOWNLOAD_URL="https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${version}/wattpad"
echo "▸ Descargando Wattpad CLI v${version}..."

if curl -fSL "$DOWNLOAD_URL" -o "$TARGET_FILE" 2>/dev/null; then
    chmod +x "$TARGET_FILE"
    echo "✓ Wattpad CLI instalado en: $TARGET_FILE"
else
    echo "Instala Wattpad CLI mediante bun o npm:"
    echo "  bun install -g @wattpad/cli"
fi

echo "Ejecuta: wattpad"
`;
}

/**
 * Servidor HTTP de distribución y comprobación de salud para Render
 */
export async function startServer(): Promise<any> {
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';

  const server = Bun.serve({
    port,
    hostname: host,
    fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      if (method === 'OPTIONS') {
        return new Response(null, { headers });
      }

      // 1. Health check oficial (Render Health Check)
      if (path === '/health' || path === '/api/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            service: 'Wattpad CLI Distribution Server',
            version: APP_CONSTANTS.VERSION,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          }),
          { status: 200, headers }
        );
      }

      // 2. Manifiesto público de configuración y descubrimiento
      if (path === '/cli/config') {
        return new Response(
          JSON.stringify({
            version: APP_CONSTANTS.VERSION,
            minCliVersion: '1.0.0',
            binaries: {
              'win32-x64': {
                filename: 'wattpad.exe',
                downloadUrl: `https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${APP_CONSTANTS.VERSION}/wattpad.exe`,
              },
            },
            updatedAt: new Date().toISOString(),
          }),
          { status: 200, headers }
        );
      }

      // 3. Script instalador PowerShell para Windows
      if (path === '/cli/install.ps1') {
        return new Response(getInstallPs1(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }

      // 4. Script instalador Bash para Linux / macOS
      if (path === '/cli/install.sh') {
        return new Response(getInstallSh(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }

      // 5. Redirección oficial a GitHub Releases para descarga de binarios
      if (path.startsWith('/cli/download/')) {
        const target = path.replace('/cli/download/', '');
        const filename = target.includes('win') ? 'wattpad.exe' : `wattpad-${target}`;
        const releaseUrl = `https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${APP_CONSTANTS.VERSION}/${filename}`;
        return new Response(null, {
          status: 302,
          headers: {
            Location: releaseUrl,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }

      // 6. Información del servicio en la raíz
      if (path === '/') {
        return new Response(
          JSON.stringify({
            name: 'Wattpad CLI Distribution Service',
            version: APP_CONSTANTS.VERSION,
            status: 'online',
            repository: 'https://github.com/MiguelCarlosRojas/Wattpad-CLI',
            documentation: 'https://github.com/MiguelCarlosRojas/Wattpad-CLI#readme',
            releases: 'https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases',
            healthCheck: '/health',
            install: {
              powershell: 'irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex',
              bash: 'curl -fsSL https://wattpad-cli.onrender.com/cli/install.sh | bash',
            },
          }),
          { status: 200, headers }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Ruta no encontrada en el servidor de distribución de Wattpad CLI.',
        }),
        { status: 404, headers }
      );
    },
  });

  console.log(`[Wattpad CLI Server] Escuchando en http://${host}:${server.port}`);
  return server;
}

// Invocación directa si se ejecuta 'bun run src/server.ts'
if (import.meta.main) {
  startServer().catch((err) => {
    console.error('[Error Servidor]:', err);
    process.exit(1);
  });
}
