import { describe, expect, it } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { WordService } from '../src/integrations/word/word-service';
import { NotepadService } from '../src/integrations/notepad/notepad-service';
import { FileSystemManager } from '../src/utils/file-system';
import { Story } from '../src/types/story.types';
import { Chapter } from '../src/types/chapter.types';

describe('Document Integrations (Word & Notepad)', () => {
  const tmpDir = path.join(os.tmpdir(), `wattpad_docs_test_${Date.now()}`);
  const fsManager = new FileSystemManager(tmpDir);
  const wordService = new WordService(fsManager);
  const notepadService = new NotepadService(fsManager);

  const mockStory: Story = {
    id: 'NOV-0001',
    wattpadId: null,
    title: 'La Flor del Desierto',
    description: 'Aventura épica en las arenas infinitas.',
    coverUrl: null,
    genre: 'Aventura',
    category: 'Novela',
    tags: ['desierto', 'fantasia'],
    language: 'es',
    mature: false,
    editorPreference: 'word',
    status: 'draft',
    localPath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockChapter: Chapter = {
    id: 'CAP-0001',
    storyId: 'NOV-0001',
    wattpadId: null,
    title: 'Capítulo 1: El Oasis Perdido',
    chapterNumber: 1,
    content: 'El viento soplaba con furia sobre las dunas doradas.\nUn viajero solitario divisó el destello del agua.',
    contentHash: 'somehash',
    wordCount: 17,
    status: 'draft',
    externalDocId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should export and read a chapter in Word DOCX format', async () => {
    const { filePath, hash } = await wordService.exportChapterToDocx(mockStory, mockChapter);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath.endsWith('.docx')).toBe(true);
    expect(hash.length).toBe(64);

    const extracted = await wordService.readChapterFromDocx(filePath);
    expect(extracted.content.length).toBeGreaterThan(0);
    expect(extracted.content).toContain('El Oasis Perdido');
  });

  it('should export and read a chapter in Notepad TXT format', () => {
    const { filePath, hash } = notepadService.exportChapterToTxt(mockStory, mockChapter);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath.endsWith('.txt')).toBe(true);
    expect(hash.length).toBe(64);

    const extracted = notepadService.readChapterFromTxt(filePath);
    expect(extracted.content).toContain('El viento soplaba con furia sobre las dunas doradas.');
  });
});
