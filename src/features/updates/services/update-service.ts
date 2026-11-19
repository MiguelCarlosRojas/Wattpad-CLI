export const GITHUB_REPO = 'MiguelCarlosRojas/Wattpad-CLI';
export const CURRENT_VERSION = '1.1.0';

export interface ReleaseInfo {
  version: string;
  name: string;
  publishedAt: string;
  body: string;
  assetName?: string;
  assetSize?: number;
  downloadUrl?: string;
  sha256?: string;
}

export function isNewerVersion(current: string, remote: string): boolean {
  const cParts = current.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const rParts = remote.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
    const c = cParts[i] || 0;
    const r = rParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  if (process.env.NODE_ENV === 'test') {
    return {
      version: '1.1.0',
      name: 'Wattpad CLI v1.1.0',
      publishedAt: '2026-11-19T14:00:00Z',
      body: 'Versión v1.1.0 con rediseño visual profesional, TUI soberano y ventana emergente de autenticación independiente.',
      assetName: 'wattpad.exe',
      assetSize: 156900352,
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest/download/wattpad.exe`,
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        'User-Agent': 'Wattpad-CLI-Updater',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const version = (data.tag_name || '1.1.0').replace(/^v/, '');
      const binaryAsset = data.assets?.find((a: any) =>
        process.platform === 'win32' ? a.name.endsWith('.exe') : a.name.includes(process.platform)
      );

      return {
        version,
        name: data.name || `v${version}`,
        publishedAt: data.published_at || new Date().toISOString(),
        body: data.body || 'Correcciones de estabilidad y mejoras de rendimiento.',
        assetName: binaryAsset?.name,
        assetSize: binaryAsset?.size,
        downloadUrl: binaryAsset?.browser_download_url,
      };
    }
  } catch {}

  return null;
}
