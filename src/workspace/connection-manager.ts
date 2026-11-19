export interface ConnectionRecord {
  id: string;
  name: string;
  isConnected: boolean;
  accountName?: string | null;
  details?: string;
  updatedAt: string;
}

export class ConnectionManager {
  private connections: Map<string, ConnectionRecord> = new Map();

  constructor() {
    this.initDefaults();
  }

  private initDefaults(): void {
    this.setConnected('word', 'Microsoft Word (.docx)', true, 'Local Office');
    this.setConnected('notepad', 'Bloc de Notas (.txt)', true, 'Local UTF-8');
    this.setConnected('google', 'Google Docs / Drive', false);
    this.setConnected('wattpad', 'Wattpad', false);
  }

  public setConnected(
    id: string,
    name: string,
    isConnected: boolean,
    accountName?: string | null,
    details?: string
  ): void {
    const key = id.toLowerCase();
    this.connections.set(key, {
      id: key,
      name,
      isConnected,
      accountName: accountName || null,
      details,
      updatedAt: new Date().toISOString(),
    });
  }

  public getConnection(id: string): ConnectionRecord | null {
    return this.connections.get(id.toLowerCase()) || null;
  }

  public isConnected(id: string): boolean {
    const conn = this.getConnection(id);
    return Boolean(conn?.isConnected);
  }

  public getAll(): ConnectionRecord[] {
    return Array.from(this.connections.values());
  }

  public clear(): void {
    this.connections.clear();
    this.initDefaults();
  }
}
