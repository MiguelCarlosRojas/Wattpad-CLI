import { getEnv } from '../../core/config/env';
import { CliController } from './cli.controller';

/**
 * WattpadDistributionServer
 * Servidor ligero dedicado exclusivamente a la distribución e instalación de Wattpad CLI:
 * - Descarga de instalador PowerShell (install.ps1)
 * - Descarga de instalador Bash Linux/macOS (install.sh)
 * - Configuración de descubrimiento y versiones (/cli/config)
 * - Descarga de binarios oficiales (/cli/download/:target)
 * - Comprobación de salud (/api/health)
 *
 * Sin dependencias de bases de datos externas ni duplicación de la API de Wattpad.
 */
export class WattpadCloudApiServer {
  private server: any = null;

  public async start(): Promise<number> {
    const env = getEnv();
    const port = env.PORT || 3000;

    this.server = Bun.serve({
      port,
      fetch: async (req) => {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        // CORS headers
        const headers = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        };

        if (method === 'OPTIONS') {
          return new Response(null, { headers });
        }

        try {
          // --- CLI HEALTH CHECK ---
          if (path === '/api/health' && (method === 'GET' || method === 'HEAD')) {
            return new Response(
              method === 'HEAD' ? null : JSON.stringify({ status: 'ok', service: 'Wattpad CLI Distribution', time: new Date().toISOString() }),
              { headers }
            );
          }

          // --- CLI PUBLIC CONFIG & DISCOVERY ---
          if (path === '/cli/config' && (method === 'GET' || method === 'HEAD')) {
            const config = CliController.getPublicConfig();
            return new Response(method === 'HEAD' ? null : JSON.stringify(config), {
              headers: {
                ...headers,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            });
          }

          // --- POWERSHELL INSTALLER SCRIPT ---
          if (path === '/cli/install.ps1' && (method === 'GET' || method === 'HEAD')) {
            const script = CliController.getInstallPs1();
            return new Response(method === 'HEAD' ? null : script, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            });
          }

          // --- BASH INSTALLER SCRIPT (Linux / macOS) ---
          if (path === '/cli/install.sh' && (method === 'GET' || method === 'HEAD')) {
            const script = CliController.getInstallSh();
            return new Response(method === 'HEAD' ? null : script, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            });
          }

          // --- BINARY DOWNLOAD ENDPOINT ---
          if (path.startsWith('/cli/download/') && (method === 'GET' || method === 'HEAD')) {
            const target = path.replace('/cli/download/', '');
            const releaseUrl = CliController.getDownloadUrl(target);
            return new Response(null, {
              status: 302,
              headers: {
                'Location': releaseUrl,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            });
          }

          return new Response(
            JSON.stringify({
              error: 'Not Found',
              message: 'Wattpad CLI Distribution Server sólo aloja instaladores y binarios oficiales.',
            }),
            { status: 404, headers }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: 'Internal Error', message: err.message }), { status: 500, headers });
        }
      },
    });

    return this.server.port;
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}

// Direct invocation when running standalone
if (import.meta.main) {
  const server = new WattpadCloudApiServer();
  const port = await server.start();
  console.log(`[Wattpad Distribution Server] Servidor de descargas activo en puerto ${port}`);
}
