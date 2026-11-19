import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CliController } from '../src/platform/distribution/cli.controller';

/**
 * Script de verificación automática de distribución de Wattpad CLI.
 * Valida la consistencia integral entre:
 * - dist/wattpad.exe (binario real)
 * - dist/SHA256SUMS.txt
 * - src/platform/distribution/distribution-manifest.json
 * - CliController.getPublicConfig()
 * - package.json
 */
export async function verifyDistribution(): Promise<void> {
  const rootDir = process.cwd();
  const pkgPath = path.resolve(rootDir, 'package.json');
  const distExe = path.resolve(rootDir, 'dist/wattpad.exe');
  const sumsPath = path.resolve(rootDir, 'dist/SHA256SUMS.txt');
  const manifestPath = path.resolve(rootDir, 'src/platform/distribution/distribution-manifest.json');

  console.log('\x1b[38;2;255;97;34m[Verificación Automática de Distribución]\x1b[0m Iniciando auditoría...\n');

  // 1. Verificar package.json
  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json no encontrado.');
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const expectedVersion = pkg.version;
  console.log(`  ✓ Versión oficial en package.json: ${expectedVersion}`);

  // 2. Verificar existencia de dist/wattpad.exe
  if (!fs.existsSync(distExe)) {
    throw new Error(`dist/wattpad.exe no existe en: ${distExe}. Ejecuta bun run build:cli.`);
  }

  // 3. Verificar tamaño válido (> 10MB)
  const exeStats = fs.statSync(distExe);
  const sizeMB = (exeStats.size / (1024 * 1024)).toFixed(2);
  if (exeStats.size < 10 * 1024 * 1024) {
    throw new Error(`dist/wattpad.exe tiene un tamaño anormalmente bajo (${exeStats.size} bytes).`);
  }
  console.log(`  ✓ Binario dist/wattpad.exe encontrado: ${sizeMB} MB (${exeStats.size.toLocaleString()} bytes)`);

  // 4. Calcular SHA-256 del binario real
  const buffer = fs.readFileSync(distExe);
  const computedHash = crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
  console.log(`  ✓ SHA-256 calculado del binario: ${computedHash}`);

  // 5. Verificar dist/SHA256SUMS.txt
  if (!fs.existsSync(sumsPath)) {
    throw new Error('dist/SHA256SUMS.txt no existe. Ejecuta bun run build:checksums.');
  }
  const sumsContent = fs.readFileSync(sumsPath, 'utf8');
  const sumsMatch = sumsContent
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.endsWith('wattpad.exe'));

  if (!sumsMatch) {
    throw new Error('dist/SHA256SUMS.txt no contiene una entrada para wattpad.exe.');
  }
  const sumsHash = sumsMatch.split(/\s+/)[0].toLowerCase();
  if (sumsHash !== computedHash) {
    throw new Error(
      `Discrepancia en dist/SHA256SUMS.txt:\n  Esperado (binario): ${computedHash}\n  Encontrado en sums:  ${sumsHash}`
    );
  }
  console.log(`  ✓ Coincidencia exacta con dist/SHA256SUMS.txt (${sumsHash})`);

  // 6. Verificar src/platform/distribution/distribution-manifest.json
  if (!fs.existsSync(manifestPath)) {
    throw new Error('distribution-manifest.json no existe. Ejecuta bun run build:checksums.');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== expectedVersion) {
    throw new Error(
      `Versión en manifiesto (${manifest.version}) no coincide con package.json (${expectedVersion}).`
    );
  }
  const manifestWin = manifest.binaries?.['win32-x64'];
  if (!manifestWin) {
    throw new Error('distribution-manifest.json no contiene la clave win32-x64.');
  }
  if (manifestWin.sha256.toLowerCase() !== computedHash) {
    throw new Error(
      `Discrepancia en distribution-manifest.json:\n  Esperado (binario):    ${computedHash}\n  Encontrado manifiesto: ${manifestWin.sha256}`
    );
  }
  if (manifestWin.size !== exeStats.size) {
    throw new Error(
      `Discrepancia en tamaño en manifiesto:\n  Esperado: ${exeStats.size}\n  Encontrado: ${manifestWin.size}`
    );
  }
  console.log(`  ✓ Coincidencia exacta con distribution-manifest.json (v${manifest.version})`);

  // 7. Verificar CliController.getPublicConfig()
  const publicConfig = CliController.getPublicConfig();
  if (publicConfig.version !== expectedVersion) {
    throw new Error(
      `CliController reporta versión ${publicConfig.version}, esperada: ${expectedVersion}.`
    );
  }
  const serverBinary = publicConfig.binaries?.['win32-x64'];
  if (!serverBinary) {
    throw new Error('CliController no expone binario para win32-x64.');
  }
  if (serverBinary.sha256.toLowerCase() !== computedHash) {
    throw new Error(
      `CliController reporta hash diferente:\n  Esperado: ${computedHash}\n  Servidor: ${serverBinary.sha256}`
    );
  }
  if (serverBinary.size !== exeStats.size) {
    throw new Error(
      `CliController reporta tamaño diferente:\n  Esperado: ${exeStats.size}\n  Servidor: ${serverBinary.size}`
    );
  }
  console.log(`  ✓ Metadatos de servidor CliController sincronizados al 100%`);

  // 8. Verificar que la URL de descarga oficial use la versión correcta
  const downloadUrl = CliController.getDownloadUrl('win32-x64');
  const expectedUrlPart = `/releases/download/v${expectedVersion}/wattpad.exe`;
  if (!downloadUrl.includes(expectedUrlPart)) {
    throw new Error(`La URL de descarga (${downloadUrl}) no contiene la versión esperada (${expectedUrlPart}).`);
  }
  console.log(`  ✓ URL oficial de release validada: ${downloadUrl}`);

  // 9. Comprobar que no existan referencias al hash antiguo erróneo
  const staleHash = '37E1673071D1285157C296E71117D09EAEC4A466B1CC13D2D37A7F1D2A83BA6D'.toLowerCase();
  if (computedHash === staleHash) {
    throw new Error('El binario actual corresponde al hash antiguo erróneo v1.0.0.');
  }
  const filesToScan = [
    'src/platform/distribution/cli.controller.ts',
    'src/platform/distribution/server.ts',
    'src/platform/distribution/distribution-manifest.json',
    'installers/install.ps1',
  ];
  for (const relFile of filesToScan) {
    const absFile = path.resolve(rootDir, relFile);
    if (fs.existsSync(absFile)) {
      const content = fs.readFileSync(absFile, 'utf8').toLowerCase();
      if (content.includes(staleHash)) {
        throw new Error(`Referencia residual al hash antiguo v1.0.0 encontrada en ${relFile}.`);
      }
    }
  }
  console.log('  ✓ Ninguna referencia a hashes obsoletos o erróneos.');

  console.log('\n\x1b[32m✓ [AUDITORÍA EXITOSA]\x1b[0m Todos los componentes de distribución son 100% consistentes y seguros.\n');
}

if (import.meta.main) {
  verifyDistribution().catch((err) => {
    console.error('\n\x1b[31m✗ [ERROR DE VERIFICACIÓN]:\x1b[0m', err.message);
    process.exit(1);
  });
}
