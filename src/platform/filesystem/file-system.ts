import fs from 'fs';
import path from 'path';
import { sanitizeFileName } from '../../core/utils/formatter';
import { defaultConfig } from '../../core/config/config';
import { Story, LocalManuscript } from '../../features/stories/types/story.types';
import { Chapter } from '../../features/chapters/types/chapter.types';

export class FileSystemManager {
  private baseDocsDir: string;

  constructor(baseDocsDir?: string) {
    if (baseDocsDir) {
      this.baseDocsDir = baseDocsDir;
    } else {
      // Primary location: "Mis novelas" in current working directory
      const localMisNovelas = path.resolve(process.cwd(), 'Mis novelas');
      this.baseDocsDir = localMisNovelas;
    }

    if (!fs.existsSync(this.baseDocsDir)) {
      try {
        fs.mkdirSync(this.baseDocsDir, { recursive: true });
      } catch {}
    }
  }

  public getBaseDir(): string {
    return this.baseDocsDir;
  }

  public getStoryFolder(storyTitle: string): string {
    const cleanTitle = sanitizeFileName(storyTitle);
    const storyFolder = path.join(this.baseDocsDir, cleanTitle);
    if (!fs.existsSync(storyFolder)) {
      fs.mkdirSync(storyFolder, { recursive: true });
    }

    const infoFolder = path.join(storyFolder, 'Informacion');
    if (!fs.existsSync(infoFolder)) {
      fs.mkdirSync(infoFolder, { recursive: true });
    }

    const chaptersFolder = path.join(storyFolder, 'Capitulos');
    if (!fs.existsSync(chaptersFolder)) {
      fs.mkdirSync(chaptersFolder, { recursive: true });
    }

    return storyFolder;
  }

