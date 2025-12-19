"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/useSession";
import Button from "@/components/Button";

export default function AccountPage() {
  const router = useRouter();
  const { authenticated, profile, loading } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const initials = useMemo(() => {
    const name: string = profile?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const two = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
    return two || "A";
  }, [profile?.name]);

  const avatarUrl: string | null = profile?.avatarUrl || null;

  const initialForm = useMemo(
    () => ({
      name: (profile?.name as string | undefined) || "",
      phone: profile?.phone === null || profile?.phone === undefined ? "" : String(profile.phone),
    }),
    [profile?.name, profile?.phone]
  );

  useEffect(() => {
    setName(initialForm.name);
    setPhone(initialForm.phone);
  }, [initialForm.name, initialForm.phone]);

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
    (name.trim() !== initialForm.name.trim()) ||
    (phone.trim() !== initialForm.phone.trim());

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

    try {
      const payload: { name?: string; phone?: string } = {};
      if (name.trim() !== initialForm.name.trim()) payload.name = name;
      if (phone.trim() !== initialForm.phone.trim()) payload.phone = phone;

      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update profile");
      }

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
    setFile(null);
    setName(initialForm.name);
    setPhone(initialForm.phone);
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
        <p className="mt-2 text-sm text-slate-700">Please sign in to manage your account.</p>
        <div className="mt-4">
          <Link href="/auth/login" className="inline-flex">
            <Button variant="primary" rounded="full">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.role !== "customer") {
    return (
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 py-10">
        <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>
        <p className="mt-2 text-sm text-slate-700">This page is available for customer accounts.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 py-10">
      <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-slate-700">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">{profile?.name || "Account"}</div>
            <div className="truncate text-xs font-semibold text-slate-600">{profile?.email}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-900">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900">Phone / Contact</label>
            <input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-black/10 focus:ring-2"
              placeholder="Phone number"
            />
          </div>
        </div>

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
          <label className="block text-sm font-bold text-slate-900">Update avatar</label>
          <p className="mt-1 text-xs font-semibold text-slate-600">Choose an image file to use as your account avatar.</p>

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
              Selected: <span className="font-bold text-slate-800">{file.name}</span>
            </div>
          )}

          {error && <div className="mt-3 text-sm font-semibold text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
