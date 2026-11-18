import { describe, expect, it } from 'bun:test';
import { ConflictDetector } from '../src/sync/conflict-detector';
import { BackupManager } from '../src/sync/backup-manager';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Sync Engine & Conflict Detection', () => {
  it('should detect in_sync when hashes match', () => {
    const hash = 'a1b2c3d4';
    const { state } = ConflictDetector.compare('Hello', 'Hello', hash, hash, hash);
    expect(state).toBe('in_sync');
  });

  it('should detect local_ahead when only local changed', () => {
    const baseHash = 'base123';
    const newLocalHash = 'local999';
    const externalHash = baseHash;

    const { state } = ConflictDetector.compare(
      'Local changed',
      'Original',
      baseHash,
      newLocalHash,
      externalHash
    );

    expect(state).toBe('local_ahead');
  });

  it('should detect remote_ahead when only external changed', () => {
    const baseHash = 'base123';
    const localHash = baseHash;
    const newExternalHash = 'ext999';

    const { state } = ConflictDetector.compare(
      'Original',
      'External changed',
      baseHash,
      localHash,
      newExternalHash
    );

    expect(state).toBe('remote_ahead');
  });

  it('should detect conflict when both sides changed independently', () => {
    const baseHash = 'base123';
    const localHash = 'local_edit_456';
    const externalHash = 'external_edit_789';

    const { state, diff } = ConflictDetector.compare(
      'Local line 1\nLocal line 2',
      'External line 1\nExternal line 3',
      baseHash,
      localHash,
      externalHash
    );

    expect(state).toBe('conflict');
    expect(diff.hasDifferences).toBe(true);
  });

  it('should create backup files properly', () => {
    const tmpBackupDir = path.join(os.tmpdir(), `wattpad_backups_${Date.now()}`);
    const backupMgr = new BackupManager(tmpBackupDir);

    const backupFile = backupMgr.backupText('Texto de seguridad previo a sobrescritura', 'CAP-0001', 'txt');
    expect(fs.existsSync(backupFile)).toBe(true);

    const readBack = fs.readFileSync(backupFile, 'utf8');
    expect(readBack).toBe('Texto de seguridad previo a sobrescritura');

    try {
      fs.unlinkSync(backupFile);
      fs.rmdirSync(tmpBackupDir);
    } catch {}
  });
});
