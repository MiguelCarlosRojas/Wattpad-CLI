import crypto from 'crypto';
import os from 'os';
import { env } from '../../shared/config/env.config';

/**
 * Bóveda criptográfica ligera para proteger tokens de sesión locales.
 * Deriva una clave a partir de la máquina del usuario (sin almacenar contraseñas en texto plano).
 */
export class CryptoVault {
  private static getMachineKey(): Buffer {
    const salt = `${os.hostname()}-${os.platform()}-${os.userInfo().username}-wattpad-cli`;
    return crypto.scryptSync(salt, env.WATTPAD_VAULT_SALT || 'wattpad-sovereign-salt', 32);
  }

  /**
   * Cifra una cadena (ej. token de sesión)
   */
  public static encrypt(text: string): string {
    try {
      const key = this.getMachineKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch {
      // Fallback base64 simple si AES no está disponible
      return Buffer.from(text).toString('base64');
    }
  }

  /**
   * Descifra una cadena previamente cifrada
   */
  public static decrypt(cipherText: string): string {
    try {
      if (!cipherText.includes(':')) {
        return Buffer.from(cipherText, 'base64').toString('utf8');
      }
      const [ivHex, encrypted] = cipherText.split(':');
      const key = this.getMachineKey();
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }
}
