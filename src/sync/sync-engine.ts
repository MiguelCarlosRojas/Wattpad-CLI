import { StoryManager } from '../workspace/story-manager';
import { ChapterManager } from '../workspace/chapter-manager';
import { DocumentManager } from '../workspace/document-manager';
import { SyncManager } from '../workspace/sync-manager';
import { WordService } from '../integrations/word/word-service';
import { NotepadService } from '../integrations/notepad/notepad-service';
import { GoogleService } from '../integrations/google/google-service';
import { WattpadService } from '../integrations/wattpad/wattpad-service';
import { BackupManager } from './backup-manager';
import { ConflictDetector } from './conflict-detector';
import { SyncOperationResult } from '../types/sync.types';
import { sha256 } from '../security/crypto-utils';
import { Story } from '../types/story.types';
import { Chapter } from '../types/chapter.types';

export class SyncEngine {
  constructor(
    private storyRepo: StoryManager,
    private chapterRepo: ChapterManager,
    private docRepo: DocumentManager,
    private syncRepo: SyncManager,
    private wordService: WordService,
    private notepadService: NotepadService,
    private googleService: GoogleService,
    private wattpadService: WattpadService,
    private backupManager: BackupManager
  ) {}

  public async syncChapter(storyId: string, chapterId: string, forceDirection?: 'to_external' | 'from_external'): Promise<SyncOperationResult> {
    const story = this.storyRepo.findById(storyId);
    if (!story) {
      throw new Error(`Novela con ID ${storyId} no encontrada`);
    }

    const chapter = this.chapterRepo.findById(chapterId);
    if (!chapter) {
      throw new Error(`Capítulo con ID ${chapterId} no encontrado`);
    }

    const pref = story.editorPreference;

    if (pref === 'word') {
      return this.syncWordChapter(story, chapter, forceDirection);
    } else if (pref === 'notepad') {
      return this.syncNotepadChapter(story, chapter, forceDirection);
    } else if (pref === 'google') {
      return this.syncGoogleChapter(story, chapter, forceDirection);
    }

    throw new Error(`Editor desconocido: ${pref}`);
  }

  private async syncWordChapter(story: Story, chapter: Chapter, forceDirection?: 'to_external' | 'from_external'): Promise<SyncOperationResult> {
    const docRecord = this.docRepo.findByChapter(chapter.id, 'word');

    // If file doesn't exist yet, export first
    if (!docRecord) {
      const exported = await this.wordService.exportChapterToDocx(story, chapter);
      this.docRepo.upsert({
        storyId: story.id,
        chapterId: chapter.id,
        docType: 'word',
        filePath: exported.filePath,
        externalId: null,
        lastSyncedHash: exported.hash,
        lastSyncedAt: new Date().toISOString(),
      });

      this.chapterRepo.update(chapter.id, { status: 'synced' });
      this.syncRepo.logSync('chapter', chapter.id, 'export', 'synced', `Exportado a ${exported.filePath}`);

      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Microsoft Word',
        status: 'synced',
        message: `Capítulo exportado a Word: ${exported.filePath}`,
      };
    }

    // Read current Word file content
    const external = await this.wordService.readChapterFromDocx(docRecord.filePath!);
    const localHash = sha256(chapter.content || '');
    const externalHash = external.hash;
    const lastSyncedHash = docRecord.lastSyncedHash || '';

    const { state, diff } = ConflictDetector.compare(
      chapter.content || '',
      external.content,
      lastSyncedHash,
      localHash,
      externalHash
    );

