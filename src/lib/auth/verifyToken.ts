/**
 * Token verification utilities
 * Using jsonwebtoken library to verify JWT tokens
 */

import jwt from 'jsonwebtoken';

export interface VerifiedUser {
  userId: string;
  username?: string;
  sessionId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  [key: string]: any;
}

/**
 * Verify JWT token and extract user information
 * Matches the token structure from your parent application
 */
export async function verifyToken(token: string): Promise<VerifiedUser> {
  // Get JWT secret from environment variable
  const secret = process.env.JWT_SECRET || 'secret';

  try {
    // Verify and decode the token
    const payload = jwt.verify(token, secret) as any;
    
    return {
      userId: String(payload.id), // Your token uses 'id' field for userId
      username: payload.username,
      sessionId: payload.sessionId,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token has expired:', error.message);
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      console.error('Invalid token:', error.message);
      throw new Error('Invalid token');
    }
    console.error('Token verification failed:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Extract userId from token without full verification
 * WARNING: Only use for non-security-critical operations
 * Always verify token on the server side
 */
export function decodeTokenUnsafe(token: string): { userId: string } | null {
  try {
    // Decode JWT token without verification (just for reading)
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.id) return null;
    
    return { userId: String(decoded.id) };
  } catch {
    return null;
  }
}
