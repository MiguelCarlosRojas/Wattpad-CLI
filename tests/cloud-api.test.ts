import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { WattpadCloudApiServer } from '../src/api/server';

describe('Wattpad Cloud REST API & Discovery', () => {
  let server: WattpadCloudApiServer;
  let port: number;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.PORT = '0'; // dynamic port
    server = new WattpadCloudApiServer();
    port = await server.start();
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('GET /api/health should return ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe('ok');
  });

  it('GET /cli/config should return public discovery configuration', async () => {
    const res = await fetch(`${baseUrl}/cli/config`);
    expect(res.status).toBe(200);
    const config = (await res.json()) as any;
    expect(config.version).toBe('1.0.0');
    expect(config.serverStatus).toBe('healthy');
    expect(config.features.googleDocsOAuth).toBe(true);
    expect(config.routes.stories).toBeDefined();
    expect(config.installerEndpoints.powershell).toContain('/cli/install.ps1');
  });

  it('GET /cli/install.ps1 should serve PowerShell installer script', async () => {
    const res = await fetch(`${baseUrl}/cli/install.ps1`);
    expect(res.status).toBe(200);
    const script = await res.text();
    expect(script).toContain('Wattpad CLI');
    expect(script).toContain('wattpad.exe');
  });

  it('GET /cli/install.sh should serve Linux/macOS installer script', async () => {
    const res = await fetch(`${baseUrl}/cli/install.sh`);
    expect(res.status).toBe(200);
    const script = await res.text();
    expect(script).toContain('#!/usr/bin/env bash');
    expect(script).toContain('wattpad');
  });

  it('POST /api/auth/start should exchange token and return profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'test_cloud_token' }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.user.username).toBe('wattpad_author');
  });

  it('CRUD /api/stories should manage stories on the cloud', async () => {
    // List initial stories
    const resList = await fetch(`${baseUrl}/api/stories`);
    const jsonList = (await resList.json()) as any;
    expect(jsonList.success).toBe(true);
    expect(jsonList.data.length).toBeGreaterThan(0);

    // Create story
    const resCreate = await fetch(`${baseUrl}/api/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nueva Historia Cloud', genre: 'Fantasía' }),
    });
    const jsonCreate = (await resCreate.json()) as any;
    expect(jsonCreate.success).toBe(true);
    expect(jsonCreate.data.title).toBe('Nueva Historia Cloud');
  });

  it('POST /api/publish should confirm and register publication', async () => {
    const res = await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'story', entityId: 'NOV-0001' }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('published');
    expect(json.data.wattpadId).toContain('wp_cloud_');
  });

  it('POST /api/integrations/google/auth-start should return OAuth URL with HTTPS redirect (no localhost)', async () => {
    const res = await fetch(`${baseUrl}/api/integrations/google/auth-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.authUrl).toContain('accounts.google.com');
    // Verify redirect_uri is HTTPS on Render, NOT localhost!
    expect(json.data.authUrl).toContain('wattpad-cli.onrender.com');
    expect(json.data.authUrl).not.toContain('localhost');
  });
});
