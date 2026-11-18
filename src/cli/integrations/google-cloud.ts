import { ApiClient } from '../api/api-client';

export class GoogleCloudIntegration {
  constructor(private apiClient: ApiClient) {}

  public async startAuth(): Promise<{ authUrl: string; sessionId: string }> {
    return await this.apiClient.startGoogleOAuth();
  }

  public async checkConnected(): Promise<boolean> {
    return await this.apiClient.checkGoogleStatus();
  }
}
