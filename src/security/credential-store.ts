import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { defaultConfig, ensureDirectories } from '../config/config';
import { env } from '../config/env';
import { encryptAES, decryptAES } from './crypto-utils';

export class CredentialStore {
  private vaultPath: string;
  private keyPath: string;
  private key: Buffer;

  constructor(vaultPath?: string, customKey?: Buffer) {
    ensureDirectories();
    this.vaultPath = vaultPath || path.join(defaultConfig.appDir, 'vault.enc');
    this.keyPath = path.join(path.dirname(this.vaultPath), 'vault.key');
    this.key = customKey || this.resolveEncryptionKey();
  }

  /**
   * Secure cryptographic key resolution:
   * 1. Uses explicit environment secret (CREDENTIAL_ENCRYPTION_KEY / TOKEN_ENCRYPTION_KEY) if configured.
   * 2. Otherwise generates/reads a cryptographically secure 256-bit random key saved with 0600 permissions.
   * NEVER uses machine names, hostnames, usernames, or deterministic OS info.
   */
  private resolveEncryptionKey(): Buffer {
    const configuredSecret = env.CREDENTIAL_ENCRYPTION_KEY || env.TOKEN_ENCRYPTION_KEY;
    if (configuredSecret && configuredSecret.length >= 32) {
      return crypto.createHash('sha256').update(configuredSecret, 'utf8').digest();
    }

    // Check if secure local key file exists
    try {
      if (fs.existsSync(this.keyPath)) {
        const fileContent = fs.readFileSync(this.keyPath);
        if (fileContent.length === 32) {
          return fileContent;
        }
        if (fileContent.length === 64) {
          return Buffer.from(fileContent.toString('utf8'), 'hex');
        }
      }

      // Generate a new cryptographically secure random 256-bit key
      const randomKey = crypto.randomBytes(32);
      try {
        fs.writeFileSync(this.keyPath, randomKey, { mode: 0o600 });
      } catch {
        // If file system is read-only or restricted, return ephemeral memory key
      }
      return randomKey;
    } catch {
      return crypto.randomBytes(32);
    }
  }

  private loadVault(): Record<string, string> {
    if (!fs.existsSync(this.vaultPath)) {
      return {};
    }

    try {
      const raw = fs.readFileSync(this.vaultPath, 'utf8');
      const data = JSON.parse(raw);
      if (!data.encrypted || !data.iv || !data.tag) {
        return {};
      }
      const decrypted = decryptAES(data.encrypted, this.key, data.iv, data.tag);
      return JSON.parse(decrypted);
    } catch {
      return {};
    }
  }

  private saveVault(data: Record<string, string>): void {
    const json = JSON.stringify(data);
    const encryptedData = encryptAES(json, this.key);
    fs.writeFileSync(this.vaultPath, JSON.stringify(encryptedData, null, 2), {
      encoding: 'utf8',
      mode: 0o600, // Read/write only by owner
    });
  }

  public async set(key: string, value: string): Promise<void> {
    const vault = this.loadVault();
    vault[key] = value;
    this.saveVault(vault);
  }

  public async get(key: string): Promise<string | null> {
    const vault = this.loadVault();
    return vault[key] ?? null;
  }

  public async remove(key: string): Promise<void> {
    const vault = this.loadVault();
    if (key in vault) {
      delete vault[key];
      this.saveVault(vault);
    }
  }

  public async clear(): Promise<void> {
    this.saveVault({});
  }
}
