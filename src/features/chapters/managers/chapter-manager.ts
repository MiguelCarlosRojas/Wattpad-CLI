import { Chapter, ChapterStatus, ChapterVersion } from '../types/chapter.types';
import { sha256 } from '../../../core/security/crypto-utils';

export interface CreateChapterInput {
  storyId: string;
  title: string;
  chapterNumber?: number;
  content?: string;
  status?: ChapterStatus;
  externalDocId?: string;
}

export interface UpdateChapterInput {
  title?: string;
  chapterNumber?: number;
  content?: string;
  status?: ChapterStatus;
  wattpadId?: string;
  externalDocId?: string;
}

export class ChapterManager {
  private chapters: Map<string, Chapter> = new Map();
  private versions: Map<string, ChapterVersion[]> = new Map();
  private nextIdNum: number = 1;

  public getNextId(): string {
    let candidate = `CAP-${String(this.nextIdNum).padStart(4, '0')}`;
    while (this.findById(candidate)) {
      this.nextIdNum++;
      candidate = `CAP-${String(this.nextIdNum).padStart(4, '0')}`;
    }
    return candidate;
  }

  public create(input: CreateChapterInput): Chapter {
    const id = this.getNextId();
    this.nextIdNum++;
    const now = new Date().toISOString();

    const existingInStory = this.findByStoryId(input.storyId);
    const chapterNumber = input.chapterNumber || existingInStory.length + 1;
    const content = input.content || '';
    const contentHash = sha256(content);
    const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;

    const chapter: Chapter = {
      id,
      storyId: input.storyId,
      wattpadId: null,
      title: input.title,
      chapterNumber,
      content,
      contentHash,
      wordCount,
      status: input.status || 'draft',
      externalDocId: input.externalDocId || null,
      createdAt: now,
      updatedAt: now,
    };

    this.chapters.set(id.toUpperCase(), chapter);
    this.addVersion(id, input.title, content, 'cli');

    return chapter;
  }

  public findById(id: string): Chapter | null {
    if (!id) return null;
    return this.chapters.get(id.toUpperCase()) || null;
  }

  public findAll(): Chapter[] {
    return Array.from(this.chapters.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  public findByStoryId(storyId: string): Chapter[] {
    if (!storyId) return [];
    const upper = storyId.toUpperCase();
    return Array.from(this.chapters.values())
      .filter((c) => c.storyId.toUpperCase() === upper)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  public update(id: string, input: UpdateChapterInput, source: string = 'cli'): Chapter | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const title = input.title !== undefined ? input.title : existing.title;
    const chapterNumber = input.chapterNumber !== undefined ? input.chapterNumber : existing.chapterNumber;
    const content = input.content !== undefined ? input.content : existing.content;
    const status = input.status !== undefined ? input.status : existing.status;
    const wattpadId = input.wattpadId !== undefined ? input.wattpadId : existing.wattpadId;
    const externalDocId = input.externalDocId !== undefined ? input.externalDocId : existing.externalDocId;

    const contentHash = sha256(content);
    const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
    const contentChanged = content !== existing.content || title !== existing.title;

    const updated: Chapter = {
      ...existing,
      title,
      chapterNumber,
      content,
      contentHash,
      wordCount,
      status,
      wattpadId,
      externalDocId,
      updatedAt: now,
    };

    this.chapters.set(existing.id.toUpperCase(), updated);

    if (contentChanged) {
      this.addVersion(id, title, content, source as any);
    }

    return updated;
  }

  public delete(id: string): boolean {
    if (!id) return false;
    this.versions.delete(id.toUpperCase());
    return this.chapters.delete(id.toUpperCase());
  }

  public deleteByStoryId(storyId: string): void {
    if (!storyId) return;
    const upper = storyId.toUpperCase();
    for (const [key, ch] of this.chapters.entries()) {
      if (ch.storyId.toUpperCase() === upper) {
        this.versions.delete(key);
        this.chapters.delete(key);
      }
    }
  }

  public addVersion(
    chapterId: string,
    title: string,
    content: string,
    source: 'cli' | 'word' | 'notepad' | 'google' | 'wattpad'
  ): ChapterVersion {
    const upper = chapterId.toUpperCase();
    const existingList = this.versions.get(upper) || [];
    const nextVersion = existingList.length + 1;
    const now = new Date().toISOString();
    const hash = sha256(content);
    const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;

    const version: ChapterVersion = {
      id: nextVersion,
      chapterId,
      versionNumber: nextVersion,
      title,
      content,
      contentHash: hash,
      source,
      createdAt: now,
    };

    existingList.push(version);
    this.versions.set(upper, existingList);
    return version;
  }

  public getVersions(chapterId: string): ChapterVersion[] {
    return this.versions.get(chapterId.toUpperCase()) || [];
  }

  public clear(): void {
    this.chapters.clear();
    this.versions.clear();
    this.nextIdNum = 1;
  }
}
