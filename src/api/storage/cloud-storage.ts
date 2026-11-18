import { getEnv } from '../../shared/env-validator';

export class CloudStorageService {
  private memFiles = new Map<string, { buffer: Buffer; mimeType: string; uploadedAt: string }>();

  public async uploadDocument(
    key: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ cloudUrl: string; key: string; size: number }> {
    const env = getEnv();
    this.memFiles.set(key, { buffer, mimeType, uploadedAt: new Date().toISOString() });
    const cloudUrl = `${env.STORAGE_PUBLIC_URL}/${key}`;
    return { cloudUrl, key, size: buffer.length };
  }

  public async downloadDocument(key: string): Promise<Buffer | null> {
    const file = this.memFiles.get(key);
    return file ? file.buffer : null;
  }

  public async getSignedDownloadUrl(key: string): Promise<string> {
    const env = getEnv();
    return `${env.STORAGE_PUBLIC_URL}/${key}?signature=signed_${Date.now()}`;
  }

  public async deleteDocument(key: string): Promise<boolean> {
    return this.memFiles.delete(key);
  }
}
