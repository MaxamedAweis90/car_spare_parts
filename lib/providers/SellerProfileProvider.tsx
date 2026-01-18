"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SellerProfile = {
  $id: string;
  $updatedAt?: string;
  name?: string;
  email?: string;
  avatarId?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
};

type SellerProfileContextValue = {
  profile: SellerProfile | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<SellerProfile | null>;
  setProfileState: (value: SellerProfile | null) => void;
};

const SellerProfileContext = createContext<
  SellerProfileContextValue | undefined
>(undefined);

const CACHE_KEY = "seller-profile-cache";

type CachedProfile = {
  profile: SellerProfile | null;
  savedAt: number;
};

function readCachedProfile(): CachedProfile | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedProfile;
  } catch (error) {
    console.warn("Failed to read cached seller profile", error);
    return null;
  }
}

function writeCachedProfile(profile: SellerProfile | null) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: CachedProfile = { profile, savedAt: Date.now() };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to cache seller profile", error);
  }
}

export function SellerProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const profileRef = useRef<SellerProfile | null>(null);

  const load = useCallback(async (force = false) => {
    if (loadedRef.current && !force) {
      return profileRef.current;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller/profile", {
        cache: "no-store",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Failed to load profile");
      }
      const nextProfile = (body?.profile ?? null) as SellerProfile | null;
      setProfile(nextProfile);
      profileRef.current = nextProfile;
      writeCachedProfile(nextProfile);
      loadedRef.current = true;
      return nextProfile;
    } catch (err: any) {
      const message = err?.message || "Failed to load profile";
      setError(message);
      setProfile(null);
      profileRef.current = null;
      writeCachedProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cached = readCachedProfile();
    if (cached?.profile) {
      setProfile(cached.profile);
      profileRef.current = cached.profile;
      setLoading(false);
      loadedRef.current = true;
    } else {
      void load(true);
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === CACHE_KEY &&
        event.storageArea === window.sessionStorage
      ) {
        const next = readCachedProfile();
        setProfile(next?.profile ?? null);
        profileRef.current = next?.profile ?? null;
      }
    };

    const handleSessionChanged = () => {
      void load(true);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("session-changed", handleSessionChanged);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("session-changed", handleSessionChanged);
    };
  }, [load]);

  const setProfileState = useCallback((value: SellerProfile | null) => {
    setProfile(value);
    profileRef.current = value;
    writeCachedProfile(value);
    loadedRef.current = true;
  }, []);

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      refresh: (force = true) => load(force),
      setProfileState,
    }),
    [profile, loading, error, load, setProfileState]
  );

  return (
    <SellerProfileContext.Provider value={value}>
      {children}
    </SellerProfileContext.Provider>
  );
}

export function useSellerProfile() {
  const context = useContext(SellerProfileContext);
  if (!context) {
    throw new Error(
      "useSellerProfile must be used within a SellerProfileProvider"
    );
  }
  return context;
}

