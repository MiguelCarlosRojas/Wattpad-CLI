/**
 * Tipos de datos para autenticación y sesiones
 */

export interface UserSession {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  token: string;
  refreshToken?: string;
  cookies?: Record<string, string>;
  createdAt: string;
  expiresAt?: string;
  email?: string;
  verified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  lastCheckedAt: string | null;
  statusMessage: string;
}

export type AuthMode = 'welcome' | 'login' | 'register';
