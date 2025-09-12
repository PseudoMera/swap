/**
 * Utility functions for managing keyfile passwords in session storage
 */

/**
 * Store a password for a keyfile in session storage
 */
export function storeKeyfilePassword(filename: string, password: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`keyfile-password-${filename}`, password);
  }
}

/**
 * Retrieve a stored password for a keyfile from session storage
 */
export function getKeyfilePassword(filename: string): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(`keyfile-password-${filename}`);
  }
  return null;
}

/**
 * Remove a stored password for a keyfile from session storage
 */
export function removeKeyfilePassword(filename: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(`keyfile-password-${filename}`);
  }
}

/**
 * Check if a password is stored for a keyfile
 */
export function hasStoredPassword(filename: string): boolean {
  return getKeyfilePassword(filename) !== null;
}

/**
 * Clear all stored keyfile passwords
 */
export function clearAllKeyfilePasswords(): void {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('keyfile-password-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * Get all stored keyfile names that have passwords
 */
export function getStoredKeyfileNames(): string[] {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(sessionStorage);
    return keys
      .filter(key => key.startsWith('keyfile-password-'))
      .map(key => key.replace('keyfile-password-', ''));
  }
  return [];
}