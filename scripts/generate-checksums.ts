import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Script para generar SHA256SUMS.txt a partir de los binarios en dist/
 * Cumple con el formato estándar Unix: <hash>  <nombre_archivo>
 */
function main() {
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('El directorio dist/ no existe. Primero compila el CLI con: bun run build:cli');
    process.exit(1);
  }

  // Filtrar binarios ejecutables de wattpad
  const files = fs
    .readdirSync(distDir)
    .filter(
      (file) =>
        file.startsWith('wattpad') &&
        !file.endsWith('.tmp') &&
        !file.endsWith('.old') &&
        !file.endsWith('.txt')
    );

  if (files.length === 0) {
    console.error('No se encontraron binarios de Wattpad en dist/. Ejecuta: bun run build:cli');
    process.exit(1);
  }

  console.log('\x1b[38;2;255;97;34m[Wattpad CLI]\x1b[0m Calculando sumas de comprobación SHA-256...\n');

  const lines: string[] = [];

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
  }

  const checksumPath = path.join(distDir, 'SHA256SUMS.txt');
  fs.writeFileSync(checksumPath, lines.join('\n') + '\n', 'utf8');

  console.log(`\x1b[32m✓ [Éxito]\x1b[0m Archivo de verificación generado: ${checksumPath}`);
}

main();
