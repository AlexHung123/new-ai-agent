/**
 * Utility functions for managing authentication tokens
 */

const AUTH_TOKEN_KEY = 'authToken';

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Set auth token to localStorage
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Extract token from URL search parameters
 */
export const extractTokenFromURL = (searchParams: URLSearchParams): string | null => {
  return searchParams.get('token');
};

/**
 * Initialize auth token from URL or localStorage
 * Priority: URL parameter > localStorage
 */
export const initializeAuthToken = (searchParams: URLSearchParams): string | null => {
  const tokenFromURL = extractTokenFromURL(searchParams);
  
  if (tokenFromURL) {
    setAuthToken(tokenFromURL);
    return tokenFromURL;
  }
  
  return getAuthToken();
};

/**
 * Clear auth token from localStorage
 */
export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Extract userId from JWT token (client-side, unsafe decode)
 * WARNING: Only for display/UI purposes, NOT for security
 * Server always verifies the token and extracts userId securely
 */
export const extractUserIdFromToken = (): string | null => {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }
  
  try {
    // Decode JWT token without verification (just for reading)
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (base64url decode)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    
    // Extract userId from 'id' field
    if (!payload || !payload.id) {
      return null;
    }
    
    return String(payload.id);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};
