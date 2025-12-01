/**
 * Edge Runtime-compatible token verification
 * Uses 'jose' library which works in Edge Runtime (Next.js middleware)
 */

import { jwtVerify } from 'jose';

export interface VerifiedUser {
  userId: string;
  username?: string;
  sessionId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  [key: string]: any;
}

/**
 * Verify JWT token in Edge Runtime (middleware)
 * Matches the token structure from your parent application
 */
export async function verifyTokenEdge(token: string): Promise<VerifiedUser> {
  // Get JWT secret from environment variable
  const secretString = process.env.JWT_SECRET || 'secret';
  const secret = new TextEncoder().encode(secretString);

  try {
    // Verify and decode the token using jose (Edge Runtime compatible)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // Standard JWT algorithm
    });
    
    return {
      userId: String(payload.id), // Your token uses 'id' field for userId
      username: payload.username as string | undefined,
      sessionId: payload.sessionId as string | undefined,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
    };
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.error('[Auth] Token has expired:', error.message);
      throw new Error('Token has expired');
    }
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error('[Auth] Invalid token signature:', error.message);
      throw new Error('Invalid token');
    }
    console.error('[Auth] Token verification failed:', error);
    throw new Error('Authentication failed');
  }
}
