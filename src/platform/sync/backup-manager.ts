import fs from 'fs';
import path from 'path';
import { defaultConfig } from '../../core/config/config';

export class BackupManager {
  private backupDir: string;

  constructor(backupDir?: string) {
    this.backupDir = backupDir || defaultConfig.backupDir;
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  public backupText(content: string, entityId: string, extension: string = 'txt'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${entityId}_backup_${timestamp}.${extension}`;
    const targetPath = path.join(this.backupDir, fileName);

    fs.writeFileSync(targetPath, content, { encoding: 'utf8' });
    return targetPath;
  }

  public backupFile(sourcePath: string, entityId: string): string | null {
    if (!fs.existsSync(sourcePath)) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(sourcePath) || '.bak';
    const fileName = `${entityId}_backup_${timestamp}${ext}`;
    const targetPath = path.join(this.backupDir, fileName);

    fs.copyFileSync(sourcePath, targetPath);
    return targetPath;
  }
}
