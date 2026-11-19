import {
  Story,
  StoryStatus,
  EditorPreference,
  CreateStoryInput,
  UpdateStoryInput,
} from '../types/story.types';

export class StoryManager {
  private stories: Map<string, Story> = new Map();
  private nextIdNum: number = 1;

  public getNextId(): string {
    let candidate = `NOV-${String(this.nextIdNum).padStart(4, '0')}`;
    while (this.findById(candidate)) {
      this.nextIdNum++;
      candidate = `NOV-${String(this.nextIdNum).padStart(4, '0')}`;
    }
    return candidate;
  }

  public create(input: CreateStoryInput): Story {
    const id = this.getNextId();
    this.nextIdNum++;
    const now = new Date().toISOString();

    const story: Story = {
      id,
      wattpadId: null,
      title: input.title,
      description: input.description || '',
      coverUrl: input.coverUrl || null,
      genre: input.genre || 'General',
      category: input.category || 'Novela',
      tags: input.tags || [],
      language: input.language || 'es',
      mature: Boolean(input.mature),
      editorPreference: input.editorPreference || 'word',
      status: input.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };

    this.stories.set(id.toUpperCase(), story);
    return story;
  }

  public findById(id: string): Story | null {
    if (!id) return null;
    return this.stories.get(id.toUpperCase()) || null;
  }

  public findByWattpadId(wattpadId: string): Story | null {
    if (!wattpadId) return null;
    for (const story of this.stories.values()) {
      if (story.wattpadId === wattpadId) {
        return story;
      }
    }
    return null;
  }

  public findAll(): Story[] {
    return Array.from(this.stories.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public findByStatus(status: StoryStatus): Story[] {
    return this.findAll().filter((s) => s.status === status);
  }

  public update(id: string, input: UpdateStoryInput): Story | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const updated: Story = {
      ...existing,
      title: input.title !== undefined ? input.title : existing.title,
      description: input.description !== undefined ? input.description : existing.description,
      coverUrl: input.coverUrl !== undefined ? input.coverUrl : existing.coverUrl,
      genre: input.genre !== undefined ? input.genre : existing.genre,
      category: input.category !== undefined ? input.category : existing.category,
      tags: input.tags !== undefined ? input.tags : existing.tags,
      language: input.language !== undefined ? input.language : existing.language,
      mature: input.mature !== undefined ? input.mature : existing.mature,
      editorPreference: input.editorPreference !== undefined ? input.editorPreference : existing.editorPreference,
      status: input.status !== undefined ? input.status : existing.status,
      wattpadId: input.wattpadId !== undefined ? input.wattpadId : existing.wattpadId,
      updatedAt: new Date().toISOString(),
    };

    this.stories.set(existing.id.toUpperCase(), updated);
    return updated;
  }

  public delete(id: string): boolean {
    if (!id) return false;
    return this.stories.delete(id.toUpperCase());
  }

  public clear(): void {
    this.stories.clear();
    this.nextIdNum = 1;
  }
}
