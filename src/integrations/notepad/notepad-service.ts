import fs from 'fs';
import path from 'path';
import { sha256 } from '../../security/crypto-utils';
import { FileSystemManager } from '../../utils/file-system';
import { Chapter } from '../../types/chapter.types';
import { Story } from '../../types/story.types';
import { DocumentParser, DocumentParseResult } from '../document-parser';

export class NotepadService {
  private fsManager: FileSystemManager;

  constructor(fsManager?: FileSystemManager) {
    this.fsManager = fsManager || new FileSystemManager();
  }

  public async importDocument(filePath: string): Promise<DocumentParseResult> {
    return DocumentParser.parseFile(filePath);
  }

  public exportChapterToTxt(story: Story, chapter: Chapter): { filePath: string; hash: string } {
    const filePath = this.fsManager.getChapterFilePath(story.title, chapter.chapterNumber, 'txt');

    const header = `# ${chapter.title}\n# Novela: ${story.title} (Capítulo ${chapter.chapterNumber})\n\n`;
    const fullText = header + (chapter.content || '');

    fs.writeFileSync(filePath, fullText, { encoding: 'utf8' });
    return {
      filePath,
      hash: sha256(fullText),
    };
  }

  public exportStoryToTxt(story: Story, chapters: Chapter[]): { filePath: string; hash: string } {
    const filePath = this.fsManager.getStoryFilePath(story.title, 'txt');

    let fullText = `=====================================================\n`;
    fullText += `${story.title}\n`;
    fullText += `Género: ${story.genre} | Idioma: ${story.language.toUpperCase()}\n`;
    fullText += `=====================================================\n\n`;
    fullText += `SINOPSIS:\n${story.description || 'Sin sinopsis.'}\n\n`;

    for (const ch of chapters) {
      fullText += `-----------------------------------------------------\n`;
      fullText += `CAPÍTULO ${ch.chapterNumber}: ${ch.title}\n`;
      fullText += `-----------------------------------------------------\n\n`;
      fullText += `${ch.content || ''}\n\n`;
    }

    fs.writeFileSync(filePath, fullText, { encoding: 'utf8' });
    return {
      filePath,
      hash: sha256(fullText),
    };
  }

  public readChapterFromTxt(filePath: string): { content: string; hash: string } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const fullText = fs.readFileSync(filePath, 'utf8');

    // Strip optional comment header (# Title)
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
    return {
      content: cleanedContent,
      hash: sha256(fullText),
    };
  }
}
