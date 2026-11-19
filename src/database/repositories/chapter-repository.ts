import { Database } from 'bun:sqlite';
import { Chapter, ChapterVersion, CreateChapterInput, UpdateChapterInput, ChapterStatus } from '../../types/chapter.types';
import { formatId, sha256 } from '../../security/crypto-utils';

export class ChapterRepository {
  constructor(private db: Database) {}

  public getNextId(): string {
    const row = this.db.query('SELECT count(*) as count FROM chapters').get() as { count: number };
    const nextSeq = (row?.count || 0) + 1;
    let candidate = formatId('CAP', nextSeq);

    let i = nextSeq;
    while (this.findById(candidate)) {
      i++;
      candidate = formatId('CAP', i);
    }
    return candidate;
  }

  public getNextChapterNumber(storyId: string): number {
    const row = this.db.query('SELECT MAX(chapter_number) as max_num FROM chapters WHERE story_id = ?').get(storyId) as { max_num: number | null };
    return (row?.max_num || 0) + 1;
  }

  public create(input: CreateChapterInput): Chapter {
    const id = this.getNextId();
    const now = new Date().toISOString();
    const content = input.content || '';
    const contentHash = sha256(content);
    const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
    const chapterNumber = input.chapterNumber || this.getNextChapterNumber(input.storyId);

    this.db.run(
      `INSERT INTO chapters (
        id, story_id, wattpad_id, title, chapter_number, content, content_hash,
        word_count, status, external_doc_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.storyId,
        null,
        input.title,
        chapterNumber,
        content,
        contentHash,
        wordCount,
        input.status || 'draft',
        null,
        now,
        now,
      ]
    );

    // Initial version
    this.addVersion(id, input.title, content, 'cli');

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to create chapter with ID ${id}`);
    }
    return created;
  }

  public findById(id: string): Chapter | null {
    const row = this.db.query('SELECT * FROM chapters WHERE id = ? COLLATE NOCASE').get(id) as Record<string, any> | null;
    return row ? this.mapRowToChapter(row) : null;
  }

  public findAll(): Chapter[] {
    const rows = this.db.query('SELECT * FROM chapters ORDER BY chapter_number ASC').all() as Array<Record<string, any>>;
    return rows.map((r) => this.mapRowToChapter(r));
  }

  public findByStoryId(storyId: string): Chapter[] {
    const rows = this.db.query('SELECT * FROM chapters WHERE story_id = ? COLLATE NOCASE ORDER BY chapter_number ASC').all(storyId) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRowToChapter(r));
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

    // Check if content or title changed to create a new version snapshot
    const contentChanged = content !== existing.content || title !== existing.title;

    this.db.run(
      `UPDATE chapters SET
        title = ?, chapter_number = ?, content = ?, content_hash = ?,
        word_count = ?, status = ?, wattpad_id = ?, external_doc_id = ?, updated_at = ?
      WHERE id = ? COLLATE NOCASE`,
      [
        title,
        chapterNumber,
        content,
        contentHash,
        wordCount,
        status,
        wattpadId,
        externalDocId,
        now,
        id,
      ]
    );

    if (contentChanged) {
      this.addVersion(id, title, content, source as any);
    }

    return this.findById(id);
  }

  public delete(id: string): boolean {
    const res = this.db.run('DELETE FROM chapters WHERE id = ? COLLATE NOCASE', [id]);
    return res.changes > 0;
  }

  public addVersion(
    chapterId: string,
    title: string,
    content: string,
    source: 'cli' | 'word' | 'notepad' | 'google' | 'wattpad'
  ): ChapterVersion {
    const row = this.db.query('SELECT MAX(version_num) as max_v FROM chapter_versions WHERE chapter_id = ?').get(chapterId) as { max_v: number | null };
    const nextVersion = (row?.max_v || 0) + 1;
    const now = new Date().toISOString();
    const hash = sha256(content);

    this.db.run(
      `INSERT INTO chapter_versions (
        chapter_id, version_num, title, content, content_hash, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [chapterId, nextVersion, title, content, hash, source, now]
    );

    const versionRow = this.db.query(
      'SELECT * FROM chapter_versions WHERE chapter_id = ? AND version_num = ?'
    ).get(chapterId, nextVersion) as Record<string, any>;

    return {
      id: versionRow.id,
      chapterId: versionRow.chapter_id,
      versionNumber: versionRow.version_num,
      title: versionRow.title,
      content: versionRow.content,
      contentHash: versionRow.content_hash,
      source: versionRow.source,
      createdAt: versionRow.created_at,
    };
  }

  public getVersions(chapterId: string): ChapterVersion[] {
    const rows = this.db.query('SELECT * FROM chapter_versions WHERE chapter_id = ? ORDER BY version_num DESC').all(chapterId) as Array<Record<string, any>>;
    return rows.map((r) => ({
      id: r.id,
      chapterId: r.chapter_id,
      versionNumber: r.version_num,
      title: r.title,
      content: r.content,
      contentHash: r.content_hash,
      source: r.source,
      createdAt: r.created_at,
    }));
  }

  public getVersion(chapterId: string, versionNumber: number): ChapterVersion | null {
    const r = this.db.query('SELECT * FROM chapter_versions WHERE chapter_id = ? AND version_num = ?').get(chapterId, versionNumber) as Record<string, any> | null;
    if (!r) return null;
    return {
      id: r.id,
      chapterId: r.chapter_id,
      versionNumber: r.version_num,
      title: r.title,
      content: r.content,
      contentHash: r.content_hash,
      source: r.source,
      createdAt: r.created_at,
    };
  }

  private mapRowToChapter(row: Record<string, any>): Chapter {
    return {
      id: row.id,
      storyId: row.story_id,
      wattpadId: row.wattpad_id,
      title: row.title,
      chapterNumber: row.chapter_number,
      content: row.content || '',
      contentHash: row.content_hash,
      wordCount: row.word_count || 0,
      status: row.status as ChapterStatus,
      externalDocId: row.external_doc_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
