import fs from 'fs';
import path from 'path';
import os from 'os';
import * as docx from 'docx';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { Story, Chapter } from '../../shared/types';
import { ApiClient } from '../api/api-client';

export class WordCloudIntegration {
  private tempDir: string;

  constructor(private apiClient: ApiClient) {
    this.tempDir = path.join(os.tmpdir(), 'wattpad-cli-cache', 'word');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public async openChapterInWord(story: Story, chapter: Chapter): Promise<string> {
    const cleanStory = story.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const storyFolder = path.join(this.tempDir, cleanStory);
    if (!fs.existsSync(storyFolder)) {
      fs.mkdirSync(storyFolder, { recursive: true });
    }

    const padded = String(chapter.chapterNumber).padStart(3, '0');
    const filePath = path.join(storyFolder, `capitulo_${padded}.docx`);

    // Build DOCX document from cloud content
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
    const cleanStory = story.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const padded = String(chapter.chapterNumber).padStart(3, '0');
    const filePath = path.join(this.tempDir, cleanStory, `capitulo_${padded}.docx`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`No se encontró el archivo temporal de Word en ${filePath}`);
    }

    const extracted = await mammoth.extractRawText({ path: filePath });
    const lines = extracted.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const content = lines.join('\n\n');
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Push revision directly to Cloud API!
    await this.apiClient.updateChapter(chapter.id, { content }, 'word');

    return { content, hash };
  }
}
