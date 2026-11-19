import fs from 'fs';
import path from 'path';
import os from 'os';
import * as docx from 'docx';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { Story, Chapter } from '../../shared/types';
import { ApiClient } from '../api/api-client';
import { FileSystemManager } from '../../utils/file-system';

export class WordCloudIntegration {
  private fsManager: FileSystemManager;

  constructor(private apiClient: ApiClient) {
    this.fsManager = new FileSystemManager();
  }

  public async openChapterInWord(story: Story, chapter: Chapter): Promise<string> {
    const filePath = this.fsManager.getChapterFilePath(story.title, chapter.chapterNumber, 'docx', chapter.title);

    // Sync story metadata and synopsis into Informacion/
    this.fsManager.syncStoryStructure(story, [chapter]);

    // Build DOCX document from chapter content
    const paragraphs = (chapter.content || '')
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map(
        (p) =>
          new docx.Paragraph({
            children: [new docx.TextRun({ text: p, size: 24, font: 'Calibri' })],
            spacing: { after: 180, line: 320 },
          })
      );

    const doc = new docx.Document({
      sections: [
        {
          children: [
            new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: chapter.title,
                  bold: true,
                  size: 36,
                  font: 'Calibri',
                  color: 'FF6122', // Wattpad Orange
                }),
              ],
              spacing: { after: 400 },
            }),
            ...paragraphs,
          ],
        },
      ],
    });

    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    // Launch Word or OS default editor
    if (process.platform === 'win32') {
      Bun.spawn(['cmd', '/c', 'start', '""', filePath], { detached: true });
    } else {
      const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
      Bun.spawn([opener, filePath], { detached: true });
    }

    return filePath;
  }

  public async importEditedChapter(story: Story, chapter: Chapter): Promise<{ content: string; hash: string }> {
    const filePath = this.fsManager.getChapterFilePath(story.title, chapter.chapterNumber, 'docx', chapter.title);

    if (!fs.existsSync(filePath)) {
      throw new Error(`No se encontró el archivo Word en ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value.trim();
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Push revision directly to Cloud API
    await this.apiClient.updateChapter(chapter.id, { content }, 'word');

    return { content, hash };
  }
}
