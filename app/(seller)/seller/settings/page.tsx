"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { getImageUrl } from "@/lib/appwrite/storage";
import { useSellerStore } from "@/lib/SellerStoreProvider";
import Button from "@/components/Button";

type FeedbackState = { type: "success" | "error"; message: string } | null;

function StoreSettingsSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f1e9] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse rounded-3xl border border-[#ece8de] bg-white/70 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <div className="h-6 w-40 rounded-full bg-slate-200/80" />
              <div className="h-4 w-64 rounded-full bg-slate-200/60" />
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-slate-200" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 rounded-full bg-slate-200/70" />
                  <div className="h-3 w-48 rounded-full bg-slate-200/60" />
                  <div className="h-8 w-36 rounded-full bg-slate-200/70" />
                </div>
              </div>
              <div className="h-10 w-48 rounded-full bg-slate-200/70" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-28 rounded-full bg-slate-200/70" />
                <div className="h-12 rounded-2xl bg-slate-200/60" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 rounded-full bg-slate-200/70" />
                <div className="h-12 rounded-2xl bg-slate-200/60" />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <div className="h-4 w-44 rounded-full bg-slate-200/70" />
                <div className="h-28 rounded-2xl bg-slate-200/60" />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <div className="h-10 w-28 rounded-full bg-slate-200/70" />
              <div className="h-10 w-36 rounded-full bg-slate-200/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreSettingsPage() {
  const { store, loading, error, saveStore, uploadAvatar, uploadBanner } =
    useSellerStore();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [form, setForm] = useState({
    storeName: "",
    storeDescription: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);

  useEffect(() => {
    if (!store) return;
    setForm({
      storeName: store.storeName,
      storeDescription: store.storeDescription,
      contactEmail: store.contactEmail || "",
      contactPhone: store.contactPhone || "",
      isActive: store.isActive,
    });
  }, [store]);

  useEffect(() => {
    if (error) {
      setFeedback({ type: "error", message: error });
    }
  }, [error]);

  const handleReset = useCallback(() => {
    if (!store) return;
    setForm({
      storeName: store.storeName,
      storeDescription: store.storeDescription,
      contactEmail: store.contactEmail || "",
      contactPhone: store.contactPhone || "",
      isActive: store.isActive,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
    setAvatarPreview(null);
    setBannerPreview(null);
    setPendingAvatarFile(null);
    setPendingBannerFile(null);
    setFeedback(null);
  }, [store]);

  const avatarUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    if (store?.storeAvatarId) {
      try {
        return getImageUrl("storeAvatars", store.storeAvatarId);
      } catch {
        return null;
      }
    }
    return null;
  }, [avatarPreview, store?.storeAvatarId]);

  const bannerUrl = useMemo(() => {
    if (bannerPreview) return bannerPreview;
    if (store?.storeBannerId) {
      try {
        return getImageUrl("storeBanners", store.storeBannerId);
      } catch {
        return null;
      }
    }
    return null;
  }, [bannerPreview, store?.storeBannerId]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (bannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [avatarPreview, bannerPreview]);

  const handleFieldChange =
    (key: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!store) return;

    setSaving(true);
    setFeedback(null);

    try {
      await saveStore({
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        isActive: form.isActive,
      });
      if (pendingAvatarFile) {
        try {
          await uploadAvatar(pendingAvatarFile);
        } catch (error: any) {
          throw new Error(error?.message || "Failed to upload avatar");
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setPendingAvatarFile(null);
        setAvatarPreview(null);
      }
      if (pendingBannerFile) {
        try {
          await uploadBanner(pendingBannerFile);
        } catch (error: any) {
          throw new Error(error?.message || "Failed to upload banner");
        }
        if (bannerInputRef.current) {
          bannerInputRef.current.value = "";
        }
        setPendingBannerFile(null);
        setBannerPreview(null);
      }
      setFeedback({ type: "success", message: "Store settings saved" });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to save store",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !store) return;

    setFeedback(null);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setPendingAvatarFile(file);
    event.target.value = "";
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !store) return;

    setFeedback(null);
    const objectUrl = URL.createObjectURL(file);
    setBannerPreview(objectUrl);
    setPendingBannerFile(file);
    event.target.value = "";
  };

  const initials = useMemo(
    () => (store?.storeName || "Store").slice(0, 2).toUpperCase(),
    [store?.storeName]
  );

  const handleToggleVisibility = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleBannerButtonClick = () => {
    bannerInputRef.current?.click();
  };

  if (loading) {
    return <StoreSettingsSkeleton />;
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1e9] px-4">
        <div className="max-w-sm rounded-3xl border border-[#ece8de] bg-white/90 p-6 text-center shadow-lg shadow-black/5">
          <h2 className="text-lg font-bold text-slate-900">
            Unable to load store settings
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {error || "Please refresh the page or try again shortly."}
          </p>
        </div>
      </div>
    );
  }

  const storeSlug = store.storeSlug;

  return (
    <div className="min-h-screen bg-[#f4f1e9] py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#ece8de] bg-white/85 p-6 shadow-lg shadow-black/5 backdrop-blur-sm sm:p-8"
        >
          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Seller profile
              </span>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Store identity
              </h1>
              <p className="text-sm font-medium text-slate-600 sm:text-base">
                Keep your store details polished so buyers immediately recognize
                your brand.
              </p>
            </header>

            <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full items-start gap-4 md:w-auto">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-[#1f2937] text-xl font-bold text-white sm:h-24 sm:w-24 sm:text-2xl">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${store.storeName} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {storeSlug ? `stores/${storeSlug}` : "Store preview"}
                    </p>
                    <p className="text-xl font-extrabold text-slate-900">
                      {store.storeName}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Refresh your branding details to stay sharp and trustworthy
                    across the marketplace.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleAvatarButtonClick}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      Change avatar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      href={storeSlug ? `/stores/${storeSlug}` : undefined}
                      target="_blank"
                      disabled={!storeSlug}
                      className="w-full sm:w-auto"
                    >
                      View store
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                      PNG or JPG up to 2MB
                    </p>
                    {pendingAvatarFile && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">
                        New avatar applies after saving
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-[#ece8de] bg-slate-50/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Visibility
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleVisibility}
                    className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-200 ${
                      form.isActive ? "bg-[#1f2937]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition-all duration-200 ${
                        form.isActive ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                    <span className="sr-only">Toggle store visibility</span>
                  </button>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-700">
                      {form.isActive
                        ? "Visible to customers"
                        : "Hidden from customers"}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Control whether your store appears on the storefront.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-3xl border border-[#ece8de] bg-slate-50/40 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Store banner
                  </span>
                  <h2 className="text-lg font-black text-slate-900">
                    Hero showcase image
                  </h2>
                  <p className="text-sm font-medium text-slate-600">
                    Upload a wide banner that appears at the top of your public
                    storefront. Aim for a 16:4 ratio so it looks crisp on every
                    screen.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleBannerButtonClick}
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    Change banner
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-dashed border-[#d8d1c4] bg-white">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Store banner"
                    className="h-48 w-full object-cover sm:h-60"
                  />
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center gap-1 text-center text-sm font-semibold text-slate-400 sm:h-60">
                    <span>Recommended size 1600 × 400</span>
                    <span className="text-xs font-medium uppercase tracking-widest">
                      PNG or JPG up to 4MB
                    </span>
                  </div>
                )}
              </div>
              {pendingBannerFile && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">
                  New banner applies after saving
                </span>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </section>

            <hr className="border-t border-[#ece8de]" />

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Store name
                </span>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={handleFieldChange("storeName")}
                  required
                  placeholder="AutoPro Parts"
                  className="h-12 rounded-xl border border-[#e4ddcf] bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#1f2937]/10"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Contact email
                </span>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={handleFieldChange("contactEmail")}
                  placeholder="seller@store.com"
                  className="h-12 rounded-xl border border-[#e4ddcf] bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#1f2937]/10"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Contact phone
                </span>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={handleFieldChange("contactPhone")}
                  placeholder="+1 555 123 4567"
                  className="h-12 rounded-xl border border-[#e4ddcf] bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#1f2937]/10"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Description
                </span>
                <textarea
                  value={form.storeDescription}
                  onChange={handleFieldChange("storeDescription")}
                  placeholder="Tell shoppers what you specialize in, shipping guarantees, or warranties."
                  rows={5}
                  className="min-h-35 rounded-2xl border border-[#e4ddcf] bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#1f2937]/10"
                />
              </label>
            </section>

            <hr className="border-t border-[#ece8de]" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full sm:w-auto"
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={saving}
                className="w-full sm:w-auto"
              >
                Save changes
              </Button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Store URL:{" "}
              <span className="font-bold text-slate-800">
                /stores/{storeSlug}
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
