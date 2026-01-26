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
import { useSellerStore } from "@/lib/providers/SellerStoreProvider";
import Button from "@/components/ui/Button";
import SessionManager from "@/components/features/auth/SessionManager";

import { slugify } from "@/lib/utils/slugify";

type FeedbackState = { type: "success" | "error"; message: string } | null;
type SlugStatus = "idle" | "checking" | "available" | "taken";

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
    storeSlug: "",
    storeDescription: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
  });
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);

  // Onboarding state
  const [currentStep, setCurrentStep] = useState(1);
  const isOnboarding = store && !store.isOnboarded;

  useEffect(() => {
    if (!store) return;
    setForm({
      storeName: store.storeName,
      storeSlug: store.storeSlug,
      storeDescription: store.storeDescription,
      contactEmail: store.contactEmail || "",
      contactPhone: store.contactPhone || "",
      isActive: store.isActive,
    });
  }, [store]);

  // Slug selection/generation effect
  useEffect(() => {
    if (!form.storeSlug || form.storeSlug === store?.storeSlug) {
      setSlugStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const res = await fetch(
          `/api/seller/store/exists?slug=${form.storeSlug}&excludeStoreId=${store?.id}`,
        );
        const data = await res.json();
        setSlugStatus(data.exists ? "taken" : "available");
      } catch (err) {
        console.error("Failed to check slug availability", err);
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.storeSlug, store?.id, store?.storeSlug]);

  useEffect(() => {
    if (error) {
      setFeedback({ type: "error", message: error });
    }
  }, [error]);

  const handleReset = useCallback(() => {
    if (!store) return;
    setForm({
      storeName: store.storeName,
      storeSlug: store.storeSlug,
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
    setSlugStatus("idle");
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
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        // If name changes, auto-suggest a slug
        if (key === "storeName") {
          next.storeSlug = slugify(value);
        }
        return next;
      });
    };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!store) return;

    if (isOnboarding && currentStep < 3) {
      handleNext();
      return;
    }

    if (slugStatus === "taken") {
      setFeedback({
        type: "error",
        message: "This store slug is already taken",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await saveStore({
        storeName: form.storeName,
        storeSlug: form.storeSlug,
        storeDescription: form.storeDescription,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        isActive: form.isActive,
        isOnboarded: true, // Mark as onboarded on save (or final step)
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
      setFeedback({
        type: "success",
        message: "Store settings saved successfully!",
      });
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
    [store?.storeName],
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

  return (
    <div className="min-h-screen bg-[#f4f1e9] py-6 sm:py-8 lg:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {isOnboarding && (
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-12 rounded-full transition-all duration-500 ${
                    step <= currentStep ? "bg-slate-900" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Step {currentStep} of 3
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#ece8de] bg-white/85 p-6 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-8"
        >
          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {isOnboarding ? "First-time setup" : "Store Management"}
              </span>
              <h1 className="text-2xl font-black text-slate-900 sm:text-4xl">
                {isOnboarding
                  ? currentStep === 1
                    ? "Let's name your store"
                    : currentStep === 2
                      ? "Add some personality"
                      : "Final details"
                  : "Store settings"}
              </h1>
              <p className="text-sm font-medium text-slate-600 sm:text-lg">
                {isOnboarding
                  ? "Follow these quick steps to get your shop ready for customers."
                  : "Keep your store details polished so buyers immediately recognize your brand."}
              </p>
            </header>

            {/* STEP 1: IDENTITY */}
            {(!isOnboarding || currentStep === 1) && (
              <section className="flex flex-col gap-8 transition-all animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      Store name
                    </span>
                    <input
                      type="text"
                      value={form.storeName}
                      onChange={handleFieldChange("storeName")}
                      required
                      placeholder="AutoPro Parts"
                      className="h-14 rounded-2xl border border-[#e4ddcf] bg-white px-5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1f2937] focus:outline-none focus:ring-4 focus:ring-[#1f2937]/5"
                    />
                  </label>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      Store slug
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.storeSlug}
                        onChange={handleFieldChange("storeSlug")}
                        placeholder="your-store-slug"
                        className={`h-14 w-full rounded-2xl border bg-white pl-22 pr-5 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                          slugStatus === "taken"
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/5 text-rose-900"
                            : slugStatus === "available"
                              ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/5 text-emerald-900"
                              : "border-[#e4ddcf] focus:border-[#1f2937] focus:ring-[#1f2937]/5 text-slate-900"
                        }`}
                      />
                      <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        /stores/
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {slugStatus === "checking" && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                        )}
                        {slugStatus === "available" && (
                          <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Available
                          </span>
                        )}
                        {slugStatus === "taken" && (
                          <span className="text-rose-500 text-xs font-bold uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            Taken
                          </span>
                        )}
                      </div>
                    </div>
                    {slugStatus === "taken" && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight px-1">
                        Please try a different name or edit the slug manually.
                      </p>
                    )}
                  </div>

                  <label className="md:col-span-2 flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      Description
                    </span>
                    <textarea
                      value={form.storeDescription}
                      onChange={handleFieldChange("storeDescription")}
                      placeholder="Tell shoppers what you specialize in, shipping guarantees, or warranties."
                      rows={4}
                      className="min-h-32 rounded-2xl border border-[#e4ddcf] bg-white px-5 py-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1f2937] focus:outline-none focus:ring-4 focus:ring-[#1f2937]/5"
                    />
                  </label>
                </div>
              </section>
            )}

            {/* STEP 2: VISUALS */}
            {(!isOnboarding || currentStep === 2) && (
              <section className="flex flex-col gap-8 transition-all animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="relative h-28 w-28 overflow-hidden rounded-3xl bg-[#1f2937] text-2xl font-bold text-white shadow-inner sm:h-32 sm:w-32 sm:text-3xl">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Store avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      Store Logo
                    </h3>
                    <p className="text-sm font-medium text-slate-600">
                      This appears on search results and your product pages.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAvatarButtonClick}
                        disabled={saving}
                      >
                        Upload logo
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-3xl border border-[#ece8de] bg-slate-50/40 p-6">
                  <div className="mb-2 space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      Store banner
                    </h3>
                    <p className="text-sm font-medium text-slate-600">
                      Upload a wide banner that appears at the top of your
                      public storefront.
                    </p>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[#d8d1c4] bg-white group cursor-pointer"
                    onClick={handleBannerButtonClick}
                  >
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt="Store banner"
                        className="h-40 w-full object-cover sm:h-52"
                      />
                    ) : (
                      <div className="flex h-40 w-full flex-col items-center justify-center gap-1 text-center text-sm font-semibold text-slate-400 sm:h-52">
                        <span className="text-2xl">🖼️</span>
                        <span>Click to upload banner</span>
                      </div>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3: CONTACT & VISIBILITY */}
            {(!isOnboarding || currentStep === 3) && (
              <section className="flex flex-col gap-8 transition-all animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      Contact email
                    </span>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={handleFieldChange("contactEmail")}
                      placeholder="seller@store.com"
                      className="h-14 rounded-2xl border border-[#e4ddcf] bg-white px-5 text-base font-medium text-slate-900 focus:border-[#1f2937] focus:outline-none focus:ring-4 focus:ring-[#1f2937]/5"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      Contact phone
                    </span>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={handleFieldChange("contactPhone")}
                      placeholder="+1 555 123 4567"
                      className="h-14 rounded-2xl border border-[#e4ddcf] bg-white px-5 text-base font-medium text-slate-900 focus:border-[#1f2937] focus:outline-none focus:ring-4 focus:ring-[#1f2937]/5"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-[#ece8de] bg-slate-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-base font-bold text-slate-800">
                        {form.isActive ? "Store is Active" : "Store is Hidden"}
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        {form.isActive
                          ? "Customers can find your store and products."
                          : "Your store will be hidden from search results."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleVisibility}
                      className={`relative inline-flex h-10 w-18 items-center rounded-full transition-all duration-300 ${
                        form.isActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                          form.isActive ? "translate-x-9" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#ece8de] pt-8">
              {!isOnboarding ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Live at:{" "}
                    <span className="text-slate-900">
                      /stores/{form.storeSlug}
                    </span>
                  </p>
                  <div className="flex gap-3">
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
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    disabled={currentStep === 1 || saving}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    className="w-full sm:w-auto"
                  >
                    {currentStep === 3 ? "Complete setup" : "Next step"}
                  </Button>
                </>
              )}
            </div>
            {/* Session Management */}
            {!isOnboarding && (
              <div className="mt-8 pt-8 border-t border-[#ece8de]">
                <SessionManager />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
