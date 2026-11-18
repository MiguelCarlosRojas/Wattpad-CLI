import { describe, expect, it, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { runMigrations } from '../src/database/migrations';
import { StoryRepository } from '../src/database/repositories/story-repository';
import { ChapterRepository } from '../src/database/repositories/chapter-repository';

describe('SQLite Database & Repositories', () => {
  let db: Database;
  let storyRepo: StoryRepository;
  let chapterRepo: ChapterRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.run('PRAGMA foreign_keys = ON;');
    runMigrations(db);
    storyRepo = new StoryRepository(db);
    chapterRepo = new ChapterRepository(db);
  });

  it('should generate formatted sequential IDs like NOV-0001, NOV-0002', () => {
    const s1 = storyRepo.create({ title: 'Novela 1' });
    const s2 = storyRepo.create({ title: 'Novela 2' });

    expect(s1.id).toBe('NOV-0001');
    expect(s2.id).toBe('NOV-0002');
  });

  it('should create and retrieve a story with all metadata', () => {
    const created = storyRepo.create({
      title: 'Ecos de Sangre',
      genre: 'Misterio',
      category: 'Novela',
      tags: ['crimen', 'suspense'],
      language: 'es',
      mature: true,
      editorPreference: 'word',
    });

    const fetched = storyRepo.findById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Ecos de Sangre');
    expect(fetched?.genre).toBe('Misterio');
    expect(fetched?.mature).toBe(true);
    expect(fetched?.tags).toEqual(['crimen', 'suspense']);
    expect(fetched?.status).toBe('draft');
  });

  it('should create chapters and increment version numbers', () => {
    const story = storyRepo.create({ title: 'Prueba Capítulos' });
    const ch = chapterRepo.create({
      storyId: story.id,
      title: 'Capítulo Uno',
      content: 'Este es el inicio de la historia con varias palabras.',
    });

    expect(ch.id).toBe('CAP-0001');
    expect(ch.chapterNumber).toBe(1);
    expect(ch.wordCount).toBe(10);

    const versions = chapterRepo.getVersions(ch.id);
    expect(versions.length).toBe(1);
    expect(versions[0].versionNumber).toBe(1);

    // Update chapter with new content
    chapterRepo.update(ch.id, { content: 'Contenido modificado con más palabras para la versión dos.' });

    const updatedVersions = chapterRepo.getVersions(ch.id);
    expect(updatedVersions.length).toBe(2);
    expect(updatedVersions[0].versionNumber).toBe(2);
  });

  it('should cascade delete chapters when story is deleted', () => {
    const story = storyRepo.create({ title: 'Novela Para Borrar' });
    const ch = chapterRepo.create({ storyId: story.id, title: 'Cap 1' });

    expect(chapterRepo.findById(ch.id)).not.toBeNull();

    storyRepo.delete(story.id);

    expect(chapterRepo.findById(ch.id)).toBeNull();
  });
});
