export interface WattpadUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  description: string;
  numStories: number;
  numFollowing: number;
  numFollowers: number;
  numLists: number;
  votesReceived: number;
  created: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: WattpadUser;
  expiresAt?: string;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  fromUser: string;
  subject: string;
  preview: string;
  fullText?: string;
  date: string;
  read: boolean;
}
