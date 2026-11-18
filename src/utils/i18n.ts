export type Locale = 'es' | 'en';

export const translations = {
  es: {
    app_title: 'WATTPAD CLI',
    welcome_title: 'Bienvenido a Wattpad CLI',
    welcome_subtitle: 'Tu estudio de terminal para crear, escribir y sincronizar historias',
    prompt_placeholder: 'Escribe / para consultar los comandos',
    shortcuts_help: 'Tab: Autocompletar | Enter: Ejecutar | ↑↓: Historial | /help: Ayuda | /exit: Salir',
    auth_logged_in: 'Conectado como',
    auth_not_logged_in: 'Sin iniciar sesión (Modo local)',
    status_draft: 'Borrador Local',
    status_pending: 'Pendiente de Publicación',
    status_synced: 'Sincronizado',
    status_published: 'Publicado',
    status_error: 'Error',
    connection_word: 'Microsoft Word',
    connection_notepad: 'Bloc de Notas',
    connection_google: 'Google Docs',
    connection_wattpad: 'Wattpad Cloud',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    no_stories_found: 'No tienes novelas registradas todavía. Usa /story new para crear una.',
    no_chapters_found: 'Esta novela no tiene capítulos. Usa /chapter new para añadir uno.',
    story_created: 'Novela creada exitosamente',
    chapter_created: 'Capítulo creado exitosamente',
    save_success: 'Cambios guardados correctamente',
    sync_success: 'Sincronización completada sin conflictos',
    conflict_detected: 'Conflicto detectado entre la versión local y el archivo externo',
    confirm_publish: '¿Estás seguro de que deseas publicar en Wattpad? (Operación real)',
    help_categories: {
      general: 'Generales',
      auth: 'Autenticación',
      profile: 'Perfil y Buzón',
      language: 'Idioma',
      library: 'Biblioteca',
      stories: 'Novelas',
      chapters: 'Capítulos',
      connections: 'Conexiones Externas',
      sync: 'Sincronización',
      explore: 'Explorar y Buscar',
      publish: 'Publicación',
    },
  },
  en: {
    app_title: 'WATTPAD CLI',
    welcome_title: 'Welcome to Wattpad CLI',
    welcome_subtitle: 'Your terminal studio to write, manage and sync stories',
    prompt_placeholder: 'Type / to explore available commands',
    shortcuts_help: 'Tab: Autocomplete | Enter: Execute | ↑↓: History | /help: Help | /exit: Exit',
    auth_logged_in: 'Logged in as',
    auth_not_logged_in: 'Not logged in (Local mode)',
    status_draft: 'Local Draft',
    status_pending: 'Pending Publication',
    status_synced: 'Synced',
    status_published: 'Published',
    status_error: 'Error',
    connection_word: 'Microsoft Word',
    connection_notepad: 'Notepad',
    connection_google: 'Google Docs',
    connection_wattpad: 'Wattpad Cloud',
    connected: 'Connected',
    disconnected: 'Disconnected',
    no_stories_found: 'No stories registered yet. Use /story new to create one.',
    no_chapters_found: 'This story has no chapters. Use /chapter new to add one.',
    story_created: 'Story created successfully',
    chapter_created: 'Chapter created successfully',
    save_success: 'Changes saved successfully',
    sync_success: 'Sync completed without conflicts',
    conflict_detected: 'Conflict detected between local version and external file',
    confirm_publish: 'Are you sure you want to publish to Wattpad? (Real operation)',
    help_categories: {
      general: 'General',
      auth: 'Authentication',
      profile: 'Profile & Inbox',
      language: 'Language',
      library: 'Library',
      stories: 'Stories',
      chapters: 'Chapters',
      connections: 'External Connections',
      sync: 'Synchronization',
      explore: 'Explore & Search',
      publish: 'Publishing',
    },
  },
};

let currentLocale: Locale = 'es';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: keyof typeof translations.es): string {
  const dict = translations[currentLocale] || translations.es;
  const val = dict[key];
  if (typeof val === 'string') return val;
  return key;
}
