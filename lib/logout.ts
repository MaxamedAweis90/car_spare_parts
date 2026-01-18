"use client";

// Calls the logout API and reports success.
export async function performLogout(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) {
      console.error("Logout failed with status", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Logout request error", error);
    return false;
  }
}

