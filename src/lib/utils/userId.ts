/**
 * Utility functions for managing userId in localStorage and URL parameters
 */

const USER_ID_KEY = 'userId';

/**
 * Get userId from localStorage
 */
export const getUserIdFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_KEY);
};

/**
 * Set userId to localStorage
 */
export const setUserIdToStorage = (userId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ID_KEY, userId);
};

/**
 * Extract userId from URL search parameters
 */
export const extractUserIdFromURL = (searchParams: URLSearchParams): string | null => {
  return searchParams.get('userId');
};

/**
 * Initialize userId from URL or localStorage
 * Priority: URL parameter > localStorage
 */
export const initializeUserId = (searchParams: URLSearchParams): string | null => {
  const userIdFromURL = extractUserIdFromURL(searchParams);
  
  if (userIdFromURL) {
    setUserIdToStorage(userIdFromURL);
    return userIdFromURL;
  }
  
  return getUserIdFromStorage();
};

/**
 * Clear userId from localStorage
 */
export const clearUserId = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_ID_KEY);
};
