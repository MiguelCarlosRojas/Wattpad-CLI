export type CommandCategory =
  | 'general'
  | 'auth'
  | 'profile'
  | 'language'
  | 'library'
  | 'stories'
  | 'chapters'
  | 'connections'
  | 'sync'
  | 'explore'
  | 'publish';

export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface ParsedCommand {
  raw: string;
  name: string; // e.g. "/story"
  subcommand?: string; // e.g. "new"
  args: string[];
  flags: Record<string, string | boolean>;
}

export interface Suggestion {
  command: string;
  description: string;
  category: CommandCategory;
  example?: string;
}

export interface RenderBlock {
  type: 'text' | 'card' | 'badge' | 'list' | 'error' | 'success' | 'warning' | 'info' | 'diff' | 'custom';
  title?: string;
  subtitle?: string;
  content?: string;
  statusBadge?: string;
  statusColor?: string;
  fields?: Array<{ label: string; value: string }>;
  items?: Array<string | { primary: string; secondary?: string; badge?: string }>;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  blocks?: RenderBlock[];
  exitApp?: boolean;
  clearScreen?: boolean;
}

// Forward reference for Application context
export interface IAppContext {
  database: unknown;
  services: unknown;
  currentStoryId: string | null;
  currentChapterId: string | null;
  language: 'es' | 'en';
}

export interface CommandDefinition {
  name: string; // e.g. "/stories" or "/story"
  subcommands?: string[]; // e.g. ["new", "open", "info", "edit", "delete"]
  category: CommandCategory;
  description: string;
  descriptionEn: string;
  usage: string;
  examples: string[];
  minArgs?: number;
  maxArgs?: number;
  execute: (context: any, parsed: ParsedCommand) => Promise<CommandResult> | CommandResult;
}
