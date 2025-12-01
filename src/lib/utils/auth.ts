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
