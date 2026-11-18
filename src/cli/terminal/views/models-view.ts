import { Theme, Chalk, padEndVisible } from '../theme';

export interface ModelItem {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  provider: string;
}

export const AI_MODELS: ModelItem[] = [
  {
    id: 'wattpad-writer-pro-v2',
    name: 'wattpad-writer-pro-v2',
    badge: 'DEFAULT',
    badgeColor: Theme.colors.primary,
    description: 'Especializado en generación de prosa literaria, arcos de personajes y giros dramáticos.',
    provider: 'Wattpad Narrative Engine',
  },
  {
    id: 'wattpad-dialogue-turbo',
    name: 'wattpad-dialogue-turbo',
    badge: 'FAST',
    badgeColor: Theme.colors.info,
    description: 'Optimizado para ritmo de conversaciones, dialectos y naturalidad en diálogos de personajes.',
    provider: 'Wattpad Speech Lab',
  },
  {
    id: 'wattpad-editor-lexicon',
    name: 'wattpad-editor-lexicon',
    badge: 'PRO',
    badgeColor: Theme.colors.purple,
    description: 'Revisión estilística, eliminación de redundancias, ortografía y fluidez de lectura.',
    provider: 'Wattpad Stylistics',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'claude-3-5-sonnet',
    badge: 'CLOUD',
    badgeColor: Theme.colors.warning,
    description: 'Análisis profundo de manuscritos extensos, consistencia de lore y coherencia de trama.',
    provider: 'Anthropic',
  },
  {
    id: 'gemini-1-5-pro',
    name: 'gemini-1-5-pro',
    badge: 'CLOUD',
    badgeColor: Theme.colors.success,
    description: 'Procesamiento de contexto masivo de novelas completas y estructuración capitular.',
    provider: 'Google DeepMind',
  },
];

export class AIModelsView {
  public static render(selectedIndex: number, width: number): string[] {
    const lines: string[] = [];

    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Modelos de Asistencia Narrativa IA'))}  ${Chalk.dim('[Wattpad AI Suite]')}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim('Motores de lenguaje optimizados para creación literaria, worldbuilding y corrección.')}`, width));
    lines.push('');

    for (let i = 0; i < AI_MODELS.length; i++) {
      const m = AI_MODELS[i];
      const isSelected = i === selectedIndex;

      const prefix = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.primary, '› '))
        : '  ';

      const title = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.white, m.name))
        : Chalk.hex(Theme.colors.text, m.name);

      const badge = Chalk.hex(m.badgeColor, `[${m.badge}]`);

      lines.push(padEndVisible(`${prefix}${title}  ${badge}`, width));
      lines.push(padEndVisible(`    ${Chalk.dim(m.description)}`, width));
      lines.push(padEndVisible(`    ${Chalk.dim(`Proveedor: ${m.provider}`)}`, width));
      lines.push('');
    }

    return lines;
  }
}
