process.env.NODE_ENV = 'test';
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Application } from '../src/platform/terminal/application';

describe('Application Command Execution', () => {
  let app: Application;
  let testConfigDir: string;

  beforeEach(async () => {
    testConfigDir = path.join(os.tmpdir(), `wattpad_app_test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    app = new Application(testConfigDir);
    await app.init();
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testConfigDir)) fs.rmSync(testConfigDir, { recursive: true, force: true });
    } catch {}
  });

  it('should execute /help and return categorized blocks', async () => {
    const res = await app.executeCommand('/help');
    expect(res.success).toBe(true);
    expect(res.blocks).toBeDefined();
    expect(res.blocks!.length).toBeGreaterThan(3);
  });

  it('should execute /version with environment specifications', async () => {
    const res = await app.executeCommand('/version');
    expect(res.success).toBe(true);
    const card = res.blocks![0];
    expect(card.title).toBe('WATTPAD CLI');
    expect(card.statusBadge).toMatch(/v1\.[0-3]\.0/);
  });

  it('should create and open a story with /story new and /story open', async () => {
    const resNew = await app.executeCommand('/story new "La Corona de Espinas" --genre=Fantasía');
    expect(resNew.success).toBe(true);
    expect(app.currentStoryId).toBe('NOV-0001');

    const resList = await app.executeCommand('/stories');
    expect(resList.success).toBe(true);
    expect(resList.blocks!.length).toBeGreaterThan(1);

    const resOpen = await app.executeCommand('/story open NOV-0001');
    expect(resOpen.success).toBe(true);
    expect(resOpen.blocks![0].title).toContain('NOV-0001');
  });

  it('should create and list chapters with /chapter new and /chapters', async () => {
    await app.executeCommand('/story new "El Legado del Tiempo"');
    const resChap = await app.executeCommand('/chapter new "Capítulo 1: La Revelación"');

    expect(resChap.success).toBe(true);
    expect(app.currentChapterId).toBe('CAP-0001');

    const resList = await app.executeCommand('/chapters');
    expect(resList.success).toBe(true);
    expect(resList.blocks!.some((b) => b.title?.includes('CAP-0001'))).toBe(true);
  });

  it('should require explicit confirmation before publishing', async () => {
    await app.executeCommand('/story new "Historia Para Publicar"');
    await app.executeCommand('/login test_token_123');

    // Without --confirm, should show warning confirmation prompt
    const resUnconfirmed = await app.executeCommand('/publish story NOV-0001');
    expect(resUnconfirmed.blocks![0].type).toBe('warning');
    expect(resUnconfirmed.blocks![0].title).toContain('CONFIRMACIÓN DE PUBLICACIÓN');

    // With --confirm, should proceed
    const resConfirmed = await app.executeCommand('/publish story NOV-0001 --confirm');
    expect(resConfirmed.success).toBe(true);
    expect(resConfirmed.blocks![0].statusBadge).toBe('[PUBLICADO EN WATTPAD]');
  });

  it('should handle /exit properly', async () => {
    const res = await app.executeCommand('/exit');
    expect(res.success).toBe(true);
    expect(res.exitApp).toBe(true);
  });
});
