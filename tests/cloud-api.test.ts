import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { WattpadCloudApiServer } from '../src/platform/distribution/server';

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

  it('GET /cli/config should return public discovery configuration with cache-control', async () => {
    const res = await fetch(`${baseUrl}/cli/config`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-cache');
    const config = (await res.json()) as any;
    expect(config.version).toBe('1.1.0');
    expect(config.serverStatus).toBe('healthy');
    expect(config.installerEndpoints.powershell).toContain('/cli/install.ps1');
    expect(config.installerEndpoints.linuxMac).toContain('/cli/install.sh');
    expect(config.binaries['win32-x64']).toBeDefined();
    expect(config.binaries['win32-x64'].sha256).toBe(
      '46667382cfb28aeaeac4f8eb2c48e1616063cc101adff6e71dfc9cd51e0f5bd3'
    );
  });

  it('GET /cli/download/win32-x64 should serve local binary if present with cache-control', async () => {
    const res = await fetch(`${baseUrl}/cli/download/win32-x64`, { redirect: 'manual' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/octet-stream');
    expect(res.headers.get('cache-control')).toContain('no-cache');
  });

  it('GET /cli/download/linux-x64 should redirect to versioned release URL with cache-control when file is not local', async () => {
    const res = await fetch(`${baseUrl}/cli/download/linux-x64`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('cache-control')).toContain('no-cache');
    const location = res.headers.get('location');
    expect(location).toContain('/releases/download/v1.1.0/wattpad-linux-x64');
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
