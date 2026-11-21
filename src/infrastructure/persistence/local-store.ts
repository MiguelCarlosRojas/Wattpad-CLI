import path from 'path';
import fs from 'fs';
import { FileManager } from '../filesystem/file-manager';
import { CryptoVault } from '../security/crypto-vault';
import { UserSession } from '../../shared/types/auth.types';
import { StoryMetadata } from '../../shared/types/story.types';
import { ChapterMetadata } from '../../shared/types/chapter.types';
import { LibraryItem } from '../../shared/types/library.types';

export interface CliSettings {
  theme: 'dark' | 'zen';
  autoSaveIntervalSeconds: number;
  documentsDir: string;
  defaultLanguage: string;
}

const DEFAULT_SETTINGS: CliSettings = {
  theme: 'dark',
  autoSaveIntervalSeconds: 30,
  documentsDir: path.join(FileManager.getRoot(), 'manuscripts', 'stories'),
  defaultLanguage: 'es',
};

/**
 * Almacén de persistencia local soberana basada en JSON
 */
export class LocalStore {
  /**
   * Guarda la sesión del usuario de forma cifrada
   */
  public static saveSession(session: UserSession): void {
    FileManager.ensureStructure();
    const sessionFile = path.join(FileManager.getAuthDir(), 'session.json');
    const safeData = {
      ...session,
      token: CryptoVault.encrypt(session.token),
    };
    FileManager.writeJson(sessionFile, safeData);
  }

  /**
   * Carga la sesión del usuario descifrando el token
   */
  public static loadSession(): UserSession | null {
    FileManager.ensureStructure();
    const sessionFile = path.join(FileManager.getAuthDir(), 'session.json');
    const data = FileManager.readJson<UserSession>(sessionFile);
    if (!data || !data.token) return null;

    try {
      const decryptedToken = CryptoVault.decrypt(data.token);
      return {
        ...data,
        token: decryptedToken || data.token,
      };
    } catch {
      return data;
    }
  }

  /**
   * Elimina la sesión activa
   */
  public static clearSession(): void {
    const sessionFile = path.join(FileManager.getAuthDir(), 'session.json');
    if (fs.existsSync(sessionFile)) {
      try {
        fs.unlinkSync(sessionFile);
      } catch {}
    }
  }

  /**
   * Carga la configuración del CLI
   */
  public static loadSettings(): CliSettings {
    FileManager.ensureStructure();
    const file = path.join(FileManager.getConfigDir(), 'settings.json');
    const loaded = FileManager.readJson<Partial<CliSettings>>(file);
    return { ...DEFAULT_SETTINGS, ...loaded };
  }

  /**
   * Guarda la configuración del CLI
   */
  public static saveSettings(settings: CliSettings): void {
    FileManager.ensureStructure();
    const file = path.join(FileManager.getConfigDir(), 'settings.json');
    FileManager.writeJson(file, settings);
  }

  /**
   * Carga la biblioteca local
   */
  public static loadLibrary(): LibraryItem[] {
    FileManager.ensureStructure();
    const file = path.join(FileManager.getDataDir(), 'library.json');
    return FileManager.readJson<LibraryItem[]>(file) || [];
  }

  /**
   * Guarda la biblioteca local
   */
  public static saveLibrary(items: LibraryItem[]): void {
    FileManager.ensureStructure();
    const file = path.join(FileManager.getDataDir(), 'library.json');
    FileManager.writeJson(file, items);
  }

