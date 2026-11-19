import path from 'path';
import fs from 'fs';
import { generateChecksumsAndManifest } from './generate-checksums';

// Allowed target platforms
export type SupportedPlatform =
  | 'win32-x64'
  | 'windows-x64'
  | 'linux-x64'
  | 'linux-x64-musl'
  | 'darwin-x64'
  | 'darwin-arm64';

async function main() {
  const args = process.argv.slice(2);
  let targetArg: string | null = null;
  let outfileArg: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      targetArg = arg.split('=')[1];
    } else if (arg.startsWith('--outfile=')) {
      outfileArg = arg.split('=')[1];
    }
  }

  // Detect platform if not specified
  const platform = process.platform;
  const arch = process.arch;

  let targetKey: string = targetArg || `${platform}-${arch}`;
  if (targetKey === 'win32-x64') targetKey = 'windows-x64';

  console.log(`\x1b[38;2;255;97;34m[Wattpad CLI Builder]\x1b[0m Compiling for target: \x1b[1m${targetKey}\x1b[0m`);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  let compileTarget: any = 'bun-windows-x64';
  let defaultOutfile = 'dist/wattpad.exe';
  const define: Record<string, string> = {};

  switch (targetKey) {
    case 'windows-x64':
    case 'win32-x64':
      compileTarget = 'bun-windows-x64';
      defaultOutfile = 'dist/wattpad.exe';
      break;

    case 'linux-x64':
    case 'linux-glibc':
      compileTarget = 'bun-linux-x64';
      defaultOutfile = 'dist/wattpad-linux-x64';
      // Official OpenTUI recommendation for glibc target dead-code elimination
      define['process.env.OPENTUI_LIBC'] = JSON.stringify('glibc');
      break;

    case 'linux-x64-musl':
    case 'linux-musl':
      compileTarget = 'bun-linux-x64-musl';
      defaultOutfile = 'dist/wattpad-linux-x64-musl';
      // Official OpenTUI recommendation for musl target
      define['process.env.OPENTUI_LIBC'] = JSON.stringify('musl');
      break;

    case 'darwin-x64':
      compileTarget = 'bun-darwin-x64';
      defaultOutfile = 'dist/wattpad-darwin-x64';
      break;

    case 'darwin-arm64':
      compileTarget = 'bun-darwin-arm64';
      defaultOutfile = 'dist/wattpad-darwin-arm64';
      break;

    default:
      console.warn(`[Aviso] Target no estándar '${targetKey}', usando compilación nativa del host.`);
      compileTarget = true;
      defaultOutfile = platform === 'win32' ? 'dist/wattpad.exe' : 'dist/wattpad';
      if (platform === 'linux') {
        define['process.env.OPENTUI_LIBC'] = JSON.stringify('glibc');
      }
      break;
  }

  const outfile = outfileArg || defaultOutfile;
  console.log(`▸ Entrypoint:  src/core/bootstrap/main.ts`);
  console.log(`▸ Outfile:     ${outfile}`);
  console.log(`▸ Target:      ${compileTarget}`);
  if (Object.keys(define).length > 0) {
    console.log(`▸ Defines:    `, define);
  }

  const startTime = Date.now();
  const result = await Bun.build({
    entrypoints: ['src/core/bootstrap/main.ts'],
    compile: {
      target: compileTarget,
      outfile,
    },
    define,
  });

  if (!result.success) {
    console.error(`\x1b[31m[Error fatal de compilación]:\x1b[0m`);
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const stats = fs.statSync(outfile);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(
    `\x1b[32m✓ [Éxito]\x1b[0m Binario generado correctamente en ${elapsed}s (${sizeMB} MB): ${outfile}\n`
  );

  // Generar automáticamente sumas de verificación y manifiesto sincronizado
  try {
    generateChecksumsAndManifest();
  } catch (checksumErr: any) {
    console.warn(`[Aviso] No se pudieron actualizar los checksums automáticamente: ${checksumErr.message}`);
  }
}

main().catch((err) => {
  console.error('\x1b[31mError no controlado durante la compilación:\x1b[0m', err);
  process.exit(1);
});
