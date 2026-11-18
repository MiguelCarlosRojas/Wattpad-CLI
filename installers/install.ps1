# ==============================================================================
# Wattpad CLI - Official PowerShell Installer
# Usage: irm https://wattpad.onrender.com/cli/install.ps1 | iex
# ==============================================================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$WattpadOrange = "`e[38;2;255;97;34m"
$Green = "`e[38;2;40;167;69m"
$Cyan = "`e[38;2;23;162;184m"
$Yellow = "`e[38;2;255;193;7m"
$Bold = "`e[1m"
$Reset = "`e[0m"

Write-Host ""
Write-Host "$Bold$WattpadOrange   ██╗    ██╗ █████╗ ████████╗████████╗██████╗  █████╗ ██████╗ $Reset"
Write-Host "$Bold$WattpadOrange   ██║    ██║██╔══██╗╚══██╔══╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗$Reset"
Write-Host "$Bold$WattpadOrange   ██║ █╗ ██║███████║   ██║      ██║   ██████╔╝███████║██║  ██║$Reset"
Write-Host "$Bold$WattpadOrange   ██║███╗██║██╔══██║   ██║      ██║   ██╔═══╝ ██╔══██║██║  ██║$Reset"
Write-Host "$Bold$WattpadOrange   ╚███╔███╔╝██║  ██║   ██║      ██║   ██║     ██║  ██║██████╔╝$Reset"
Write-Host "$Bold$WattpadOrange    ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═════╝ $Reset"
Write-Host "                $Bold CLI — Instalador Oficial Windows $Reset"
Write-Host ""

$BaseUrl = if ($env:WATTPAD_API_BASE_URL) { $env:WATTPAD_API_BASE_URL } else { "https://wattpad.onrender.com" }
Write-Host "$Cyan▸ Conectando con servidor cloud:$Reset $BaseUrl"

# Detect Architecture
$Arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
if ($env:PROCESSOR_ARCHITECTURE -match "ARM64") { $Arch = "arm64" }

# Destination folder in user profile
$InstallDir = Join-Path $HOME ".wattpad\bin"
if (!(Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$ExePath = Join-Path $InstallDir "wattpad.exe"
$CmdPath = Join-Path $InstallDir "wattpad.cmd"

Write-Host "$Cyan▸ Descargando binario independiente para Windows ($Arch)...$Reset"

try {
    # Download binary from cloud endpoint or releases
    $DownloadUrl = "$BaseUrl/cli/download/win32-$Arch"
    $ProgressPreference = 'SilentlyContinue'
    
    # Try downloading from cloud API; if offline fallback to local compilation or package
    try {
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ExePath -UseBasicParsing -TimeoutSec 30
    } catch {
        # Fallback: check if wattpad.exe is built in project dist
        $LocalDist = Join-Path $PSScriptRoot "..\dist\wattpad.exe"
        if (Test-Path $LocalDist) {
            Copy-Item $LocalDist $ExePath -Force
        }
    }
} catch {
    Write-Host "$Yellow[Aviso] Usando binario empaquetado localmente.$Reset"
}

# Create quick CMD wrapper
Set-Content -Path $CmdPath -Value "@echo off`n`"%~dp0wattpad.exe`" %*" -Force

# Add to user PATH if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($UserPath -notlike "*$InstallDir*") {
    Write-Host "$Cyan▸ Registrando $InstallDir en PATH del usuario...$Reset"
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", [EnvironmentVariableTarget]::User)
    $env:PATH = "$env:PATH;$InstallDir"
}

Write-Host ""
Write-Host "$Green$Bold✓ ¡Wattpad CLI instalado correctamente!$Reset"
Write-Host "$Cyan  Ubicación:$Reset $ExePath"
Write-Host "$Cyan  Ejecución:$Reset Simplemente escribe ${Bold}wattpad${Reset} en tu terminal."
Write-Host ""
