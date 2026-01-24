/**
 * CRITICAL: Main admin is determined by USER ID, not role!
 *
 * Checks if a user is the main admin by comparing their ID
 * against the APPWRITE_MAIN_ADMIN_USER_ID environment variable.
 *
 * @param profile - User profile object with $id and appwriteUserId
 * @returns true if user is main admin, false otherwise
 */
export function checkIsMainAdmin(
  profile:
    | {
        $id?: string;
        appwriteUserId?: string;
        role?: string;
      }
    | null
    | undefined,
): boolean {
  if (!profile) return false;

  const envMainIdsString = (
    process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
    ""
  ).trim();

  if (!envMainIdsString) {
    // Fallback to role check only if env not set (for backward compatibility)
    return profile.role === "main_admin";
  }

  const mainAdminIds = envMainIdsString
    .split(",")
    .map((id) => id.trim().replace(/^["'](.+)["']$/, "$1"))
    .filter(Boolean);

  return !!(
    profile.role === "main_admin" ||
    (mainAdminIds.length > 0 &&
      (mainAdminIds.includes(profile.$id || "") ||
        (profile.appwriteUserId &&
          mainAdminIds.includes(profile.appwriteUserId))))
  );
}
