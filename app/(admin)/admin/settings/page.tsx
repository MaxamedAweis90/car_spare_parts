"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { Avatar } from "antd";
import {
  UserOutlined,
  CameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { VerificationSuccessBanner } from "@/components/features/auth/EmailVerification";
import SessionManager from "@/components/features/auth/SessionManager";

interface Session {
  $id: string;
  osName: string;
  osVersion: string;
  clientName: string;
  clientVersion: string;
  deviceBrand: string;
  deviceModel: string;
  ip: string;
  current: boolean;
  lastAccessed?: string;
  $createdAt: string;
}

import { Suspense } from "react";

export default function AdminSettings() {
  return (
    <Suspense fallback={<div className="p-10">Loading settings...</div>}>
      <AdminSettingsContent />
    </Suspense>
  );
}

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const { profile, account } = useSession();
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passMessage, setPassMessage] = useState("");
  const [passError, setPassError] = useState("");

  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [initialProfileForm, setInitialProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resending, setResending] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for verification success
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedBanner(true);
      window.dispatchEvent(new Event("session-changed"));
      window.history.replaceState({}, "", "/admin/settings");
      setTimeout(() => setShowVerifiedBanner(false), 10000);
    }
  }, [searchParams]);

  // Detect if form has changes
  const hasProfileChanges = useMemo(() => {
    return (
      profileForm.name !== initialProfileForm.name ||
      profileForm.email !== initialProfileForm.email ||
      profileForm.phone !== initialProfileForm.phone
    );
  }, [profileForm, initialProfileForm]);

  // Smart password validation
  const canUpdatePassword = useMemo(() => {
    return (
      passwordForm.current.trim() !== "" &&
      passwordForm.new.trim() !== "" &&
      passwordForm.new === passwordForm.confirm &&
      passwordForm.new.length >= 8
    );
  }, [passwordForm]);

  const passwordsMatch =
    passwordForm.new === "" || passwordForm.new === passwordForm.confirm;

  // Show success message if coming from verification
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setProfileMessage("Email verified successfully!");
      // Trigger session refresh
      window.dispatchEvent(new Event("session-changed"));
      // Clear the query param
      window.history.replaceState({}, "", "/admin/settings");
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      const data = {
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone ? String(profile.phone) : "",
      };
      setProfileForm(data);
      setInitialProfileForm(data);
    }
  }, [profile]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage("");
    setPassError("");

    if (passwordForm.new !== passwordForm.confirm) {
      setPassError("New passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      if (res.ok) {
        setPassMessage("Password updated successfully");
        setPasswordForm({ current: "", new: "", confirm: "" });
      } else {
        const data = await res.json();
        setPassError(data.error || "Failed to update password");
      }
    } catch (err) {
      setPassError("Server error");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");

    if (!profile) return;

    // Get only changed fields
    const changes: any = { userId: profile.$id, updaterId: profile.$id };
    const updatedFields: string[] = [];

    if (profileForm.name.trim() !== initialProfileForm.name) {
      changes.name = profileForm.name.trim();
      updatedFields.push("Name");
    }

    if (profileForm.email.trim() !== initialProfileForm.email) {
      changes.email = profileForm.email.trim();
      updatedFields.push("Email");
    }

    if (profileForm.phone.trim() !== initialProfileForm.phone) {
      // Clean non-digits
      const digits = profileForm.phone.replace(/\D/g, "");
      if (digits.length > 0) {
        changes.phone = parseInt(digits, 10);
        updatedFields.push("Phone");
      }
    }

    if (updatedFields.length === 0) return;

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Failed to update profile");
        return;
      }

      setInitialProfileForm({ ...profileForm });

      let successMsg = `✓ Updated: ${updatedFields.join(", ")}`;
      if (changes.email && profile.role !== "main_admin") {
        successMsg += ". Verification email sent to new address.";
      }
      setProfileMessage(successMsg);

      // Log activity
      await fetch("/api/activities/log", {
        method: "POST",
        body: JSON.stringify({
          action: "UPDATE_PROFILE",
          details: { fields: updatedFields },
          targetId: profile.$id,
          targetType: "admin",
        }),
      });

      window.dispatchEvent(new Event("session-changed"));
    } catch (err) {
      setProfileError("Server error");
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setProfileMessage("");
    setProfileError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage("Verification email sent! Please check your inbox.");
      } else {
        setProfileError(data.error || "Failed to send email");
      }
    } catch (err) {
      setProfileError("Server error");
    } finally {
      setResending(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // limit 2mb
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large (max 2MB)");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        window.dispatchEvent(new Event("session-changed"));
      } else {
        alert("Failed to upload avatar");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarUrl = profile?.avatarId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_AVATAR_BUCKET_ID}/files/${profile.avatarId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Admin Settings</h1>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <i className="fa-solid fa-user-pen text-slate-400"></i>
          Profile Information
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="relative group">
            <Avatar
              size={100}
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              className="border-4 border-slate-50 shadow-lg"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 bg-slate-900 text-white rounded-full p-2 hover:bg-slate-700 transition shadow-md"
            >
              {uploadingAvatar ? <LoadingOutlined /> : <CameraOutlined />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Form */}
          <form
            onSubmit={handleProfileUpdate}
            className="flex-1 space-y-4 w-full max-w-md"
          >
            <VerificationSuccessBanner
              show={showVerifiedBanner}
              onClose={() => setShowVerifiedBanner(false)}
            />
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Display Name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Email Address
                {profile?.role !== "main_admin" && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    (Changing triggers verification)
                  </span>
                )}
              </label>
              <input
                type="email"
                className={`w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-slate-900 ${
                  account?.emailVerification === false
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200"
                }`}
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                required
              />
              {account?.emailVerification === false && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-orange-600 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation"></i> Email
                    not verified.
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

            {/* Phone Number Input */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Phone Number
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                placeholder="61234567"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter your phone number (8-9 digits without country code).
              </p>
            </div>

            {profileMessage && (
              <p className="text-sm text-green-600 font-medium">
                {profileMessage}
              </p>
            )}
            {profileError && (
              <p className="text-sm text-red-600 font-medium">{profileError}</p>
            )}

            <button
              type="submit"
              disabled={!hasProfileChanges}
              className={`rounded-xl px-6 py-2 text-sm font-bold transition ${
                hasProfileChanges
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              Save Profile
            </button>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-slate-400"></i>
          Security & Password
        </h2>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Current Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              New Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              value={passwordForm.new}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
              required
            />
          </div>
          {passwordForm.confirm && !passwordsMatch && (
            <p className="text-xs text-red-600 font-medium">
              Passwords do not match
            </p>
          )}
          {passMessage && (
            <p className="text-sm text-green-600 font-medium">{passMessage}</p>
          )}
          {passError && (
            <p className="text-sm text-red-600 font-medium">{passError}</p>
          )}
          <button
            type="submit"
            disabled={!canUpdatePassword}
            className={`rounded-xl px-6 py-2 text-sm font-bold transition ${
              canUpdatePassword
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Session Management */}
      <SessionManager />
    </div>
  );
}
