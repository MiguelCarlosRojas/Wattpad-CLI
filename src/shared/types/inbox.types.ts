/**
 * Tipos de datos para el buzón de mensajes y notificaciones
 */

export interface InboxConversation {
  id: string;
  withUsername: string;
  withDisplayName: string;
  withAvatar?: string;
  lastMessageSnippet: string;
  lastMessageDate: string;
  unread: boolean;
  unreadCount: number;
}

export interface ConversationMessage {
  id: string;
  senderUsername: string;
  senderDisplayName: string;
  text: string;
  sentAt: string;
  isMine: boolean;
}

export interface UserNotification {
  id: string;
  type: 'vote' | 'comment' | 'follow' | 'update' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetUrl?: string;
}
