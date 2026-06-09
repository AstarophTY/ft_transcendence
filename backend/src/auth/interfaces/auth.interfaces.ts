import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string | null;
  username: string;
  avatar: string | null;
  role: Role;
  campusId: string | null;
  jti: string;
}

export interface AuthUser {
  userId: string;
  email: string | null;
  role: Role;
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Set only on the 42 OAuth flow when the account was just created. */
  isNew?: boolean;
}

export interface FortyTwoProfile {
  fortyTwoId: number;
  fortyTwoLogin: string;
  email?: string;
  avatar?: string;
  displayName?: string;
  campus?: string;
}
