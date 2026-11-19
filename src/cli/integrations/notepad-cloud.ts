import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Story, Chapter } from '../../shared/types';
import { ApiClient } from '../api/api-client';
import { FileSystemManager } from '../../utils/file-system';

export class NotepadCloudIntegration {
  private fsManager: FileSystemManager;

  constructor(private apiClient: ApiClient) {
    this.fsManager = new FileSystemManager();
  }

  public async openChapterInNotepad(story: Story, chapter: Chapter): Promise<string> {
    const filePath = this.fsManager.getChapterFilePath(story.title, chapter.chapterNumber, 'txt', chapter.title);

    // Sync story metadata and synopsis into Informacion/
    this.fsManager.syncStoryStructure(story, [chapter]);

    const header = `# ${chapter.title}\n# Novela: ${story.title} (Capítulo ${chapter.chapterNumber})\n# Almacenado en: Mis novelas / Wattpad CLI\n\n`;
    const fullText = header + (chapter.content || '');

    fs.writeFileSync(filePath, fullText, { encoding: 'utf8' });

    if (process.platform === 'win32') {
      Bun.spawn(['notepad.exe', filePath], { detached: true });
    } else {
      const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
      Bun.spawn([opener, filePath], { detached: true });
    }

    return filePath;
  }

  public async importEditedChapter(story: Story, chapter: Chapter): Promise<{ content: string; hash: string }> {
    const filePath = this.fsManager.getChapterFilePath(story.title, chapter.chapterNumber, 'txt', chapter.title);

    if (!fs.existsSync(filePath)) {
      throw new Error(`No se encontró el archivo de Bloc de Notas en ${filePath}`);
    }

    const fullText = fs.readFileSync(filePath, 'utf8');
    const lines = fullText.split('\n');
    const contentLines: string[] = [];
    let inHeader = true;

    for (const line of lines) {
      if (inHeader && line.startsWith('#')) {
        continue;
      }
      inHeader = false;
      contentLines.push(line);
    }

    const cleanedContent = contentLines.join('\n').trim();
    const hash = crypto.createHash('sha256').update(cleanedContent).digest('hex');

    // Push revision directly to Cloud API
    await this.apiClient.updateChapter(chapter.id, { content: cleanedContent }, 'notepad');

    return { content: cleanedContent, hash };
  }
}
