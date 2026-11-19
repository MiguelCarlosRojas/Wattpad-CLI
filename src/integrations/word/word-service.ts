import fs from 'fs';
import path from 'path';
import * as docx from 'docx';
import mammoth from 'mammoth';
import { sha256 } from '../../security/crypto-utils';
import { FileSystemManager } from '../../utils/file-system';
import { Chapter } from '../../types/chapter.types';
import { Story } from '../../types/story.types';
import { DocumentParser, DocumentParseResult } from '../document-parser';

export class WordService {
  private fsManager: FileSystemManager;

  constructor(fsManager?: FileSystemManager) {
    this.fsManager = fsManager || new FileSystemManager();
  }

  public async importDocument(filePath: string): Promise<DocumentParseResult> {
    return DocumentParser.parseFile(filePath);
  }

  public async exportChapterToDocx(story: Story, chapter: Chapter): Promise<{ filePath: string; hash: string }> {
    const filePath = this.fsManager.getChapterFilePath(story.title, chapter.chapterNumber, 'docx');

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
          properties: {},
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

    const extracted = await this.readChapterFromDocx(filePath);
    return {
      filePath,
      hash: extracted.hash,
    };
  }

  public async exportStoryToDocx(story: Story, chapters: Chapter[]): Promise<{ filePath: string; hash: string }> {
    const filePath = this.fsManager.getStoryFilePath(story.title, 'docx');

    const docChildren: docx.Paragraph[] = [
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: story.title,
            bold: true,
            size: 48,
            font: 'Calibri',
            color: 'FF6122',
          }),
        ],
        spacing: { after: 200 },
      }),
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: `Género: ${story.genre} | Idioma: ${story.language.toUpperCase()}`,
            italics: true,
            size: 22,
            font: 'Calibri',
            color: '666666',
          }),
        ],
        spacing: { after: 300 },
      }),
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: story.description || 'Sin sinopsis disponible.',
            size: 24,
            font: 'Calibri',
          }),
        ],
        spacing: { after: 600 },
      }),
    ];

    for (const ch of chapters) {
      docChildren.push(
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Capítulo ${ch.chapterNumber}: ${ch.title}`,
              bold: true,
              size: 32,
              font: 'Calibri',
              color: '222222',
            }),
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      const paragraphs = (ch.content || '')
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

      docChildren.push(...paragraphs);
    }

    const doc = new docx.Document({
      sections: [{ children: docChildren }],
    });

    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    const extracted = await mammoth.extractRawText({ path: filePath });
    const content = extracted.value.trim();
    return {
      filePath,
      hash: sha256(content),
    };
  }

  public async readChapterFromDocx(filePath: string): Promise<{ content: string; hash: string }> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const result = await mammoth.extractRawText({ path: filePath });
    const lines = result.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // If first line matches chapter title or heading, keep content intact
    const content = lines.join('\n\n');
    return {
      content,
      hash: sha256(content),
    };
  }
}
