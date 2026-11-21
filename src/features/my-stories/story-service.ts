import fs from 'fs';
import path from 'path';
import { StoryMetadata } from '../../shared/types/story.types';
import { LocalStore } from '../../infrastructure/persistence/local-store';
import { FileManager } from '../../infrastructure/filesystem/file-manager';

export class StoryService {
  public static getMyStories(): StoryMetadata[] {
    return LocalStore.loadMyStories();
  }

  public static getStory(storyIdOrTitle: string): StoryMetadata | null {
    const list = this.getMyStories();
    return list.find((s) => s.id === storyIdOrTitle || s.title === storyIdOrTitle) || null;
  }

  public static updateStory(story: StoryMetadata): void {
    LocalStore.saveStory(story);
  }

  public static deleteStory(storyIdOrTitle: string): boolean {
    return LocalStore.deleteStory(storyIdOrTitle);
  }

  public static exportStory(story: StoryMetadata, exportDir?: string): string {
    const targetDir = exportDir || path.join(FileManager.getRoot(), 'exports');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeTitle = story.title.replace(/[^\w\s-]/g, '').trim();
    const exportFile = path.join(targetDir, `${safeTitle}.md`);

    const chapters = LocalStore.loadChapters(story.title || story.id);

    let md = `# ${story.title}\n\n`;
    md += `**Autor:** ${story.authorDisplayName} (@${story.authorUsername})\n`;
    md += `**Género:** ${story.genre}\n`;
    md += `**Estado:** ${story.status}\n\n`;
    md += `## Sinopsis\n\n${story.description}\n\n---\n\n`;

    chapters.forEach((ch) => {
      md += `## Capítulo ${ch.number}: ${ch.title}\n\n`;
      const chContent = FileManager.readText(ch.filePath);
      md += `${chContent}\n\n---\n\n`;
    });

    FileManager.writeText(exportFile, md);
    return exportFile;
  }
}
