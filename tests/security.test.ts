import { describe, expect, it } from 'bun:test';
import crypto from 'crypto';
import { sha256, encryptAES, decryptAES, formatId } from '../src/security/crypto-utils';
import { CredentialStore } from '../src/security/credential-store';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Security & Crypto Utilities', () => {
  it('should compute deterministic SHA-256 hashes', () => {
    const text = 'Capítulo secreto de Wattpad';
    const hash1 = sha256(text);
    const hash2 = sha256(text);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('should encrypt and decrypt using AES-256-GCM', () => {
    const secretKey = crypto.randomBytes(32);
    const plainText = 'token_wattpad_ultra_secreto_12345';

    const { encrypted, iv, tag } = encryptAES(plainText, secretKey);
    const decrypted = decryptAES(encrypted, secretKey, iv, tag);

    expect(decrypted).toBe(plainText);
  });

  it('should format IDs consistently', () => {
    expect(formatId('NOV', 1)).toBe('NOV-0001');
    expect(formatId('NOV', 42)).toBe('NOV-0042');
    expect(formatId('CAP', 150)).toBe('CAP-0150');
  });

  it('should store and retrieve encrypted credentials in vault', async () => {
    const testVault = path.join(os.tmpdir(), `test_vault_${Date.now()}.enc`);
    const store = new CredentialStore(testVault);

    await store.set('wattpad_token', 'token_xyz_987');
    const retrieved = await store.get('wattpad_token');

    expect(retrieved).toBe('token_xyz_987');

    await store.remove('wattpad_token');
    const removed = await store.get('wattpad_token');
    expect(removed).toBeNull();

    try {
      fs.unlinkSync(testVault);
    } catch {}
  });
});
