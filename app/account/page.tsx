"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import Button from "@/components/ui/Button";
import { VerificationSuccessBanner } from "@/components/features/auth/EmailVerification";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading account...</div>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const router = useRouter();
  const { authenticated, profile, account, loading } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);
  const searchParams = useSearchParams();

  // Check for verification success
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedBanner(true);
      window.dispatchEvent(new Event("session-changed"));
      window.history.replaceState({}, "", "/account");
      setTimeout(() => setShowVerifiedBanner(false), 10000);
    }
  }, [searchParams]);

  // REDIRECT UNVERIFIED CUSTOMERS
  useEffect(() => {
    if (loading) return;
    if (authenticated && account?.emailVerification === false) {
      const target = `/auth/verify-notice?email=${encodeURIComponent(
        profile?.email || "",
      )}`;
      const targetPathname = target.split("?")[0];
      // Only redirect if we aren't already there (avoids infinite loops)
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== targetPathname
      ) {
        router.replace(target);
      }
    }
  }, [
    loading,
    authenticated,
    account?.emailVerification,
    profile?.email,
    router,
  ]);

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const initials = useMemo(() => {
    const name: string = profile?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const two = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
    return two || "A";
  }, [profile?.name]);

  const avatarUrl: string | null = profile?.avatarUrl || null;

  const initialForm = useMemo(
    () => ({
      name: (profile?.name as string | undefined) || "",
      email: (profile?.email as string | undefined) || "",
      phone:
        profile?.phone === null || profile?.phone === undefined
          ? ""
          : String(profile.phone),
    }),
    [profile?.name, profile?.email, profile?.phone],
  );

  useEffect(() => {
    setName(initialForm.name);
    setPhone(initialForm.phone);
    setEmail(initialForm.email);
  }, [initialForm.name, initialForm.phone, initialForm.email]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canEdit = authenticated && profile?.role === "customer";
  const profileDirty =
    name.trim() !== initialForm.name.trim() ||
    email.trim() !== initialForm.email.trim() ||
    phone.trim() !== initialForm.phone.trim();

  const handleResendVerification = async () => {
    setResending(true);
    setError(null);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage(
          "✓ Verification email sent! Please check your inbox.",
        );
      } else {
        setError(data.error || "Failed to send email");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setResending(false);
    }
  };

  const onUpload = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("filename", file.name);

      const res = await fetch("/api/customer/profile/avatar", {
        method: "POST",
        body: form,
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update avatar");
      }

      setFile(null);
      router.refresh();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session-changed"));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  const onSaveProfile = async () => {
    if (!canEdit) return;
    setSavingProfile(true);
    setError(null);
    setProfileMessage(null);

    try {
      const payload: { name?: string; email?: string; phone?: string } = {};
      const updatedFields: string[] = [];

      if (name.trim() !== initialForm.name.trim()) {
        payload.name = name;
        updatedFields.push("Name");
      }
      if (email.trim() !== initialForm.email.trim()) {
        payload.email = email;
        updatedFields.push("Email");
      }
      if (phone.trim() !== initialForm.phone.trim()) {
        payload.phone = phone;
        updatedFields.push("Phone");
      }

      if (updatedFields.length === 0) return;

      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update profile");
      }

      let successMsg = `✓ Updated: ${updatedFields.join(", ")}`;
      if (payload.email) {
        successMsg += ". Verification email sent to new address.";
      }
      setProfileMessage(successMsg);

      router.refresh();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session-changed"));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onCancel = () => {
    setError(null);
    setProfileMessage(null);
    setFile(null);
    setName(initialForm.name);
    setEmail(initialForm.email);
    setPhone(initialForm.phone);
  };

  // Password Update State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canUpdatePassword = useMemo(() => {
    return (
      passwordForm.currentPassword.trim() !== "" &&
      passwordForm.newPassword.trim() !== "" &&
      passwordForm.newPassword === passwordForm.confirmPassword &&
      passwordForm.newPassword.length >= 8
    );
  }, [passwordForm]);

  const passwordsMatch =
    passwordForm.newPassword === "" ||
    passwordForm.newPassword === passwordForm.confirmPassword;

  const onUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    setSavingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update password");
      }

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        text: error?.message || "Failed to update password",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-10/12 px-4 py-10">
        <div className="text-sm font-semibold text-slate-700">Loading…</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto w-full max-w-10/12 px-4 py-10">
        <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>
        <p className="mt-2 text-sm text-slate-700">
          Please sign in to manage your account.
        </p>
        <div className="mt-4">
          <Link href="/auth/login" className="inline-flex">
            <Button variant="primary" rounded="full">
              Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.role !== "customer") {
    return (
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 py-10">
        <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>
        <p className="mt-2 text-sm text-slate-700">
          This page is available for customer accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 py-10">
      <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>

      <div className="mt-4">
        <VerificationSuccessBanner
          show={showVerifiedBanner}
          onClose={() => setShowVerifiedBanner(false)}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-slate-700">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              {profile?.name || "Account"}
            </div>
            <div className="truncate text-xs font-semibold text-slate-600">
              {profile?.email}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-900">
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2 ${
                account?.emailVerification === false
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200"
              }`}
              placeholder="your@email.com"
            />
            {account?.emailVerification === false && (
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs font-bold text-orange-600 flex items-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation"></i> Email not
                  verified.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md hover:bg-orange-200 transition font-bold disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Email"}
                </button>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-900">
              Phone / Contact
            </label>
            <input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="Phone number"
            />
          </div>
        </div>

        {profileMessage && (
          <div className="mt-4 text-sm font-bold text-green-600">
            {profileMessage}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="primary"
            rounded="full"
            disabled={!profileDirty || savingProfile}
            onClick={onSaveProfile}
          >
            {savingProfile ? "Saving…" : "Save info"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            rounded="full"
            disabled={(!profileDirty && !file) || savingProfile || saving}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-bold text-slate-900">
            Update avatar
          </label>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Choose an image file to use as your account avatar.
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
            />
            <Button
              type="button"
              variant="primary"
              rounded="full"
              disabled={!file || saving}
              onClick={onUpload}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          {file && (
            <div className="mt-2 text-xs font-semibold text-slate-600">
              Selected:{" "}
              <span className="font-bold text-slate-800">{file.name}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Payment Methods
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Manage your saved cards and mobile money accounts.
            </p>
          </div>
          <Link href="/customer/wallet">
            <Button type="button" variant="secondary" rounded="full">
              Manage Wallet
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Security</h2>
        <p className="mt-1 text-xs font-semibold text-slate-600">
          Update your password to keep your account secure.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-900">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="••••••••"
            />
            {passwordForm.confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs font-bold text-red-600">
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="primary"
            rounded="full"
            disabled={savingPassword || !canUpdatePassword}
            onClick={onUpdatePassword}
          >
            {savingPassword ? "Updating…" : "Update Password"}
          </Button>

          {passwordMessage && (
            <div
              className={`mt-3 text-sm font-semibold ${
                passwordMessage.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {passwordMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