    if (state === 'in_sync') {
      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Microsoft Word',
        status: 'synced',
        message: 'El capítulo y el documento de Word están completamente sincronizados.',
      };
    }

    if (state === 'conflict' && !forceDirection) {
      // Conflict detected!
      this.syncRepo.logSync('chapter', chapter.id, 'conflict', 'conflict', diff.summary);
      return {
        success: false,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Microsoft Word',
        status: 'conflict',
        message: '¡Conflicto! Ambos lados fueron modificados. Usa /sync chapter NOV-xxxx CAP-xxxx para resolverlo.',
        diff,
      };
    }

    if (state === 'remote_ahead' || forceDirection === 'from_external') {
      // Import from Word into CLI
      this.backupManager.backupText(chapter.content || '', chapter.id, 'txt');
      this.chapterRepo.update(chapter.id, { content: external.content, status: 'synced' }, 'word');
      this.docRepo.upsert({
        ...docRecord,
        lastSyncedHash: externalHash,
      });

      this.syncRepo.logSync('chapter', chapter.id, 'import', 'synced', 'Importado desde Microsoft Word');
      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'Microsoft Word',
        destination: 'CLI',
        status: 'synced',
        message: 'Cambios de Microsoft Word importados correctamente a Wattpad CLI.',
        diff,
      };
    } else {
      // Export from CLI to Word
      this.backupManager.backupFile(docRecord.filePath!, chapter.id);
      const exported = await this.wordService.exportChapterToDocx(story, chapter);
      this.docRepo.upsert({
        ...docRecord,
        lastSyncedHash: exported.hash,
      });

      this.chapterRepo.update(chapter.id, { status: 'synced' });
      this.syncRepo.logSync('chapter', chapter.id, 'export', 'synced', 'Exportado a Microsoft Word');

      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Microsoft Word',
        status: 'synced',
        message: 'Cambios de Wattpad CLI exportados al documento Word.',
        diff,
      };
    }
  }

  private async syncNotepadChapter(story: Story, chapter: Chapter, forceDirection?: 'to_external' | 'from_external'): Promise<SyncOperationResult> {
    const docRecord = this.docRepo.findByChapter(chapter.id, 'notepad');

    if (!docRecord) {
      const exported = this.notepadService.exportChapterToTxt(story, chapter);
      this.docRepo.upsert({
        storyId: story.id,
        chapterId: chapter.id,
        docType: 'notepad',
        filePath: exported.filePath,
        externalId: null,
        lastSyncedHash: exported.hash,
        lastSyncedAt: new Date().toISOString(),
      });

      this.chapterRepo.update(chapter.id, { status: 'synced' });
      this.syncRepo.logSync('chapter', chapter.id, 'export', 'synced', `Exportado a ${exported.filePath}`);

      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Bloc de Notas',
        status: 'synced',
        message: `Capítulo exportado a Bloc de Notas: ${exported.filePath}`,
      };
    }

    const external = this.notepadService.readChapterFromTxt(docRecord.filePath!);
    const localHash = sha256(chapter.content || '');
    const externalHash = external.hash;
    const lastSyncedHash = docRecord.lastSyncedHash || '';

    const { state, diff } = ConflictDetector.compare(
      chapter.content || '',
      external.content,
      lastSyncedHash,
      localHash,
      externalHash
    );

    if (state === 'in_sync') {
      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Bloc de Notas',
        status: 'synced',
        message: 'El capítulo y el archivo de texto están completamente sincronizados.',
      };
    }

    if (state === 'conflict' && !forceDirection) {
      this.syncRepo.logSync('chapter', chapter.id, 'conflict', 'conflict', diff.summary);
      return {
        success: false,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Bloc de Notas',
        status: 'conflict',
        message: '¡Conflicto! Ambos lados fueron modificados.',
        diff,
      };
    }

    if (state === 'remote_ahead' || forceDirection === 'from_external') {
      this.backupManager.backupText(chapter.content || '', chapter.id, 'txt');
      this.chapterRepo.update(chapter.id, { content: external.content, status: 'synced' }, 'notepad');
      this.docRepo.upsert({
        ...docRecord,
        lastSyncedHash: externalHash,
      });

      this.syncRepo.logSync('chapter', chapter.id, 'import', 'synced', 'Importado desde Bloc de Notas');
      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'Bloc de Notas',
        destination: 'CLI',
        status: 'synced',
        message: 'Cambios del Bloc de Notas importados a Wattpad CLI.',
        diff,
      };
    } else {
      this.backupManager.backupFile(docRecord.filePath!, chapter.id);
      const exported = this.notepadService.exportChapterToTxt(story, chapter);
      this.docRepo.upsert({
        ...docRecord,
        lastSyncedHash: exported.hash,
      });

      this.chapterRepo.update(chapter.id, { status: 'synced' });
      this.syncRepo.logSync('chapter', chapter.id, 'export', 'synced', 'Exportado a Bloc de Notas');

      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Bloc de Notas',
        status: 'synced',
        message: 'Cambios exportados al archivo de texto.',
        diff,
      };
    }
  }

  private async syncGoogleChapter(story: Story, chapter: Chapter, forceDirection?: 'to_external' | 'from_external'): Promise<SyncOperationResult> {
    const isConn = await this.googleService.isConnected();
    if (!isConn) {
      throw new Error('Google Docs no está conectado. Usa /connect google.');
    }

    const docRecord = this.docRepo.findByChapter(chapter.id, 'google');
    const existingDocId = docRecord?.externalId || undefined;

    if (!docRecord || !existingDocId) {
      const exported = await this.googleService.exportChapterToGoogleDoc(story, chapter);
      this.docRepo.upsert({
        storyId: story.id,
        chapterId: chapter.id,
        docType: 'google',
        filePath: exported.docUrl,
        externalId: exported.docId,
        lastSyncedHash: exported.hash,
        lastSyncedAt: new Date().toISOString(),
      });

      this.chapterRepo.update(chapter.id, { status: 'synced', externalDocId: exported.docId });
      this.syncRepo.logSync('chapter', chapter.id, 'export', 'synced', `Google Doc: ${exported.docUrl}`);

      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Google Docs',
        status: 'synced',
        message: `Capítulo sincronizado en Google Docs: ${exported.docUrl}`,
      };
    }

    const external = await this.googleService.importChapterFromGoogleDoc(existingDocId);
    const localHash = sha256(chapter.content || '');
    const externalHash = external.hash;
    const lastSyncedHash = docRecord.lastSyncedHash || '';

    const { state, diff } = ConflictDetector.compare(
      chapter.content || '',
      external.content,
      lastSyncedHash,
      localHash,
      externalHash
    );

    if (state === 'in_sync') {
      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Google Docs',
        status: 'synced',
        message: 'El capítulo y el Google Doc están completamente sincronizados.',
      };
    }

    if (state === 'conflict' && !forceDirection) {
      return {
        success: false,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Google Docs',
        status: 'conflict',
        message: 'Conflicto detectado con Google Docs.',
        diff,
      };
    }

    if (state === 'remote_ahead' || forceDirection === 'from_external') {
      this.backupManager.backupText(chapter.content || '', chapter.id, 'txt');
      this.chapterRepo.update(chapter.id, { content: external.content, status: 'synced' }, 'google');
      this.docRepo.upsert({
        ...docRecord,
        lastSyncedHash: externalHash,
      });

      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'Google Docs',
        destination: 'CLI',
        status: 'synced',
        message: 'Contenido actualizado desde Google Docs.',
        diff,
      };
    } else {
      const exported = await this.googleService.exportChapterToGoogleDoc(story, chapter, existingDocId);
      this.docRepo.upsert({
        ...docRecord,
        lastSyncedHash: exported.hash,
      });

      this.chapterRepo.update(chapter.id, { status: 'synced' });
      return {
        success: true,
        entityType: 'chapter',
        entityId: chapter.id,
        source: 'CLI',
        destination: 'Google Docs',
        status: 'synced',
        message: 'Capítulo subido a Google Docs.',
        diff,
      };
    }
  }

  public async syncStory(storyId: string): Promise<SyncOperationResult[]> {
    const story = this.storyRepo.findById(storyId);
    if (!story) {
      throw new Error(`Novela ${storyId} no encontrada`);
    }

    const chapters = this.chapterRepo.findByStoryId(storyId);
    const results: SyncOperationResult[] = [];

    // Also export the master story file (.docx or .txt)
    if (story.editorPreference === 'word') {
      await this.wordService.exportStoryToDocx(story, chapters);
    } else if (story.editorPreference === 'notepad') {
      this.notepadService.exportStoryToTxt(story, chapters);
    }

    for (const ch of chapters) {
      const res = await this.syncChapter(storyId, ch.id);
      results.push(res);
    }

    this.storyRepo.update(storyId, { status: 'synced' });
    return results;
  }
}
