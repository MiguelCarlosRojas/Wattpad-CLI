import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { Application } from '../src/cli/app/application';
import { WattpadCloudApiServer } from '../src/api/server';

describe('CLI Cloud End-to-End Workflow', () => {
  let server: WattpadCloudApiServer;
  let serverUrl: string;

  beforeAll(async () => {
    process.env.PORT = '0';
    server = new WattpadCloudApiServer();
    const port = await server.start();
    serverUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should initialize and execute cloud commands without local database', async () => {
    const app = new Application(serverUrl);
    await app.init();

    // 1. Initial stories
    const resStories = await app.executeCommand('/stories');
    expect(resStories.success).toBe(true);

    // 2. Create story
    const resNewStory = await app.executeCommand('/story new "La Dama de Cristal" --genre=Fantasía');
    expect(resNewStory.success).toBe(true);
    expect(resNewStory.blocks![0].title).toContain('NOVELA CREADA EXITOSAMENTE');

    // 3. Create chapter
    const resNewChap = await app.executeCommand('/chapter new "Capítulo 1: El Despertar"');
    expect(resNewChap.success).toBe(true);
    expect(resNewChap.blocks![0].title).toContain('CAPÍTULO CREADO CON ÉXITO');

    // 4. Cloud Sync
    const resSync = await app.executeCommand('/sync');
    expect(resSync.success).toBe(true);

    // 5. Connect Google (HTTPS OAuth - No Localhost)
    const resGoogle = await app.executeCommand('/connect google');
    expect(resGoogle.success).toBe(true);
    expect(resGoogle.blocks![0].title).toContain('GOOGLE DOCS');

    // 6. Publication with confirmation
    const resPub = await app.executeCommand('/publish story NOV-0001 --confirm');
    expect(resPub.success).toBe(true);
    expect(resPub.blocks![0].title).toContain('NOVELA PUBLICADA EN WATTPAD');

    await app.shutdown();
  });
});
