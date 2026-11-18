import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';
import { setLocale, getLocale } from '../../utils/i18n';

export function createLanguageCommands(): CommandDefinition[] {
  return [
    {
      name: '/language',
      subcommands: ['set'],
      category: 'language',
      description: 'Consulta o cambia el idioma de la interfaz (es / en)',
      descriptionEn: 'View or set interface language (es / en)',
      usage: '/language [set es|en]',
      examples: ['/language', '/language set es', '/language set en'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        if (parsed.subcommand === 'set') {
          const target = parsed.args[0]?.toLowerCase();
          if (target === 'es' || target === 'en') {
            setLocale(target);
            app.settingsRepo.set('language', target);
            return {
              success: true,
              blocks: [
                {
                  type: 'success',
                  title: target === 'es' ? 'Idioma configurado' : 'Language updated',
                  content: target === 'es'
                    ? 'El idioma de la interfaz se ha cambiado a Español.'
                    : 'Interface language has been changed to English.',
                },
              ],
            };
          } else {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Idioma inválido',
                  content: 'Idiomas soportados: "es" (Español) o "en" (English).\nEjemplo: /language set es',
                },
              ],
            };
          }
        }

        const current = getLocale();
        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'IDIOMA DE WATTPAD CLI',
              statusBadge: current.toUpperCase(),
              statusColor: '#17A2B8',
              fields: [
                { label: 'Idioma Actual', value: current === 'es' ? 'Español (es)' : 'English (en)' },
                { label: 'Cambiar a Español', value: '/language set es' },
                { label: 'Change to English', value: '/language set en' },
              ],
            },
          ],
        };
      },
    },
  ];
}
