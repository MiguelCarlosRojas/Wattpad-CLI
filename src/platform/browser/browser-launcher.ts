import { spawn } from 'child_process';

/**
 * Abre una URL en el navegador predeterminado del sistema operativo
 * de forma compatible con Windows, macOS y Linux.
 */
export async function openUrlInBrowser(url: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    return true;
  }

  return new Promise((resolve) => {
    const platform = process.platform;
    let command = '';
    let args: string[] = [];

    if (platform === 'win32') {
      command = 'cmd.exe';
      args = ['/c', 'start', '""', url];
    } else if (platform === 'darwin') {
      command = 'open';
      args = [url];
    } else {
      command = 'xdg-open';
      args = [url];
    }

    try {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      child.on('error', () => resolve(false));
      resolve(true);
    } catch {
      resolve(false);
    }
  });
}
