import { Theme, Chalk } from '../theme';
import { RenderBlock } from '../../../types/command.types';

export interface RecentProjectItem {
  id: string;
  title: string;
  chaptersCount?: number;
  updatedAt?: string;
  syncStatus?: string;
}

export interface WelcomeHeroState {
  version: string;
  serverUrl: string;
  serverOnline: boolean;
  username?: string;
  isAuthenticated?: boolean;
  activeStory?: string | null;
  recentProjects?: RecentProjectItem[];
}

export class WelcomeHeroRenderer {
  public static render(state: WelcomeHeroState, width: number = 80): string[] {
    const lines: string[] = [];
    const isCompact = width < 75;

    lines.push('');

    // Central Studio Headline
    const question = Chalk.bold(Chalk.hex(Theme.colors.white, '¿Qué vamos a escribir hoy?'));
    const subtitle = Chalk.hex(Theme.colors.textSecondary, 'Estudio de desarrollo literario en la nube y asistencia narrativa con IA.');
    lines.push(`  ${question}`);
    if (!isCompact) {
      lines.push(`  ${subtitle}`);
    }
    lines.push('');

    // Quick Actions
    const actionTitle = Chalk.bold(Chalk.hex(Theme.colors.primary, 'Acciones rápidas:'));
    lines.push(`  ${actionTitle}`);

    const actions = [
      { cmd: '/story new "Título"', desc: 'Crear una nueva novela' },
      { cmd: '/stories', desc: 'Abrir biblioteca de proyectos' },
      { cmd: '/chapters', desc: 'Continuar redactando capítulos activos' },
      { cmd: '/models', desc: 'Explorar modelos y herramientas de IA' },
      { cmd: '/sync', desc: 'Sincronizar proyectos con PostgreSQL Cloud' },
    ];

    for (const act of actions) {
      const prompt = Chalk.hex(Theme.colors.primary, '›');
      const cmdStyled = Chalk.bold(Chalk.hex(Theme.colors.text, act.cmd.padEnd(24)));
      const descStyled = Chalk.hex(Theme.colors.muted, act.desc);
      lines.push(`    ${prompt} ${cmdStyled} ${descStyled}`);
    }

    lines.push('');

    // Recent Projects / Empty State
    if (state.recentProjects && state.recentProjects.length > 0) {
      lines.push(`  ${Chalk.bold(Chalk.hex(Theme.colors.textSecondary, 'Proyectos recientes:'))}`);
      for (const p of state.recentProjects.slice(0, 4)) {
        const marker = Chalk.hex(Theme.colors.primary, '▸');
        const idBadge = Chalk.hex(Theme.colors.info, `[${p.id}]`);
        const title = Chalk.bold(Chalk.hex(Theme.colors.text, p.title));
        const caps = p.chaptersCount !== undefined ? `${p.chaptersCount} cap(s)` : '0 caps';
        const sync = p.syncStatus ? ` · ${p.syncStatus}` : ' · Al día';
        lines.push(`    ${marker} ${title} ${idBadge}  ${Chalk.hex(Theme.colors.muted, caps + sync)}`);
      }
    } else {
      lines.push(`  ${Chalk.hex(Theme.colors.muted, 'Estado: Sin novelas abiertas. Ejecuta /story new para comenzar tu primer manuscrito.')}`);
    }

    lines.push('');
    return lines;
  }

  public static getWelcomeBlock(state: WelcomeHeroState): RenderBlock {
    const userLabel = state.isAuthenticated && state.username ? `@${state.username}` : 'Invitado';

    const recentItems = state.recentProjects && state.recentProjects.length > 0
      ? state.recentProjects.slice(0, 3).map((p) => ({
          primary: `${p.title} [${p.id}]`,
          secondary: `${p.chaptersCount !== undefined ? p.chaptersCount : 0} cap(s) · ${p.syncStatus || 'Al día'}`,
          badge: p.syncStatus?.toUpperCase() || 'ACTIVO',
        }))
      : undefined;

    return {
      type: 'card',
      title: '¿Qué vamos a escribir hoy?',
      subtitle: 'Estudio de desarrollo literario, asistencia narrativa y sincronización cloud.',
      statusBadge: state.serverOnline ? 'CLOUD ONLINE' : 'OFFLINE',
      statusColor: state.serverOnline ? Theme.colors.success : Theme.colors.warning,
      fields: [
        { label: 'Acciones Rápidas', value: '/story new  ·  /stories  ·  /chapters  ·  /models  ·  /sync' },
        { label: 'Sesión Activa', value: `${userLabel} (${state.serverUrl.replace(/^https?:\/\//, '')})` },
        { label: 'Navegación', value: 'Tab (Autocompletar)  ·  ↑↓ (Navegar / Historial)  ·  /help (Ayuda)' },
      ],
      items: recentItems,
      content:
        'Comienza redactando con /story new "Título" o consulta tus novelas activas con /stories.\n' +
        'Escribe /models para consultar los motores de IA literaria disponibles.',
    };
  }
}
