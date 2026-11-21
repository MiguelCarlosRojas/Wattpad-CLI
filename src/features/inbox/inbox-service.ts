import { InboxConversation, UserNotification } from '../../shared/types/inbox.types';
import { SessionManager } from '../../auth/session/session-manager';
import { WattpadApiClient } from '../../infrastructure/wattpad/wattpad-api';

export class InboxService {
  public static async getConversations(): Promise<InboxConversation[]> {
    const session = SessionManager.getSession();
    if (!session) return [];
    return WattpadApiClient.getInbox(session);
  }

  public static async getNotifications(): Promise<UserNotification[]> {
    const session = SessionManager.getSession();
    if (!session) return [];
    return WattpadApiClient.getNotifications(session);
  }
}
