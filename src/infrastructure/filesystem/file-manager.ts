import fs from 'fs';
import path from 'path';
import os from 'os';
import { sanitizeFileName } from '../../shared/utils/string-utils';

/**
 * Gestor de almacenamiento en el directorio del usuario ~/.wattpad
 * No almacena datos dentro del repositorio.
 */
export class FileManager {
  private static rootDir: string = path.join(os.homedir(), '.wattpad');

  public static getRoot(): string {
    return this.rootDir;
  }

  public static getConfigDir(): string {
    return path.join(this.rootDir, 'config');
  }

  public static getAuthDir(): string {
    return path.join(this.rootDir, 'auth');
  }

  public static getDataDir(): string {
    return path.join(this.rootDir, 'data');
  }

  public static getManuscriptsDir(): string {
    return path.join(this.rootDir, 'manuscripts', 'stories');
  }

  public static getLogsDir(): string {
    return path.join(this.rootDir, 'logs');
  }

  /**
   * Inicializa la estructura de directorios en ~/.wattpad
   */
  public static ensureStructure(): void {
    const dirs = [
      this.rootDir,
      this.getConfigDir(),
      this.getAuthDir(),
      this.getDataDir(),
      this.getManuscriptsDir(),
      this.getLogsDir(),
    ];

    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
  }

  /**
   * Obtiene la ruta al directorio de una historia específica
   */
  public static getStoryDir(storyTitleOrId: string): string {
    const safeName = sanitizeFileName(storyTitleOrId);
    const storyPath = path.join(this.getManuscriptsDir(), safeName);
    if (!fs.existsSync(storyPath)) {
      fs.mkdirSync(storyPath, { recursive: true });
    }
    const chaptersDir = path.join(storyPath, 'chapters');
    if (!fs.existsSync(chaptersDir)) {
      fs.mkdirSync(chaptersDir, { recursive: true });
    }
    const backupsDir = path.join(storyPath, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    return storyPath;
  }

  /**
   * Lee un archivo JSON de forma segura
   */
  public static readJson<T>(filePath: string): T | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * Escribe un archivo JSON con formato atómico
   */
  public static writeJson(filePath: string, data: any): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  }

  /**
   * Lee un archivo de texto/markdown
   */
  public static readText(filePath: string): string {
    try {
      if (!fs.existsSync(filePath)) return '';
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return '';
    }
  }

  /**
   * Escribe un archivo de texto/markdown
   */
  public static writeText(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Crea un respaldo con timestamp de un archivo
   */
  public static createBackup(filePath: string, backupDir: string): string {
    if (!fs.existsSync(filePath)) return '';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const filename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${filename}.${timestamp}.bak`);
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }
}
