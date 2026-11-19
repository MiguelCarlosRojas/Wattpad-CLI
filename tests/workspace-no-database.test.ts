import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { StoryManager } from '../src/features/stories/managers/story-manager';
import { ChapterManager } from '../src/features/chapters/managers/chapter-manager';
import { ConnectionManager } from '../src/features/connections/managers/connection-manager';
import { DocumentManager } from '../src/features/documents/managers/document-manager';
import { SyncManager } from '../src/platform/sync/sync-manager';
import { SettingsManager } from '../src/core/config/settings-manager';
import { Application } from '../src/platform/terminal/application';

describe('Sovereign Architecture Without Database Engine', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `wattpad_nodata_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('debe gestionar historias en memoria sin depender de ningún motor SQL', () => {
    const storyManager = new StoryManager();

    const story = storyManager.create({
      title: 'Crónicas de los Dragones',
      description: 'Una epopeya de fantasía',
      genre: 'Fantasía',
      language: 'es',
    });

    expect(story.id).toBe('NOV-0001');
    expect(story.title).toBe('Crónicas de los Dragones');
    expect(story.status).toBe('draft');

    // Case-insensitive lookup (replaces COLLATE NOCASE)
    const foundLower = storyManager.findById('nov-0001');
    expect(foundLower).not.toBeNull();
    expect(foundLower?.title).toBe('Crónicas de los Dragones');

    const foundUpper = storyManager.findById('NOV-0001');
    expect(foundUpper).not.toBeNull();
    expect(foundUpper?.id).toBe('NOV-0001');

    // Update story
    const updated = storyManager.update('NOV-0001', { description: 'Epopeya actualizada' });
    expect(updated?.description).toBe('Epopeya actualizada');

    // Verify findAll
    expect(storyManager.findAll().length).toBe(1);

    // Delete
    const deleted = storyManager.delete('nov-0001');
    expect(deleted).toBe(true);
    expect(storyManager.findAll().length).toBe(0);
  });

  it('debe gestionar capítulos y versiones en memoria calculando hashes y palabras', () => {
    const chapterManager = new ChapterManager();

    const chapter = chapterManager.create({
      storyId: 'NOV-0001',
      title: 'Capítulo 1: El Despertar',
      content: 'Había una vez en un reino lejano...',
      orderIndex: 1,
    });

    expect(chapter.id).toBe('CAP-0001');
    expect(chapter.wordCount).toBeGreaterThan(0);
    expect(chapter.contentHash).toBeDefined();

    // Add version
    const version = chapterManager.addVersion(
      'CAP-0001',
      'Capítulo 1: El Despertar',
      'Había una vez en un reino muy lejano y mágico...',
      'cli'
    );
    expect(version).not.toBeNull();
    expect(version?.versionNumber).toBe(2);

    const versions = chapterManager.getVersions('cap-0001');
    expect(versions.length).toBe(2);
    expect(versions[1].source).toBe('cli');
  });

  it('debe gestionar la conexión y sesión sin tablas SQL', () => {
    const connManager = new ConnectionManager();

    expect(connManager.isConnected('wattpad')).toBe(false);

    connManager.setConnected('wattpad', 'Wattpad', true, 'escritor_real');
    expect(connManager.isConnected('wattpad')).toBe(true);

    const record = connManager.getConnection('wattpad');
    expect(record?.accountName).toBe('escritor_real');

    connManager.setConnected('wattpad', 'Wattpad', false);
    expect(connManager.isConnected('wattpad')).toBe(false);
  });

  it('debe persistir configuración e historial en archivos JSON locales sin crear archivos .db', () => {
    const settings = new SettingsManager(tempDir);

    settings.set('theme', 'dark');
    settings.set('locale', 'es');
    settings.addCommandHistory('/story new "Test"');
    settings.addCommandHistory('/chapters');

    expect(settings.get('theme')).toBe('dark');
    expect(settings.get('locale')).toBe('es');
    expect(settings.getCommandHistory()).toEqual(['/story new "Test"', '/chapters']);

    // Verificar que se crearon los archivos JSON esperados
    const settingsFile = path.join(tempDir, 'settings.json');
    const historyFile = path.join(tempDir, 'history.json');
    expect(fs.existsSync(settingsFile)).toBe(true);
    expect(fs.existsSync(historyFile)).toBe(true);

    // Verificar contenido JSON legible
    const jsonContent = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    expect(jsonContent.theme).toBe('dark');

    // Verificar que NO existe ningún archivo de base de datos
    const files = fs.readdirSync(tempDir);
    expect(files.some((f) => f.endsWith('.db') || f.endsWith('.sqlite'))).toBe(false);
  });

  it('debe ejecutar la aplicación CLI completa y comandos sin crear ningún archivo .db', async () => {
    const app = new Application(tempDir);
    await app.init();

    // Ejecutar comandos normales
    const resHelp = await app.executeCommand('/help');
    expect(resHelp.success).toBe(true);

    const resStory = await app.executeCommand('/story new "El Vuelo del Fénix"');
    expect(resStory.success).toBe(true);
    expect(app.currentStoryId).toBe('NOV-0001');

    const resChapter = await app.executeCommand('/chapter new "Prólogo"');
    expect(resChapter.success).toBe(true);
    expect(app.currentChapterId).toBe('CAP-0001');

    const resVer = await app.executeCommand('/version');
    expect(resVer.success).toBe(true);
    const verCard = resVer.blocks![0];
    const persistField = verCard.fields?.find((f) => f.label.includes('Persistencia'));
    expect(persistField?.value).toContain('sin Base de Datos');

    // Verificar que en ningún directorio se generó una base de datos wattpad.db
    const tempFiles = fs.readdirSync(tempDir);
    expect(tempFiles.some((f) => f.includes('.db') || f.includes('sqlite'))).toBe(false);
  });
});
