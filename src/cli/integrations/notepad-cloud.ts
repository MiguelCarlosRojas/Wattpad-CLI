import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Story, Chapter } from '../../shared/types';
import { ApiClient } from '../api/api-client';

export class NotepadCloudIntegration {
  private tempDir: string;

  constructor(private apiClient: ApiClient) {
    this.tempDir = path.join(os.tmpdir(), 'wattpad-cli-cache', 'notepad');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public async openChapterInNotepad(story: Story, chapter: Chapter): Promise<string> {
    const cleanStory = story.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const storyFolder = path.join(this.tempDir, cleanStory);
    if (!fs.existsSync(storyFolder)) {
      fs.mkdirSync(storyFolder, { recursive: true });
    }

    const padded = String(chapter.chapterNumber).padStart(3, '0');
    const filePath = path.join(storyFolder, `capitulo_${padded}.txt`);

    const header = `# ${chapter.title}\n# Novela: ${story.title} (Capítulo ${chapter.chapterNumber})\n# Almacenado en: Wattpad Cloud\n\n`;
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
    const cleanStory = story.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const padded = String(chapter.chapterNumber).padStart(3, '0');
    const filePath = path.join(this.tempDir, cleanStory, `capitulo_${padded}.txt`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`No se encontró el archivo temporal de Bloc de Notas en ${filePath}`);
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

    // Push revision directly to Cloud API!
    await this.apiClient.updateChapter(chapter.id, { content: cleanedContent }, 'notepad');

    return { content: cleanedContent, hash };
  }
}