  public getInfoFolder(storyTitle: string): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    const infoFolder = path.join(storyFolder, 'Informacion');
    if (!fs.existsSync(infoFolder)) {
      fs.mkdirSync(infoFolder, { recursive: true });
    }
    return infoFolder;
  }

  public getChaptersFolder(storyTitle: string): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    const chaptersFolder = path.join(storyFolder, 'Capitulos');
    if (!fs.existsSync(chaptersFolder)) {
      fs.mkdirSync(chaptersFolder, { recursive: true });
    }
    return chaptersFolder;
  }

  public getStoryFilePath(storyTitle: string, ext: 'docx' | 'txt'): string {
    const storyFolder = this.getStoryFolder(storyTitle);
    return path.join(storyFolder, `novela.${ext}`);
  }

  public getChapterFilePath(
    storyTitle: string,
    chapterNumber: number,
    ext: 'docx' | 'txt' = 'docx',
    chapterTitle?: string
  ): string {
    const chaptersFolder = this.getChaptersFolder(storyTitle);
    const padded = String(chapterNumber).padStart(3, '0');
    const titlePart = chapterTitle ? ` - ${sanitizeFileName(chapterTitle)}` : '';
    return path.join(chaptersFolder, `${padded}${titlePart}.${ext}`);
  }

  public syncStoryStructure(story: Story, chapters: Chapter[]): void {
    const storyFolder = this.getStoryFolder(story.title);
    const infoFolder = this.getInfoFolder(story.title);
    const chaptersFolder = this.getChaptersFolder(story.title);

    // 1. Informacion/sinopsis.txt
    const synopsisPath = path.join(infoFolder, 'sinopsis.txt');
    try {
      fs.writeFileSync(synopsisPath, story.description || '', 'utf8');
    } catch {}

    // 2. Informacion/metadatos.json
    const metaPath = path.join(infoFolder, 'metadatos.json');
    const metadata = {
      id: story.id,
      wattpadId: story.wattpadId || null,
      title: story.title,
      description: story.description,
      genre: story.genre,
      category: story.category,
      tags: story.tags,
      language: story.language,
      mature: story.mature,
      editorPreference: story.editorPreference,
      status: story.status,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };
    try {
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
    } catch {}

    // 3. Capitulos/
    const ext = story.editorPreference === 'notepad' ? 'txt' : 'docx';
    for (const chap of chapters) {
      const padded = String(chap.chapterNumber).padStart(3, '0');
      const cleanTitle = sanitizeFileName(chap.title);
      const filePath = path.join(chaptersFolder, `${padded} - ${cleanTitle}.${ext}`);
      if (!fs.existsSync(filePath)) {
        try {
          if (ext === 'txt') {
            fs.writeFileSync(filePath, chap.content || '', 'utf8');
          }
        } catch {}
      }
    }
  }

  public createBackup(filePath: string, entityId: string): string | null {
    if (!fs.existsSync(filePath)) return null;

    const backupDir = defaultConfig.backupDir;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const backupName = `${entityId}_${timestamp}${ext}`;
    const backupPath = path.join(backupDir, backupName);

    try {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch {
      return null;
    }
  }

  public async openFileInOS(filePath: string, preferredEditor?: 'word' | 'notepad' | 'google'): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const isWindows = process.platform === 'win32';

    if (preferredEditor === 'notepad' && isWindows) {
      Bun.spawn(['notepad.exe', filePath], { detached: true });
      return true;
    }

    // Windows shell execute
    if (isWindows) {
      Bun.spawn(['cmd', '/c', 'start', '""', filePath], { detached: true });
      return true;
    }

    // Fallback for macOS / Linux
    const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
    Bun.spawn([opener, filePath], { detached: true });
    return true;
  }

  /**
   * Escanea la carpeta local de novelas ("Mis novelas") y detecta manuscritos Word (.docx)
   * o Bloc de Notas (.txt) pendientes de subir a Wattpad.
   */
  public scanLocalManuscripts(customDir?: string): LocalManuscript[] {
    const targetDir = customDir || this.baseDocsDir;
    const manuscripts: LocalManuscript[] = [];

    if (!fs.existsSync(targetDir)) {
      return manuscripts;
    }

    try {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(targetDir, entry.name);

        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.docx' || ext === '.txt') {
            const stats = fs.statSync(fullPath);
            const rawExt = ext.replace('.', '') as 'docx' | 'txt';
            const cleanTitle = path.basename(entry.name, ext).replace(/[_-]/g, ' ').trim();
            manuscripts.push({
              filename: entry.name,
              filePath: fullPath,
              relativePath: path.relative(process.cwd(), fullPath),
              format: rawExt,
              detectedTitle: cleanTitle,
              chapterCount: 1,
              sizeBytes: stats.size,
              lastModified: stats.mtime.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: 'Solo disponible localmente',
              synced: false,
            });
          }
        } else if (entry.isDirectory()) {
          // Folder-based story: Mis novelas/<StoryName>/
          const subEntries = fs.readdirSync(fullPath);
          const docFile = subEntries.find((f) => f === 'novela.docx' || f === 'novela.txt') ||
                          subEntries.find((f) => f.endsWith('.docx') || f.endsWith('.txt'));

          // Check Informacion/metadatos.json
          let storyTitle = entry.name.replace(/[_-]/g, ' ').trim();
          let linkedWattpadId: string | undefined;
          const metaPath = path.join(fullPath, 'Informacion', 'metadatos.json');
          if (fs.existsSync(metaPath)) {
            try {
              const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
              if (metaContent.title) storyTitle = metaContent.title;
              if (metaContent.wattpadId) linkedWattpadId = String(metaContent.wattpadId);
            } catch {}
          }

          // Count chapters in Capitulos folder
          const chaptersDir = path.join(fullPath, 'Capitulos');
          let chapterFilesCount = 0;
          let latestChapterMtime = 0;
          if (fs.existsSync(chaptersDir)) {
            const chapFiles = fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.docx') || f.endsWith('.txt'));
            chapterFilesCount = chapFiles.length;
            for (const chapFile of chapFiles) {
              try {
                const chapStats = fs.statSync(path.join(chaptersDir, chapFile));
                if (chapStats.mtimeMs > latestChapterMtime) {
                  latestChapterMtime = chapStats.mtimeMs;
                }
              } catch {}
            }
          }

          if (docFile) {
            const docPath = path.join(fullPath, docFile);
            const stats = fs.statSync(docPath);
            const ext = path.extname(docFile).toLowerCase().replace('.', '') as 'docx' | 'txt';
            const mtime = Math.max(stats.mtimeMs, latestChapterMtime);
            manuscripts.push({
              filename: `${entry.name}/${docFile}`,
              filePath: docPath,
              relativePath: path.relative(process.cwd(), docPath),
              format: ext === 'docx' ? 'docx' : 'txt',
              detectedTitle: storyTitle,
              chapterCount: Math.max(1, chapterFilesCount),
              sizeBytes: stats.size,
              lastModified: new Date(mtime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: 'Solo disponible localmente',
              synced: !!linkedWattpadId,
              linkedStoryId: linkedWattpadId,
            });
          } else if (chapterFilesCount > 0) {
            // Folder only has Capitulos/
            const firstChap = path.join(chaptersDir, fs.readdirSync(chaptersDir)[0]);
            const stats = fs.statSync(firstChap);
            const ext = path.extname(firstChap).toLowerCase().replace('.', '') as 'docx' | 'txt';
            manuscripts.push({
              filename: `${entry.name}/Capitulos`,
              filePath: chaptersDir,
              relativePath: path.relative(process.cwd(), chaptersDir),
              format: ext === 'docx' ? 'docx' : 'txt',
              detectedTitle: storyTitle,
              chapterCount: chapterFilesCount,
              sizeBytes: stats.size * chapterFilesCount,
              lastModified: new Date(latestChapterMtime || stats.mtimeMs).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: 'Solo disponible localmente',
              synced: !!linkedWattpadId,
              linkedStoryId: linkedWattpadId,
            });
          }
        }
      }
    } catch {}

    return manuscripts;
  }
}
