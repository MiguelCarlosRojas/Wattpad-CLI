import { APP_CONSTANTS } from './shared/constants/app.constants';

/**
 * Script instalador oficial para Windows PowerShell
 */
function getInstallPs1(): string {
  const version = APP_CONSTANTS.VERSION;
  return `# ==============================================================================
# Wattpad CLI - Official PowerShell Installer v${version}
# Usage: irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex
# ==============================================================================

function Invoke-WattpadInstall {
    [CmdletBinding()]
    param()

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
    } catch {}

    $Check = [char]0x2713
    $Arrow = [char]0x25B8
    $Cross = [char]0x2717
    $Sep   = [string]([char]0x2500) * 49

    Write-Host ""
    Write-Host "                       Wattpad CLI v${version}" -ForegroundColor DarkYellow
    Write-Host "                 Instalador Oficial Windows" -ForegroundColor White
    Write-Host ""
    Write-Host "   $Sep" -ForegroundColor DarkGray

    $TempFile = $null

    try {
        $InstallDir = Join-Path $HOME ".wattpad\\bin"
        $ExePath    = Join-Path $InstallDir "wattpad.exe"
        $CmdPath    = Join-Path $InstallDir "wattpad.cmd"

        if (-not (Test-Path $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }

        $DownloadUrl = "https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/download/v${version}/wattpad.exe"
        Write-Host "   $Arrow Descargando Wattpad CLI v${version}..." -ForegroundColor Cyan

        $TempFile = Join-Path $InstallDir "wattpad.exe.tmp"
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempFile -UseBasicParsing -TimeoutSec 60 -ErrorAction Stop

        if (Test-Path $ExePath) {
            Remove-Item -Path $ExePath -Force -ErrorAction SilentlyContinue
        }
        Move-Item -Path $TempFile -Destination $ExePath -Force
        Write-Host "   $Check Binario instalado en: $ExePath" -ForegroundColor Green

        # Crear lanzador cmd
        $LauncherContent = "@echo off\`r\`n\"$ExePath\" %*\`r\`n"
        [System.IO.File]::WriteAllText($CmdPath, $LauncherContent, [System.Text.Encoding]::ASCII)
        Write-Host "   $Check Lanzador wattpad.cmd creado." -ForegroundColor Green

        # Configurar PATH de usuario
        $UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        if ($UserPath -notlike "*$InstallDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$InstallDir;$UserPath", [EnvironmentVariableTarget]::User)
            Write-Host "   $Check Registrado en PATH de usuario." -ForegroundColor Green
        }
        if ($env:PATH -notlike "*$InstallDir*") {
            $env:PATH = "$InstallDir;$env:PATH"
        }

        Write-Host ""
        Write-Host "   $Check ¡Instalación de Wattpad CLI v${version} completada!" -ForegroundColor Green
        Write-Host "   Ejecuta: wattpad" -ForegroundColor DarkYellow
        Write-Host ""
    } catch {
        Write-Host "   $Cross Error durante la instalacion: $($_.Exception.Message)" -ForegroundColor Red
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
function getInstallSh(): string {
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
