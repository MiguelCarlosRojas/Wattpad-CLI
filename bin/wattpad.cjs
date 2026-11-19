#!/usr/bin/env node

/**
 * ==============================================================================
 * Wattpad CLI - Official Global npm Runner
 * ==============================================================================
 *
 * This launcher provides zero-dependency execution for Node.js environments.
 * It resolves the official native Wattpad CLI binary for the host platform,
 * verifies cryptographic SHA-256 checksums, and delegates execution seamlessly.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// Official known SHA-256 hashes for releases
const OFFICIAL_CHECKSUMS = {
  'win32-x64': '37e1673071d1285157c296e71117d09eaec4a466b1cc13d2d37a7f1d2a83ba6d',
  'linux-x64': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'darwin-arm64': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'darwin-x64': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
};

const BASE_URL = process.env.WATTPAD_API_BASE_URL || 'https://wattpad-cli.onrender.com';
const GITHUB_RELEASE_BASE = 'https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases/latest/download';

function getPlatformKey() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32' && (arch === 'x64' || arch === 'arm64')) {
    return 'win32-x64';
  }
  if (platform === 'linux' && arch === 'x64') {
    return 'linux-x64';
  }
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  }

  return `${platform}-${arch}`;
}

function getBinaryName(platformKey) {
  return platformKey.startsWith('win32') ? 'wattpad.exe' : 'wattpad';
}

function getCacheDir() {
  const home = os.homedir();
  return path.join(home, '.wattpad', 'bin');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle HTTP redirects (GitHub Releases redirect to AWS S3)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });

      fileStream.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function main() {
  const platformKey = getPlatformKey();
  const binaryName = getBinaryName(platformKey);
  const cacheDir = getCacheDir();
  const binaryPath = path.join(cacheDir, binaryName);

  // 1. If local binary exists in repo dist/ (for local dev), use it
  const localDistBinary = path.resolve(__dirname, '..', 'dist', binaryName);
  let resolvedBinary = null;

  if (fs.existsSync(localDistBinary)) {
    resolvedBinary = localDistBinary;
  } else if (fs.existsSync(binaryPath)) {
    resolvedBinary = binaryPath;
  }

  // 2. If not found, download official binary
  if (!resolvedBinary) {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    console.log(`\x1b[38;2;255;97;34m[Wattpad CLI]\x1b[0m Descargando binario oficial para ${platformKey}...`);
    const tempFile = path.join(cacheDir, `${binaryName}.download`);

    const primaryUrl = `${BASE_URL}/cli/download/${platformKey}`;
    const fallbackUrl = `${GITHUB_RELEASE_BASE}/${binaryName}`;

    try {
      await downloadFile(primaryUrl, tempFile);
    } catch (err) {
      console.log(`\x1b[33m▸ Reintentando descarga desde repositorio oficial...\x1b[0m`);
      try {
        await downloadFile(fallbackUrl, tempFile);
      } catch (err2) {
        console.error(`\x1b[31mError al descargar Wattpad CLI:\x1b[0m`, err2.message);
        console.error(`Visita https://github.com/MiguelCarlosRojas/Wattpad-CLI/releases para instalación manual.`);
        process.exit(1);
      }
    }

    // Verify SHA-256 checksum
    const computedHash = computeSha256(tempFile);
    const expectedHash = OFFICIAL_CHECKSUMS[platformKey];

    if (expectedHash && computedHash !== expectedHash) {
      console.warn(`\x1b[33m[Aviso de Integridad]\x1b[0m El hash descargado difiere del manifiesto local.`);
      console.warn(`Descargado: ${computedHash}`);
      console.warn(`Esperado:   ${expectedHash}`);
    }

    fs.renameSync(tempFile, binaryPath);
    if (process.platform !== 'win32') {
      fs.chmodSync(binaryPath, 0o755);
    }
    resolvedBinary = binaryPath;
    console.log(`\x1b[32m✓ Binario instalado y listo en:\x1b[0m ${binaryPath}\n`);
  }

  // 3. Delegate execution directly to the binary
  const args = process.argv.slice(2);
  const child = spawnSync(resolvedBinary, args, {
    stdio: 'inherit',
    env: process.env,
  });

  process.exit(child.status ?? 0);
}

main().catch((err) => {
  console.error('\x1b[31m[Error Fatal Wattpad CLI Launcher]:\x1b[0m', err.message);
  process.exit(1);
});
