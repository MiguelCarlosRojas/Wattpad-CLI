import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BinaryMetadata {
  filename: string;
  sha256: string;
  size: number;
}

export interface DistributionManifest {
  version: string;
  generatedAt: string;
  binaries: Record<string, BinaryMetadata>;
}

/**
 * Genera SHA256SUMS.txt y distribution-manifest.json a partir de los binarios en dist/
 */
export function generateChecksumsAndManifest(): DistributionManifest {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const pkgPath = path.resolve(rootDir, 'package.json');

  let version = '1.2.0';
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) version = pkg.version;
    } catch {}
  }

  if (!fs.existsSync(distDir)) {
    throw new Error('El directorio dist/ no existe. Primero compila el CLI con: bun run build:cli');
  }

  const files = fs
    .readdirSync(distDir)
    .filter(
      (file) =>
        file.startsWith('wattpad') &&
        !file.endsWith('.tmp') &&
        !file.endsWith('.old') &&
        !file.endsWith('.bak') &&
        !file.endsWith('.txt') &&
        !file.endsWith('.json') &&
        !file.endsWith('.md')
    );

  if (files.length === 0) {
    throw new Error('No se encontraron binarios de Wattpad en dist/. Ejecuta: bun run build:cli');
  }

  console.log('\x1b[38;2;255;97;34m[Wattpad CLI]\x1b[0m Calculando sumas de comprobación SHA-256...\n');

  const lines: string[] = [];
  const binaries: Record<string, BinaryMetadata> = {};

  for (const file of files) {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    lines.push(`${hash}  ${file}`);
    console.log(`  ✓ ${file}`);
    console.log(`    SHA-256 : ${hash}`);
    console.log(`    Tamaño  : ${sizeMB} MB (${stats.size.toLocaleString()} bytes)\n`);

    let targetKey = 'win32-x64';
    if (file === 'wattpad.exe') {
      targetKey = 'win32-x64';
    } else if (file.includes('linux-x64-musl')) {
      targetKey = 'linux-x64-musl';
    } else if (file.includes('linux-x64')) {
      targetKey = 'linux-x64';
    } else if (file.includes('darwin-arm64')) {
      targetKey = 'darwin-arm64';
    } else if (file.includes('darwin-x64')) {
      targetKey = 'darwin-x64';
    }

    binaries[targetKey] = {
      filename: file,
      sha256: hash,
      size: stats.size,
    };
  }

  // Guardar dist/SHA256SUMS.txt
  const checksumPath = path.join(distDir, 'SHA256SUMS.txt');
  fs.writeFileSync(checksumPath, lines.join('\n') + '\n', 'utf8');
  console.log(`\x1b[32m✓ [Éxito]\x1b[0m Archivo de verificación generado: ${checksumPath}`);

  // Generar objeto manifiesto
  const manifest: DistributionManifest = {
    version,
    generatedAt: new Date().toISOString(),
    binaries,
  };

  // Guardar en dist/distribution-manifest.json
  const distManifestPath = path.join(distDir, 'distribution-manifest.json');
  fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // Guardar en src/platform/distribution/distribution-manifest.json para persistencia en repo y Render
  const platformDistDir = path.resolve(rootDir, 'src/platform/distribution');
  if (fs.existsSync(platformDistDir)) {
    const srcManifestPath = path.join(platformDistDir, 'distribution-manifest.json');
    fs.writeFileSync(srcManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`\x1b[32m✓ [Éxito]\x1b[0m Manifiesto de distribución sincronizado: ${srcManifestPath}`);
  }

  return manifest;
}

if (import.meta.main) {
  try {
    generateChecksumsAndManifest();
  } catch (err: any) {
    console.error('\x1b[31m[Error en generación de checksums]:\x1b[0m', err.message);
    process.exit(1);
  }
}
