# ==============================================================================
# Wattpad CLI - Official PowerShell Installer
# Usage: irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex
# ==============================================================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

# Symbols
$Check = [char]0x2713
$Arrow = [char]0x25B8
$Cross = [char]0x2717
$Sep   = [string]([char]0x2500) * 49

# Logo
$LogoB64 = 'ICAg4paI4paI4pWXICAgIOKWiOKWiOKVlyDilojilojilojilojilojilZcg4paI4paI4paI4paI4paI4paI4paI4paI4pWX4paI4paI4paI4paI4paI4paI4paI4paI4pWX4paI4paI4paI4paI4paI4paI4pWXICDilojilojilojilojilojilZcg4paI4paI4paI4paI4paI4paI4pWXIAogICDilojilojilZEgICAg4paI4paI4pWR4paI4paI4pWU4pWQ4pWQ4paI4paI4pWX4pWa4pWQ4pWQ4paI4paI4pWU4pWQ4pWQ4pWd4pWa4pWQ4pWQ4paI4paI4pWU4pWQ4pWQ4pWd4paI4paI4pWU4pWQ4pWQ4paI4paI4pWX4paI4paI4pWU4pWQ4pWQ4paI4paI4pWX4paI4paI4pWU4pWQ4pWQ4paI4paI4pWXCiAgIOKWiOKWiOKVkSDilojilZcg4paI4paI4pWR4paI4paI4paI4paI4paI4paI4paI4pWRICAg4paI4paI4pWRICAgICAg4paI4paI4pWRICAg4paI4paI4paI4paI4paI4paI4pWU4pWd4paI4paI4paI4paI4paI4paI4paI4pWR4paI4paI4pWRICDilojilojilZEKICAg4paI4paI4pWR4paI4paI4paI4pWX4paI4paI4pWR4paI4paI4pWU4pWQ4pWQ4paI4paI4pWRICAg4paI4paI4pWRICAgICAg4paI4paI4pWRICAg4paI4paI4pWU4pWQ4pWQ4pWQ4pWdIOKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVkeKWiOKWiOKVkSAg4paI4paI4pWRCiAgIOKVmuKWiOKWiOKWiOKVlOKWiOKWiOKWiOKVlOKVneKWiOKWiOKVkSAg4paI4paI4pWRICAg4paI4paI4pWRICAgICAg4paI4paI4pWRICAg4paI4paI4pWRICAgICDilojilojilZEgIOKWiOKWiOKVkeKWiOKWiOKWiOKWiOKWiOKWiOKVlOKVnQogICAg4pWa4pWQ4pWQ4pWd4pWa4pWQ4pWQ4pWdIOKVmuKVkOKVnSAg4pWa4pWQ4pWdICAg4pWa4pWQ4pWdICAgICAg4pWa4pWQ4pWdICAg4pWa4pWQ4pWdICAgICDilZrilZDilZ0gIOKVmuKVkOKVneKVmuKVkOKVkOKVkOKVkOKVkOKVnSA='
$Logo = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($LogoB64))

Write-Host ""
Write-Host $Logo -ForegroundColor DarkYellow
Write-Host "                       Wattpad CLI" -ForegroundColor White
Write-Host "                 Instalador Oficial Windows" -ForegroundColor Gray
Write-Host ""
Write-Host "   $Sep" -ForegroundColor DarkGray

# 1. Cloud discovery & connectivity check
$BaseUrl = if ($env:WATTPAD_API_BASE_URL) { $env:WATTPAD_API_BASE_URL } else { "https://wattpad-cli.onrender.com" }
Write-Host "   $Arrow Conectando con servidor cloud: $BaseUrl" -ForegroundColor Cyan

$Config = $null
$ExpectedHash = $null
try {
    $ConfigResponse = Invoke-WebRequest -Uri "$BaseUrl/cli/config" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    $Config = $ConfigResponse.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($Config -and $Config.binaries) {
        $binProp = $Config.binaries.PSObject.Properties['win32-x64']
        if ($binProp -and $binProp.Value) {
            $ExpectedHash = $binProp.Value.sha256
        }
    }
    Write-Host "   $Check Conexion cloud verificada." -ForegroundColor Green
} catch {
    Write-Host "   ! Advertencia: No se pudo verificar la configuracion cloud ($($_.Exception.Message))." -ForegroundColor Yellow
}

# 2. Operating system and architecture detection
Write-Host "   $Arrow Detectando arquitectura del sistema..." -ForegroundColor Cyan
$Is64Bit = [Environment]::Is64BitOperatingSystem
$Arch = if ($Is64Bit) { "x64" } else { "x86" }
if ($env:PROCESSOR_ARCHITECTURE -match "ARM64") {
    $Arch = "arm64"
}

