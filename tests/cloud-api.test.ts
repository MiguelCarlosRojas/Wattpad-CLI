import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { WattpadCloudApiServer } from '../src/api/server';

describe('Wattpad Distribution Server & Installer Hosting', () => {
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

  it('GET /api/health should return ok without database dependency', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe('ok');
    expect(json.service).toContain('Distribution');
  });

  it('GET /cli/config should return public discovery configuration', async () => {
    const res = await fetch(`${baseUrl}/cli/config`);
    expect(res.status).toBe(200);
    const config = (await res.json()) as any;
    expect(config.version).toMatch(/1\.[01]\.0/);
    expect(config.serverStatus).toBe('healthy');
    expect(config.installerEndpoints.powershell).toContain('/cli/install.ps1');
    expect(config.installerEndpoints.linuxMac).toContain('/cli/install.sh');
    expect(config.binaries['win32-x64']).toBeDefined();
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

  it('should not expose duplicate fake Wattpad backend endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/auth/start`, { method: 'POST' });
    expect(res.status).toBe(404);
  });
});