  /**
   * Carga todas las historias locales creadas por el usuario
   */
  public static loadMyStories(): StoryMetadata[] {
    FileManager.ensureStructure();
    const rootStories = FileManager.getManuscriptsDir();
    if (!fs.existsSync(rootStories)) return [];

    const dirs = fs.readdirSync(rootStories);
    const stories: StoryMetadata[] = [];

    for (const d of dirs) {
      const fullPath = path.join(rootStories, d);
      if (fs.statSync(fullPath).isDirectory()) {
        const metaPath = path.join(fullPath, 'story.json');
        const meta = FileManager.readJson<StoryMetadata>(metaPath);
        if (meta) {
          // Re-calcular conteo de capítulos leyendo la carpeta chapters/
          const chapDir = path.join(fullPath, 'chapters');
          if (fs.existsSync(chapDir)) {
            const files = fs.readdirSync(chapDir).filter((f) => f.endsWith('.md'));
            meta.totalChapters = files.length;
          }
          stories.push(meta);
        }
      }
    }

    return stories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Guarda o actualiza una historia local
   */
  public static saveStory(story: StoryMetadata): void {
    const storyDir = FileManager.getStoryDir(story.title || story.id);
    const metaPath = path.join(storyDir, 'story.json');
    story.updatedAt = new Date().toISOString();
    FileManager.writeJson(metaPath, story);
  }

  /**
   * Elimina una historia local
   */
  public static deleteStory(storyIdOrTitle: string): boolean {
    const storyDir = FileManager.getStoryDir(storyIdOrTitle);
    if (fs.existsSync(storyDir)) {
      try {
        fs.rmSync(storyDir, { recursive: true, force: true });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Carga los capítulos de una historia
   */
  public static loadChapters(storyTitleOrId: string): ChapterMetadata[] {
    const storyDir = FileManager.getStoryDir(storyTitleOrId);
    const chapDir = path.join(storyDir, 'chapters');
    if (!fs.existsSync(chapDir)) return [];

    const metaFile = path.join(storyDir, 'chapters.json');
    let chapterMetas = FileManager.readJson<ChapterMetadata[]>(metaFile) || [];

    // Validar con archivos reales .md
    const files = fs.readdirSync(chapDir).filter((f) => f.endsWith('.md')).sort();
    const result: ChapterMetadata[] = [];

    files.forEach((file, index) => {
      const num = index + 1;
      const existing = chapterMetas.find((c) => c.filePath.endsWith(file) || c.number === num);
      const filePath = path.join(chapDir, file);
      const content = FileManager.readText(filePath);
      const words = content.trim().split(/\s+/).filter(Boolean).length;

      if (existing) {
        existing.wordsCount = words;
        existing.filePath = filePath;
        result.push(existing);
      } else {
        const titleWithoutExt = path.basename(file, '.md').replace(/^\d+[\s_-]*/, '');
        result.push({
          id: `CAP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          storyId: storyTitleOrId,
          number: num,
          title: titleWithoutExt || `Capítulo ${num}`,
          status: 'draft',
          wordsCount: words,
          charsCount: content.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          filePath,
        });
      }
    });

    FileManager.writeJson(metaFile, result);
    return result;
  }

  /**
   * Guarda o actualiza un capítulo
   */
  public static saveChapter(storyTitleOrId: string, chapter: ChapterMetadata, content: string): void {
    const storyDir = FileManager.getStoryDir(storyTitleOrId);
    const chapDir = path.join(storyDir, 'chapters');
    const safeTitle = chapter.title.replace(/[^\w\s-]/g, '').trim() || `Capitulo-${chapter.number}`;
    const filename = `${String(chapter.number).padStart(3, '0')}-${safeTitle}.md`;
    const filePath = path.join(chapDir, filename);

    // Respaldo previo si ya existía
    if (fs.existsSync(filePath)) {
      FileManager.createBackup(filePath, path.join(storyDir, 'backups'));
    }

    FileManager.writeText(filePath, content);
    chapter.filePath = filePath;
    chapter.wordsCount = content.trim().split(/\s+/).filter(Boolean).length;
    chapter.charsCount = content.length;
    chapter.updatedAt = new Date().toISOString();

    const metaFile = path.join(storyDir, 'chapters.json');
    let chapterMetas = FileManager.readJson<ChapterMetadata[]>(metaFile) || [];
    const idx = chapterMetas.findIndex((c) => c.id === chapter.id || c.number === chapter.number);
    if (idx >= 0) {
      chapterMetas[idx] = chapter;
    } else {
      chapterMetas.push(chapter);
    }
    FileManager.writeJson(metaFile, chapterMetas);
  }
}
