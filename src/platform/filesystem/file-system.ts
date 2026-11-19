import fs from 'fs';
import path from 'path';
import { sanitizeFileName } from '../../core/utils/formatter';
import { defaultConfig } from '../../core/config/config';
import { Story } from '../../features/stories/types/story.types';
import { Chapter } from '../../features/chapters/types/chapter.types';

export class FileSystemManager {
  private baseDocsDir: string;

  constructor(baseDocsDir?: string) {
    if (baseDocsDir) {
      this.baseDocsDir = baseDocsDir;
    } else {
      // Primary location: "Mis novelas" in current working directory
      const localMisNovelas = path.resolve(process.cwd(), 'Mis novelas');
      this.baseDocsDir = localMisNovelas;
    }

    if (!fs.existsSync(this.baseDocsDir)) {
      try {
        fs.mkdirSync(this.baseDocsDir, { recursive: true });
      } catch {}
    }
  }

  public getBaseDir(): string {
    return this.baseDocsDir;
  }

  public getStoryFolder(storyTitle: string): string {
    const cleanTitle = sanitizeFileName(storyTitle);
    const storyFolder = path.join(this.baseDocsDir, cleanTitle);
    if (!fs.existsSync(storyFolder)) {
      fs.mkdirSync(storyFolder, { recursive: true });
    }

    const infoFolder = path.join(storyFolder, 'Informacion');
    if (!fs.existsSync(infoFolder)) {
      fs.mkdirSync(infoFolder, { recursive: true });
    }

    const chaptersFolder = path.join(storyFolder, 'Capitulos');
    if (!fs.existsSync(chaptersFolder)) {
      fs.mkdirSync(chaptersFolder, { recursive: true });
    }

    return storyFolder;
  }

  public getInfoFolder(storyTitle: string): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    const infoFolder = path.join(storyFolder, 'Informacion');
    if (!fs.existsSync(infoFolder)) {
      fs.mkdirSync(infoFolder, { recursive: true });
    }
    return infoFolder;
  }

  public getChaptersFolder(storyTitle: string): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    const chaptersFolder = path.join(storyFolder, 'Capitulos');
    if (!fs.existsSync(chaptersFolder)) {
      fs.mkdirSync(chaptersFolder, { recursive: true });
    }
    return chaptersFolder;
  }

  public getStoryFilePath(storyTitle: string, ext: 'docx' | 'txt'): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    return path.join(storyFolder, `novela.${ext}`);
  }

  public getChapterFilePath(
    storyTitle: string,
    chapterNumber: number,
    ext: 'docx' | 'txt' = 'docx',
    chapterTitle?: string
  ): string {
    const chaptersFolder = this.getChaptersFolder(storyTitle);
    const padded = String(chapterNumber).padStart(3, '0');
    const titlePart = chapterTitle ? ` - ${sanitizeFileName(chapterTitle)}` : '';
    return path.join(chaptersFolder, `${padded}${titlePart}.${ext}`);
  }

  public syncStoryStructure(story: Story, chapters: Chapter[]): void {
    const storyFolder = this.getStoryFolder(story.title);
    const infoFolder = this.getInfoFolder(story.title);
    const chaptersFolder = this.getChaptersFolder(story.title);

    // 1. Informacion/sinopsis.txt
    const synopsisPath = path.join(infoFolder, 'sinopsis.txt');
    try {
      fs.writeFileSync(synopsisPath, story.description || '', 'utf8');
    } catch {}

    // 2. Informacion/metadatos.json
    const metaPath = path.join(infoFolder, 'metadatos.json');
    const metadata = {
      id: story.id,
      wattpadId: story.wattpadId || null,
      title: story.title,
      description: story.description,
      genre: story.genre,
      category: story.category,
      tags: story.tags,
      language: story.language,
      mature: story.mature,
      editorPreference: story.editorPreference,
      status: story.status,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };
    try {
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
    } catch {}

    // 3. Capitulos/
    const ext = story.editorPreference === 'notepad' ? 'txt' : 'docx';
    for (const chap of chapters) {
      const padded = String(chap.chapterNumber).padStart(3, '0');
      const cleanTitle = sanitizeFileName(chap.title);
      const filePath = path.join(chaptersFolder, `${padded} - ${cleanTitle}.${ext}`);
      if (!fs.existsSync(filePath)) {
        try {
          if (ext === 'txt') {
            fs.writeFileSync(filePath, chap.content || '', 'utf8');
          }
        } catch {}
      }
    }
  }

  public createBackup(filePath: string, entityId: string): string | null {
    if (!fs.existsSync(filePath)) return null;

    const backupDir = defaultConfig.backupDir;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const backupName = `${entityId}_${timestamp}${ext}`;
    const backupPath = path.join(backupDir, backupName);

    try {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch {
      return null;
    }
  }

  public async openFileInOS(filePath: string, preferredEditor?: 'word' | 'notepad' | 'google'): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const isWindows = process.platform === 'win32';

    if (preferredEditor === 'notepad' && isWindows) {
      Bun.spawn(['notepad.exe', filePath], { detached: true });
      return true;
    }

    // Windows shell execute
    if (isWindows) {
      Bun.spawn(['cmd', '/c', 'start', '""', filePath], { detached: true });
      return true;
    }

    // Fallback for macOS / Linux
    const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
    Bun.spawn([opener, filePath], { detached: true });
    return true;
  }
}
