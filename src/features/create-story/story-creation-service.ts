import { StoryMetadata } from '../../shared/types/story.types';
import { LocalStore } from '../../infrastructure/persistence/local-store';
import { SessionManager } from '../../auth/session/session-manager';

export interface CreateStoryPayload {
  title: string;
  description: string;
  language: string;
  genre: string;
  tags: string[];
  coverPath?: string;
  rating: 'everyone' | 'mature';
  copyright: string;
}

export class StoryCreationService {
  public static async createStory(payload: CreateStoryPayload): Promise<StoryMetadata> {
    const user = SessionManager.getSession();
    const storyId = `NOV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newStory: StoryMetadata = {
      id: storyId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      language: payload.language || 'es',
      genre: payload.genre || 'Fantasía',
      tags: payload.tags,
      coverPath: payload.coverPath,
      rating: payload.rating,
      copyright: payload.copyright || 'Todos los derechos reservados',
      status: 'local',
      authorUsername: user?.username || 'autor_local',
      authorDisplayName: user?.displayName || 'Autor',
      totalChapters: 0,
      totalWords: 0,
      reads: 0,
      votes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      localOnly: true,
    };

    LocalStore.saveStory(newStory);
    return newStory;
  }
}
