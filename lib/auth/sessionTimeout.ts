/**
 * Role-based session timeout configuration
 *
 * - Customer: No timeout (stays logged in)
 * - Seller: 7 days of inactivity
 * - Admin: 5 minutes of inactivity
 */

export const SESSION_TIMEOUTS = {
  customer: null, // No timeout
  seller: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  admin: 5 * 60 * 1000, // 5 minutes in milliseconds
  main_admin: 5 * 60 * 1000, // 5 minutes in milliseconds
} as const;

export function getSessionExpiry(role: string): Date | null {
  const timeout = SESSION_TIMEOUTS[role as keyof typeof SESSION_TIMEOUTS];
  if (!timeout) return null;
  return new Date(Date.now() + timeout);
}

export function isSessionExpired(lastActivity: string, role: string): boolean {
  const timeout = SESSION_TIMEOUTS[role as keyof typeof SESSION_TIMEOUTS];
  if (!timeout) return false; // Customer never expires

  const lastActivityTime = new Date(lastActivity).getTime();
  const now = Date.now();
  return now - lastActivityTime > timeout;
}

export function getTimeUntilExpiry(lastActivity: string, role: string): number {
  const timeout = SESSION_TIMEOUTS[role as keyof typeof SESSION_TIMEOUTS];
  if (!timeout) return Infinity;

  const lastActivityTime = new Date(lastActivity).getTime();
  const expiryTime = lastActivityTime + timeout;
  const now = Date.now();
  return Math.max(0, expiryTime - now);
}
