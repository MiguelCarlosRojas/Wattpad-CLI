export type StoryStatus = 'draft' | 'pending' | 'synced' | 'published' | 'error';

export type EditorPreference = 'word' | 'notepad' | 'google';

export interface Story {
  id: string; // e.g. "NOV-0001"
  wattpadId: string | null;
  title: string;
  description: string;
  coverUrl: string | null;
  genre: string;
  category: string;
  tags: string[];
  language: string;
  mature: boolean;
  editorPreference: EditorPreference;
  status: StoryStatus;
  localPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryInput {
  title: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
  category?: string;
  tags?: string[];
  language?: string;
  mature?: boolean;
  editorPreference?: EditorPreference;
  status?: StoryStatus;
}

export interface UpdateStoryInput {
  title?: string;
  description?: string;
  coverUrl?: string | null;
  genre?: string;
  category?: string;
  tags?: string[];
  language?: string;
  mature?: boolean;
  editorPreference?: EditorPreference;
  status?: StoryStatus;
  wattpadId?: string | null;
}
