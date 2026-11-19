export interface ConnectionRecord {
  id: string;
  name: string;
  isConnected: boolean;
  accountName?: string | null;
  details?: string;
  updatedAt: string;
}