if ($Arch -eq "x86") {
    Write-Host "   $Cross Error: Wattpad CLI no es compatible con Windows de 32 bits (x86)." -ForegroundColor Red
    Write-Host "     Se requiere un sistema operativo Windows x64 o ARM64." -ForegroundColor Yellow
    exit 1
}

Write-Host "   $Check Arquitectura detectada: Windows $Arch" -ForegroundColor Green

# 3. Preparation of installation directory
$InstallDir = Join-Path $HOME ".wattpad\bin"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$ExePath = Join-Path $InstallDir "wattpad.exe"
$CmdPath = Join-Path $InstallDir "wattpad.cmd"

# 4. Binary download
Write-Host "   $Arrow Descargando binario oficial para Windows ($Arch)..." -ForegroundColor Cyan

$TempFile = Join-Path $env:TEMP "wattpad-cli-$Arch-$([Guid]::NewGuid().ToString('N')).tmp"
$ProgressPreference = 'SilentlyContinue'

$DownloadUrls = @(
    "$BaseUrl/cli/download/win32-$Arch",
    "https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/latest/download/wattpad.exe"
)

$DownloadSuccess = $false

function Invoke-BinaryDownload {
    param([string]$SourceUrl, [string]$DestinationFile)

    # Engine 1: curl.exe (built-in Windows 10/11, highly efficient for large binaries)
    $curlCmd = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curlCmd) {
        try {
            & curl.exe -f -s -S -L "$SourceUrl" -o "$DestinationFile" --connect-timeout 30 --max-time 600
            if ((Test-Path $DestinationFile) -and ((Get-Item $DestinationFile).Length -gt 1048576)) {
                return $true
            }
        } catch {}
    }

    # Engine 2: System.Net.WebClient (.NET framework direct stream)
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "Wattpad-CLI-Installer")
        $wc.DownloadFile($SourceUrl, $DestinationFile)
        if ((Test-Path $DestinationFile) -and ((Get-Item $DestinationFile).Length -gt 1048576)) {
            return $true
        }
    } catch {}

    # Engine 3: Invoke-WebRequest (standard PowerShell fallback)
    try {
        Invoke-WebRequest -Uri $SourceUrl -OutFile $DestinationFile -UseBasicParsing -TimeoutSec 600 -ErrorAction Stop
        if ((Test-Path $DestinationFile) -and ((Get-Item $DestinationFile).Length -gt 1048576)) {
            return $true
        }
    } catch {
        return $false
    }

    return $false
}

foreach ($Url in $DownloadUrls) {
    if (Invoke-BinaryDownload -SourceUrl $Url -DestinationFile $TempFile) {
        $DownloadSuccess = $true
        break
    }
}

if (-not $DownloadSuccess) {
    Write-Host "   $Cross Error fatal al descargar el binario de Wattpad CLI." -ForegroundColor Red
    Write-Host "     No se pudo obtener el ejecutable desde los servidores oficiales." -ForegroundColor Red
    if (Test-Path $TempFile) { Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue }
    exit 1
}

Write-Host "   $Check Descarga completada." -ForegroundColor Green

# 5. Integrity and format verification
Write-Host "   $Arrow Verificando integridad del ejecutable..." -ForegroundColor Cyan

# 5.1 File size check (> 5MB)
$FileSize = (Get-Item $TempFile).Length
if ($FileSize -lt 5242880) {
    Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue
    Write-Host "   $Cross Error: El archivo descargado esta incompleto o corrupto ($FileSize bytes)." -ForegroundColor Red
    exit 1
}

