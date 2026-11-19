import { DocumentRecord } from '../types/document.types';

export class DocumentManager {
  private documents: Map<string, DocumentRecord> = new Map();

  public upsert(doc: Omit<DocumentRecord, 'id' | 'updatedAt'> & { id?: string }): DocumentRecord {
    const id = doc.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record: DocumentRecord = {
      ...doc,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.documents.set(id, record);
    return record;
  }

  public findByChapter(chapterId: string, docType?: string): DocumentRecord | null {
    for (const doc of this.documents.values()) {
      if (doc.chapterId === chapterId && (!docType || doc.docType === docType)) {
        return doc;
      }
    }
    return null;
  }

  public findByStory(storyId: string): DocumentRecord[] {
    return Array.from(this.documents.values()).filter((d) => d.storyId === storyId);
  }

  public delete(id: string): boolean {
    return this.documents.delete(id);
  }

  public clear(): void {
    this.documents.clear();
  }
}
