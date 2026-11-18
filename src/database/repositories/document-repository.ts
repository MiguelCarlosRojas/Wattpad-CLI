import { Database } from 'bun:sqlite';
import { ExternalDocument, IntegrationType } from '../../types/integration.types';

export class DocumentRepository {
  constructor(private db: Database) {}

  public upsert(doc: Omit<ExternalDocument, 'id'>): ExternalDocument {
    const existing = this.findByChapter(doc.chapterId, doc.docType);

    const now = new Date().toISOString();
    if (existing) {
      this.db.run(
        `UPDATE external_documents SET
          file_path = ?, external_id = ?, last_synced_hash = ?, last_synced_at = ?
        WHERE id = ?`,
        [doc.filePath, doc.externalId, doc.lastSyncedHash, now, existing.id]
      );
      return {
        ...existing,
        filePath: doc.filePath,
        externalId: doc.externalId,
        lastSyncedHash: doc.lastSyncedHash,
        lastSyncedAt: now,
      };
    } else {
      this.db.run(
        `INSERT INTO external_documents (
          story_id, chapter_id, doc_type, file_path, external_id, last_synced_hash, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [doc.storyId, doc.chapterId, doc.docType, doc.filePath, doc.externalId, doc.lastSyncedHash, now]
      );

      const created = this.findByChapter(doc.chapterId, doc.docType);
      if (!created) {
        throw new Error('Failed to create external document');
      }
      return created;
    }
  }

  public findByChapter(chapterId: string | null, docType: IntegrationType): ExternalDocument | null {
    if (!chapterId) {
      const r = this.db.query('SELECT * FROM external_documents WHERE chapter_id IS NULL AND doc_type = ?').get(docType) as Record<string, any> | null;
      return r ? this.mapRow(r) : null;
    }
    const r = this.db.query('SELECT * FROM external_documents WHERE chapter_id = ? AND doc_type = ?').get(chapterId, docType) as Record<string, any> | null;
    return r ? this.mapRow(r) : null;
  }

  public findByStory(storyId: string): ExternalDocument[] {
    const rows = this.db.query('SELECT * FROM external_documents WHERE story_id = ?').all(storyId) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRow(r));
  }

  public delete(id: number): boolean {
    const res = this.db.run('DELETE FROM external_documents WHERE id = ?', [id]);
    return res.changes > 0;
  }

  private mapRow(r: Record<string, any>): ExternalDocument {
    return {
      id: r.id,
      storyId: r.story_id,
      chapterId: r.chapter_id,
      docType: r.doc_type as IntegrationType,
      filePath: r.file_path,
      externalId: r.external_id,
      lastSyncedHash: r.last_synced_hash,
      lastSyncedAt: r.last_synced_at,
    };
  }
}
