/**
 * Blocked temporary/fake email domains.
 * This is a subset of common disposable email services.
 */
const BLOCKED_DOMAINS = [
  "mailinator.com",
  "yopmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "dispostable.com",
  "sharklasers.com",
  "getnada.com",
  "fakeinbox.com",
  "throwawaymail.com",
];

export function isValidEmailDomain(email: string): boolean {
  if (!email || !email.includes("@")) return false;

  const domain = email.split("@")[1].toLowerCase();

  // 1. Block known bad domains
  if (BLOCKED_DOMAINS.includes(domain)) {
    return false;
  }

  // 2. Additional logic: You could whitelist trusted domains if needed,
  // but usually blocking disposable ones is better for UX.
  // The user specifically mentioned allowing Gmail.

  return true;
}
