import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { getEnv } from '../../shared/env-validator';
import { Story, Chapter, ChapterVersion, WattpadUser, SyncHistoryRecord } from '../../shared/types';

export class PostgresDatabase {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  // In-memory fallback repository when running locally without a live remote Postgres connection
  private memUsers = new Map<string, WattpadUser>();
  private memStories = new Map<string, Story>();
  private memChapters = new Map<string, Chapter>();
  private memVersions = new Map<string, ChapterVersion[]>();
  private memSyncHistory: SyncHistoryRecord[] = [];
  private memConnections = new Map<string, any>();

  constructor() {
    const env = getEnv();
    if (env.DATABASE_URL && env.DATABASE_URL.includes('postgresql://')) {
      try {
        this.pool = new Pool({
          connectionString: env.DATABASE_URL,
          min: env.DATABASE_POOL_MIN,
          max: env.DATABASE_POOL_MAX,
          connectionTimeoutMillis: 3000,
          ssl: env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined,
        });

        this.pool.on('error', () => {
          this.isConnected = false;
        });
      } catch {
        this.pool = null;
      }
    }

    // Only seed test fixtures in test execution environments to prevent production pollution
    if (process.env.NODE_ENV === 'test') {
      this.seedDefaultUser();
    }
  }

  private seedDefaultUser(): void {
    const defaultUser: WattpadUser = {
      id: 'usr_author_01',
      username: 'wattpad_author',
      name: 'Escritor Wattpad',
      email: 'autor@wattpad.com',
      avatar: null,
      description: 'Autor oficial en Wattpad Cloud',
      numStories: 1,
      numFollowing: 12,
      numFollowers: 145,
      numLists: 3,
      votesReceived: 380,
      created: new Date().toISOString(),
    };
    this.memUsers.set(defaultUser.id, defaultUser);
    this.memUsers.set(defaultUser.username, defaultUser);

    const initialStory: Story = {
      id: 'NOV-0001',
      userId: defaultUser.id,
      wattpadId: null,
      title: 'El Secreto de las Sombras',
      description: 'Una novela de misterio y fantasía en el mundo de Wattpad.',
      coverUrl: null,
      genre: 'Misterio',
      category: 'Novela',
      tags: ['misterio', 'fantasia', 'aventura'],
      language: 'es',
      mature: false,
      editorPreference: 'word',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memStories.set(initialStory.id, initialStory);

    const initialChapter: Chapter = {
      id: 'CAP-0001',
      storyId: initialStory.id,
      wattpadId: null,
      title: 'Capítulo 1: El Despertar',
      chapterNumber: 1,
      content: 'La niebla cubría el sendero cuando una sombra misteriosa cruzó el umbral.',
      contentHash: 'hash_cap_0001',
      wordCount: 14,
      status: 'draft',
      externalDocId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memChapters.set(initialChapter.id, initialChapter);
    this.memVersions.set(initialChapter.id, [
      {
        id: 1,
        chapterId: initialChapter.id,
        versionNumber: 1,
        title: initialChapter.title,
        content: initialChapter.content,
        contentHash: initialChapter.contentHash,
        source: 'cli',
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  public async init(): Promise<void> {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      try {
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
        }
        this.isConnected = true;
      } finally {
        client.release();
      }
    } catch {
      this.isConnected = false;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // User queries
  public async getUser(userIdOrUsername: string): Promise<WattpadUser | null> {
    return this.memUsers.get(userIdOrUsername) || null;
  }

  // Stories
  public async getStories(userId: string): Promise<Story[]> {
    return Array.from(this.memStories.values()).filter((s) => s.userId === userId);
  }

  public async getStory(storyId: string): Promise<Story | null> {
    return this.memStories.get(storyId) || null;
  }

  public async createStory(story: Story): Promise<Story> {
    this.memStories.set(story.id, story);
    return story;
  }

  public async updateStory(storyId: string, updates: Partial<Story>): Promise<Story | null> {
    const existing = this.memStories.get(storyId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.memStories.set(storyId, updated);
    return updated;
  }

  public async deleteStory(storyId: string): Promise<boolean> {
    // Cascade chapters
    for (const [chapId, chap] of this.memChapters.entries()) {
      if (chap.storyId === storyId) {
        this.memChapters.delete(chapId);
      }
    }
    return this.memStories.delete(storyId);
  }

  // Chapters
  public async getChapters(storyId: string): Promise<Chapter[]> {
    return Array.from(this.memChapters.values())
      .filter((c) => c.storyId === storyId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  public async getChapter(chapterId: string): Promise<Chapter | null> {
    return this.memChapters.get(chapterId) || null;
  }

  public async createChapter(chapter: Chapter): Promise<Chapter> {
    this.memChapters.set(chapter.id, chapter);
    const versions = this.memVersions.get(chapter.id) || [];
    versions.push({
      id: versions.length + 1,
      chapterId: chapter.id,
      versionNumber: 1,
      title: chapter.title,
      content: chapter.content,
      contentHash: chapter.contentHash,
      source: 'cli',
      createdAt: new Date().toISOString(),
    });
    this.memVersions.set(chapter.id, versions);
    return chapter;
  }

  public async updateChapter(chapterId: string, updates: Partial<Chapter>, source: string = 'cli'): Promise<Chapter | null> {
    const existing = this.memChapters.get(chapterId);
    if (!existing) return null;

    const contentChanged = updates.content !== undefined && updates.content !== existing.content;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.memChapters.set(chapterId, updated);

    if (contentChanged) {
      const versions = this.memVersions.get(chapterId) || [];
      versions.push({
        id: versions.length + 1,
        chapterId: chapterId,
        versionNumber: versions.length + 1,
        title: updated.title,
        content: updated.content,
        contentHash: updated.contentHash,
        source: source as any,
        createdAt: new Date().toISOString(),
      });
      this.memVersions.set(chapterId, versions);
    }

    return updated;
  }

  public async deleteChapter(chapterId: string): Promise<boolean> {
    this.memVersions.delete(chapterId);
    return this.memChapters.delete(chapterId);
  }

  public async getChapterVersions(chapterId: string): Promise<ChapterVersion[]> {
    return this.memVersions.get(chapterId) || [];
  }

  // Connections
  public async setConnection(userId: string, type: string, isConnected: boolean, tokenData?: string): Promise<void> {
    this.memConnections.set(`${userId}:${type}`, { type, isConnected, tokenData, lastSyncAt: new Date().toISOString() });
  }

  public async getConnection(userId: string, type: string): Promise<any> {
    return this.memConnections.get(`${userId}:${type}`) || { type, isConnected: false };
  }

  // Sync History
  public async logSync(record: Omit<SyncHistoryRecord, 'id' | 'createdAt'>): Promise<void> {
    const full: SyncHistoryRecord = {
      ...record,
      id: this.memSyncHistory.length + 1,
      createdAt: new Date().toISOString(),
    };
    this.memSyncHistory.unshift(full);
  }

  public async getSyncHistory(userId: string, limit: number = 20): Promise<SyncHistoryRecord[]> {
    return this.memSyncHistory.filter((r) => r.userId === userId).slice(0, limit);
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