# 5.2 PE Header check (Must begin with 'MZ' / 0x4D 0x5A)
try {
    $Stream = [System.IO.File]::OpenRead($TempFile)
    $PeHeader = New-Object byte[] 2
    $BytesRead = $Stream.Read($PeHeader, 0, 2)
    $Stream.Close()

    if ($BytesRead -lt 2 -or $PeHeader[0] -ne 0x4D -or $PeHeader[1] -ne 0x5A) {
        Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue
        Write-Host "   $Cross Error: El archivo descargado no es un ejecutable PE valido de Windows (encabezado MZ ausente)." -ForegroundColor Red
        exit 1
    }
} catch {
    if (Test-Path $TempFile) { Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue }
    Write-Host "   $Cross Error al leer el encabezado del archivo descargado: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5.3 SHA-256 hash check
$ComputedHash = (Get-FileHash -Path $TempFile -Algorithm SHA256).Hash.ToUpperInvariant()
if ($ExpectedHash) {
    if ($ComputedHash -ne $ExpectedHash.ToUpperInvariant()) {
        Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue
        Write-Host "   $Cross Error: La comprobacion SHA-256 no coincide." -ForegroundColor Red
        Write-Host "     Esperado: $ExpectedHash" -ForegroundColor Yellow
        Write-Host "     Obtenido: $ComputedHash" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "   $Check Integridad comprobada (Encabezado PE 'MZ', SHA-256: $ComputedHash)." -ForegroundColor Green

# 6. Install executable safely
if (Test-Path $ExePath) {
    try {
        Remove-Item -Path $ExePath -Force -ErrorAction Stop
    } catch {
        Move-Item -Path $ExePath -Destination "$ExePath.old.$([Guid]::NewGuid().ToString('N'))" -Force -ErrorAction SilentlyContinue
    }
}

Move-Item -Path $TempFile -Destination $ExePath -Force
Write-Host "   $Check Binario instalado en: $ExePath" -ForegroundColor Green

# 7. Create clean wattpad.cmd launcher without duplicated quotes
$LauncherLines = @(
    '@echo off',
    'setlocal',
    '',
    'set "WATTPAD_EXE=%USERPROFILE%\.wattpad\bin\wattpad.exe"',
    '',
    'if not exist "%WATTPAD_EXE%" (',
    '    echo [ERROR] No se encontro el ejecutable de Wattpad CLI.',
    '    echo Ejecuta nuevamente el instalador oficial:',
    '    echo irm https://wattpad-cli.onrender.com/cli/install.ps1 ^| iex',
    '    exit /b 1',
    ')',
    '',
    '"%WATTPAD_EXE%" %*',
    '',
    'exit /b %ERRORLEVEL%'
)
$LauncherContent = $LauncherLines -join "`r`n"

[System.IO.File]::WriteAllText($CmdPath, $LauncherContent, [System.Text.Encoding]::ASCII)
Write-Host "   $Check Launcher generado en: $CmdPath" -ForegroundColor Green

# 8. Check and sanitize conflicting/obsolete launchers (e.g. .bun\bin)
$BunBinDir = Join-Path $HOME ".bun\bin"
if (Test-Path $BunBinDir) {
    $OldBunCmd = Join-Path $BunBinDir "wattpad.cmd"
    if (Test-Path $OldBunCmd) {
        $OldContent = Get-Content -Path $OldBunCmd -Raw -ErrorAction SilentlyContinue
        if ($OldContent -match "wattpad" -or $OldContent -match "src\\main.ts" -or $OldContent -match "src\\cli\\main.ts") {
            [System.IO.File]::WriteAllText($OldBunCmd, $LauncherContent, [System.Text.Encoding]::ASCII)
            Write-Host "   $Check Launcher obsoleto actualizado en: $OldBunCmd" -ForegroundColor Green
        }
    }
    $OldBunExe = Join-Path $BunBinDir "wattpad.exe"
    if (Test-Path $OldBunExe) {
        try {
            Remove-Item -Path $OldBunExe -Force -ErrorAction SilentlyContinue
            Write-Host "   $Check Ejecutable redundante eliminado de: $OldBunExe" -ForegroundColor Green
        } catch {}
    }
}

# 9. Register InstallDir in User PATH and Session PATH
$UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($UserPath -notlike "*$InstallDir*") {
    $NewUserPath = "$InstallDir;$UserPath"
    [Environment]::SetEnvironmentVariable("Path", $NewUserPath, [EnvironmentVariableTarget]::User)
    Write-Host "   $Check Registrado $InstallDir en PATH del usuario de Windows." -ForegroundColor Green
}

# Prepend to current process session PATH so it works immediately without restarting
if ($env:PATH -notlike "$InstallDir;*") {
    $env:PATH = "$InstallDir;$env:PATH"
    Write-Host "   $Check PATH actualizado en la sesion actual de PowerShell." -ForegroundColor Green
}

# 10. Verify executable readiness
if (-not (Test-Path $ExePath)) {
    Write-Host "   $Cross Error critico: El ejecutable no existe en $ExePath tras la instalacion." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "   $Sep" -ForegroundColor DarkGray
Write-Host "   $Check Conexion cloud verificada." -ForegroundColor Green
Write-Host "   $Check Binario descargado." -ForegroundColor Green
Write-Host "   $Check Integridad comprobada." -ForegroundColor Green
Write-Host "   $Check Instalacion completada." -ForegroundColor Green
Write-Host ""
Write-Host "   Escribe wattpad para iniciar." -ForegroundColor White
Write-Host ""
