"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { SellerStorePayload, SellerStoreResponse } from "@/lib/types/seller-store";
import { createSellerStore, getSellerStore, updateSellerStore, updateSellerStoreAvatar, updateSellerStoreBanner } from "@/services/store";

type SellerStoreContextValue = {
  store: SellerStoreResponse | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<SellerStoreResponse | null>;
  saveStore: (payload: SellerStorePayload) => Promise<SellerStoreResponse>;
  uploadAvatar: (file: File) => Promise<SellerStoreResponse>;
  uploadBanner: (file: File) => Promise<SellerStoreResponse>;
  setStoreState: (value: SellerStoreResponse | null) => void;
};

const SellerStoreContext = createContext<SellerStoreContextValue | undefined>(undefined);

const CACHE_KEY = "seller-store-cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedStore = {
  store: SellerStoreResponse | null;
  savedAt: number;
};

function readCachedStore(): CachedStore | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedStore;
  } catch (error) {
    console.warn("Failed to read cached seller store", error);
    return null;
  }
}

function writeCachedStore(store: SellerStoreResponse | null) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: CachedStore = { store, savedAt: Date.now() };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to cache seller store", error);
  }
}

function isCacheExpired(savedAt: number) {
  return Date.now() - savedAt > CACHE_TTL_MS;
}

export function SellerStoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<SellerStoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedRef = useRef<number | null>(null);
  const storeRef = useRef<SellerStoreResponse | null>(null);

  const load = useCallback(async (force = false) => {
    const cachedStore = storeRef.current;
    const lastFetched = lastFetchedRef.current;
    if (!force && cachedStore && lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
      setLoading(false);
      setError(null);
      return cachedStore;
    }

    if (!cachedStore) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getSellerStore();
      let nextStore: SellerStoreResponse | null = null;
      if (res.status === 404) {
        const created = await createSellerStore();
        nextStore = created.store;
      } else {
        const body = await res.json();
        nextStore = (body?.store || null) as SellerStoreResponse | null;
      }
      setStore(nextStore);
      storeRef.current = nextStore;
      lastFetchedRef.current = Date.now();
      writeCachedStore(nextStore);
      return nextStore;
    } catch (err: any) {
      const message = err?.message || "Failed to load store";
      setError(message);
      setStore(null);
      storeRef.current = null;
      lastFetchedRef.current = null;
      writeCachedStore(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cached = readCachedStore();
    if (cached?.store) {
      setStore(cached.store);
      storeRef.current = cached.store;
      lastFetchedRef.current = cached.savedAt;
      setLoading(false);
      if (isCacheExpired(cached.savedAt)) {
        void load(true);
      }
    } else {
      void load(true);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CACHE_KEY && event.storageArea === window.sessionStorage) {
        const next = readCachedStore();
        setStore(next?.store ?? null);
        storeRef.current = next?.store ?? null;
        lastFetchedRef.current = next?.savedAt ?? null;
        if (next?.store) {
          setLoading(false);
          setError(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [load]);

  const saveStore = useCallback(async (payload: SellerStorePayload) => {
    const { store: updated } = await updateSellerStore(payload);
    setStore(updated);
    storeRef.current = updated;
    lastFetchedRef.current = Date.now();
    writeCachedStore(updated);
    setError(null);
    return updated;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const { store: updated } = await updateSellerStoreAvatar(file);
    setStore(updated);
    storeRef.current = updated;
    lastFetchedRef.current = Date.now();
    writeCachedStore(updated);
    setError(null);
    return updated;
  }, []);

  const uploadBanner = useCallback(async (file: File) => {
    const { store: updated } = await updateSellerStoreBanner(file);
    setStore(updated);
    storeRef.current = updated;
    lastFetchedRef.current = Date.now();
    writeCachedStore(updated);
    setError(null);
    return updated;
  }, []);

  const setStoreState = useCallback((value: SellerStoreResponse | null) => {
    setStore(value);
    storeRef.current = value;
    lastFetchedRef.current = value ? Date.now() : null;
    writeCachedStore(value);
    if (value) {
      setError(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      store,
      loading,
      error,
      refresh: (force = true) => load(force),
      saveStore,
      uploadAvatar,
      uploadBanner,
      setStoreState,
    }),
    [store, loading, error, load, saveStore, uploadAvatar, uploadBanner, setStoreState]
  );

  return <SellerStoreContext.Provider value={value}>{children}</SellerStoreContext.Provider>;
}

export function useSellerStore() {
  const context = useContext(SellerStoreContext);
  if (!context) {
    throw new Error("useSellerStore must be used within a SellerStoreProvider");
  }
  return context;
}
