import fs from 'fs';
import path from 'path';
import { sanitizeFileName } from './formatter';
import { defaultConfig } from '../config/config';

export class FileSystemManager {
  private baseDocsDir: string;

  constructor(baseDocsDir?: string) {
    this.baseDocsDir = baseDocsDir || defaultConfig.docsDir;
    if (!fs.existsSync(this.baseDocsDir)) {
      fs.mkdirSync(this.baseDocsDir, { recursive: true });
    }
  }

  public getStoryFolder(storyTitle: string): string {
    const cleanTitle = sanitizeFileName(storyTitle);
    const folder = path.join(this.baseDocsDir, cleanTitle);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    const chaptersFolder = path.join(folder, 'capitulos');
    if (!fs.existsSync(chaptersFolder)) {
      fs.mkdirSync(chaptersFolder, { recursive: true });
    }
    return folder;
  }

  public getStoryFilePath(storyTitle: string, ext: 'docx' | 'txt'): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    return path.join(storyFolder, `novela.${ext}`);
  }

  public getChapterFilePath(storyTitle: string, chapterNumber: number, ext: 'docx' | 'txt'): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    const chaptersFolder = path.join(storyFolder, 'capitulos');
    const padded = String(chapterNumber).padStart(3, '0');
    return path.join(chaptersFolder, `capitulo_${padded}.${ext}`);
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

    fs.copyFileSync(filePath, backupPath);
    return backupPath;
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
