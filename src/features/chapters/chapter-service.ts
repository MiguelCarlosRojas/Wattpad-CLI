import { ChapterMetadata } from '../../shared/types/chapter.types';
import { LocalStore } from '../../infrastructure/persistence/local-store';
import { FileManager } from '../../infrastructure/filesystem/file-manager';
import { countWords } from '../../shared/utils/string-utils';

export class ChapterService {
  public static getChapters(storyTitleOrId: string): ChapterMetadata[] {
    return LocalStore.loadChapters(storyTitleOrId);
  }

  public static getChapterContent(filePath: string): string {
    return FileManager.readText(filePath);
  }

  public static saveChapter(storyTitleOrId: string, chapter: ChapterMetadata, content: string): void {
    chapter.wordsCount = countWords(content);
    chapter.charsCount = content.length;
    chapter.updatedAt = new Date().toISOString();
    LocalStore.saveChapter(storyTitleOrId, chapter, content);
  }

  public static createNewChapter(storyTitleOrId: string, title: string, initialContent: string = ''): ChapterMetadata {
    const existing = this.getChapters(storyTitleOrId);
    const nextNumber = existing.length + 1;
    const newChap: ChapterMetadata = {
      id: `CAP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      storyId: storyTitleOrId,
      number: nextNumber,
      title: title.trim() || `Capítulo ${nextNumber}`,
      status: 'draft',
      wordsCount: countWords(initialContent),
      charsCount: initialContent.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filePath: '',
    };
    LocalStore.saveChapter(storyTitleOrId, newChap, initialContent);
    return newChap;
  }
}
