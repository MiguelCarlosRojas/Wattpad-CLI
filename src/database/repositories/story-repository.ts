import { Database } from 'bun:sqlite';
import { Story, CreateStoryInput, UpdateStoryInput, StoryStatus } from '../../types/story.types';
import { formatId } from '../../security/crypto-utils';

export class StoryRepository {
  constructor(private db: Database) {}

  public getNextId(): string {
    const row = this.db.query('SELECT count(*) as count FROM stories').get() as { count: number };
    const nextSeq = (row?.count || 0) + 1;
    let candidate = formatId('NOV', nextSeq);

    // Ensure uniqueness in case of deletions
    let i = nextSeq;
    while (this.findById(candidate)) {
      i++;
      candidate = formatId('NOV', i);
    }
    return candidate;
  }

  public create(input: CreateStoryInput): Story {
    const id = this.getNextId();
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(input.tags || []);

    this.db.run(
      `INSERT INTO stories (
        id, wattpad_id, title, description, cover_url, genre, category, tags,
        language, mature, editor_preference, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        null,
        input.title,
        input.description || '',
        input.coverUrl || null,
        input.genre || 'General',
        input.category || 'Novela',
        tagsJson,
        input.language || 'es',
        input.mature ? 1 : 0,
        input.editorPreference || 'word',
        input.status || 'draft',
        now,
        now,
      ]
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to create story with ID ${id}`);
    }
    return created;
  }

  public findById(id: string): Story | null {
    const row = this.db.query('SELECT * FROM stories WHERE id = ?').get(id) as Record<string, any> | null;
    return row ? this.mapRowToStory(row) : null;
  }

  public findByWattpadId(wattpadId: string): Story | null {
    const row = this.db.query('SELECT * FROM stories WHERE wattpad_id = ?').get(wattpadId) as Record<string, any> | null;
    return row ? this.mapRowToStory(row) : null;
  }

  public findAll(): Story[] {
    const rows = this.db.query('SELECT * FROM stories ORDER BY updated_at DESC').all() as Array<Record<string, any>>;
    return rows.map((r) => this.mapRowToStory(r));
  }

  public findByStatus(status: StoryStatus): Story[] {
    const rows = this.db.query('SELECT * FROM stories WHERE status = ? ORDER BY updated_at DESC').all(status) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRowToStory(r));
  }

  public update(id: string, input: UpdateStoryInput): Story | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const title = input.title !== undefined ? input.title : existing.title;
    const description = input.description !== undefined ? input.description : existing.description;
    const coverUrl = input.coverUrl !== undefined ? input.coverUrl : existing.coverUrl;
    const genre = input.genre !== undefined ? input.genre : existing.genre;
    const category = input.category !== undefined ? input.category : existing.category;
    const tagsJson = input.tags !== undefined ? JSON.stringify(input.tags) : JSON.stringify(existing.tags);
    const language = input.language !== undefined ? input.language : existing.language;
    const mature = input.mature !== undefined ? (input.mature ? 1 : 0) : (existing.mature ? 1 : 0);
    const editorPreference = input.editorPreference !== undefined ? input.editorPreference : existing.editorPreference;
    const status = input.status !== undefined ? input.status : existing.status;
    const wattpadId = input.wattpadId !== undefined ? input.wattpadId : existing.wattpadId;

    this.db.run(
      `UPDATE stories SET
        title = ?, description = ?, cover_url = ?, genre = ?, category = ?,
        tags = ?, language = ?, mature = ?, editor_preference = ?, status = ?,
        wattpad_id = ?, updated_at = ?
      WHERE id = ?`,
      [
        title,
        description,
        coverUrl,
        genre,
        category,
        tagsJson,
        language,
        mature,
        editorPreference,
        status,
        wattpadId,
        now,
        id,
      ]
    );

    return this.findById(id);
  }

  public delete(id: string): boolean {
    const res = this.db.run('DELETE FROM stories WHERE id = ?', [id]);
    return res.changes > 0;
  }

  private mapRowToStory(row: Record<string, any>): Story {
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(row.tags || '[]');
    } catch {
      parsedTags = [];
    }

    return {
      id: row.id,
      wattpadId: row.wattpad_id,
      title: row.title,
      description: row.description || '',
      coverUrl: row.cover_url,
      genre: row.genre || 'General',
      category: row.category || 'Novela',
      tags: parsedTags,
      language: row.language || 'es',
      mature: Boolean(row.mature),
      editorPreference: row.editor_preference || 'word',
      status: row.status as StoryStatus,
      localPath: row.local_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
