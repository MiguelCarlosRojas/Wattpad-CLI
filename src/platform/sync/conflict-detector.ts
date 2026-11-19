import { DiffResult, SyncState } from '../../core/types/sync.types';

export class ConflictDetector {
  public static compare(localContent: string, externalContent: string, lastSyncedHash: string, localHash: string, externalHash: string): { state: SyncState; diff: DiffResult } {
    const localLines = localContent.split('\n');
    const externalLines = externalContent.split('\n');

    let state: SyncState = 'in_sync';

    if (localHash === externalHash) {
      state = 'in_sync';
    } else if (externalHash === lastSyncedHash && localHash !== lastSyncedHash) {
      state = 'local_ahead';
    } else if (localHash === lastSyncedHash && externalHash !== lastSyncedHash) {
      state = 'remote_ahead';
    } else {
      state = 'conflict';
    }

    const diff = this.computeDiff(localLines, externalLines, localHash, externalHash);
    return { state, diff };
  }

  public static computeDiff(localLines: string[], externalLines: string[], localHash: string, externalHash: string): DiffResult {
    const localSet = new Set(localLines);
    const externalSet = new Set(externalLines);

    let addedLines = 0;
    let removedLines = 0;

    for (const line of externalLines) {
      if (!localSet.has(line)) addedLines++;
    }

    for (const line of localLines) {
      if (!externalSet.has(line)) removedLines++;
    }

    const hasDifferences = localHash !== externalHash;
    const summary = hasDifferences
      ? `Diferencias: +${addedLines} líneas externas, -${removedLines} líneas locales`
      : 'Sin diferencias detectadas';

    return {
      hasDifferences,
      localHash,
      externalHash,
      localLinesCount: localLines.length,
      externalLinesCount: externalLines.length,
      addedLines,
      removedLines,
      summary,
    };
  }
}
