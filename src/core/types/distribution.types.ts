export interface PublicCliConfig {
  version: string;
  minCliVersion: string;
  apiBaseUrl: string;
  publicAppUrl: string;
  serverStatus: 'healthy' | 'degraded' | 'maintenance';
  features: {
    googleDocsOAuth: boolean;
    wordImport: boolean;
    notepadImport: boolean;
    browserAuth: boolean;
  };
  installerEndpoints: {
    powershell: string;
    linuxMac: string;
  };
  binaries?: Record<
    string,
    {
      filename: string;
      sha256: string;
      size: number;
      downloadUrl: string;
    }
  >;
  routes: Record<string, string>;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
