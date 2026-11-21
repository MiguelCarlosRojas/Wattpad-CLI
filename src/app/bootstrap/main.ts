import { AppShell } from '../app-shell';
import { LifecycleManager } from './lifecycle';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';
import { HeaderComponent } from '../../platform/terminal/components/header';
import { COLORS } from '../../shared/constants/colors.constants';

export async function bootstrap(): Promise<void> {
  const args = process.argv.slice(2);

  // Verificación de argumentos de línea de comandos simples
  if (args.includes('--version') || args.includes('-v') || args.includes('version')) {
    console.log(`\n  ${COLORS.BOLD}${COLORS.ORANGE}${APP_CONSTANTS.NAME}${COLORS.RESET}  [v${APP_CONSTANTS.VERSION}]`);
    console.log(`  ────────────────────────────────────────────────────────────────────────────`);
    console.log(`    ${APP_CONSTANTS.TAGLINE} — ${APP_CONSTANTS.DESCRIPTION}`);
    console.log(`    Versión:      v${APP_CONSTANTS.VERSION}`);
    console.log(`    Runtime:      Bun ${Bun.version}`);
    console.log(`    Plataforma:   ${process.platform} (${process.arch})`);
    console.log(`    Repositorio:  https://github.com/MiguelCarlosRojas/Wattpad-CLI\n`);
    process.exit(0);
  }

  if (args.includes('--help') || args.includes('-h') || args.includes('help')) {
    const lines = HeaderComponent.render({ width: 80 });
    console.log(lines.join('\n'));
    console.log(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Flujo Principal de Wattpad CLI:${COLORS.RESET}`);
    console.log(`    1. Pantalla inicial de bienvenida (Iniciar sesión / Crear cuenta)`);
    console.log(`    2. Menú principal interactivo:`);
    console.log(`       1. Buscar novelas (Búsqueda en Wattpad, filtros con 4 flechas)`);
    console.log(`       2. Buzón (Conversaciones, mensajes y notificaciones)`);
    console.log(`       3. Biblioteca (Novelas guardadas)`);
    console.log(`       4. Crear historia (Asistente paso a paso)`);
    console.log(`       5. Mis historias (Borradores, capítulos, editor interactivo y publicación)`);
    console.log('');
    console.log(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Navegación universal:${COLORS.RESET}`);
    console.log(`    ↑ / ↓   : Moverse entre elementos`);
    console.log(`    ← / →   : Cambiar valores de filtros o mover cursor`);
    console.log(`    Enter   : Seleccionar / Abrir / Confirmar`);
    console.log(`    Esc     : Volver / Salir`);
    console.log(`    Tab     : Cambiar sección o filtros`);
    console.log(`    Ctrl+P  : Abrir paleta rápida de comandos`);
    console.log(`    Ctrl+C  : Salir de forma segura\n`);
    process.exit(0);
  }

  // Iniciar la TUI interactiva
  const shell = new AppShell();
  LifecycleManager.setup(() => shell.shutdown());
  await shell.start();
}
