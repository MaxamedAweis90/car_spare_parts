"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SellerStorePayload, SellerStoreResponse } from "@/lib/types/seller-store";
import { createSellerStore, getSellerStore, updateSellerStore, updateSellerStoreAvatar, updateSellerStoreBanner } from "@/services/store";

type SellerStoreContextValue = {
  store: SellerStoreResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<SellerStoreResponse | null>;
  saveStore: (payload: SellerStorePayload) => Promise<SellerStoreResponse>;
  uploadAvatar: (file: File) => Promise<SellerStoreResponse>;
  uploadBanner: (file: File) => Promise<SellerStoreResponse>;
  setStoreState: (value: SellerStoreResponse | null) => void;
};

const SellerStoreContext = createContext<SellerStoreContextValue | undefined>(undefined);

export function SellerStoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<SellerStoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
      return nextStore;
    } catch (err: any) {
      const message = err?.message || "Failed to load store";
      setError(message);
      setStore(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStore = useCallback(async (payload: SellerStorePayload) => {
    const { store: updated } = await updateSellerStore(payload);
    setStore(updated);
    return updated;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const { store: updated } = await updateSellerStoreAvatar(file);
    setStore(updated);
    return updated;
  }, []);

  const uploadBanner = useCallback(async (file: File) => {
    const { store: updated } = await updateSellerStoreBanner(file);
    setStore(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      store,
      loading,
      error,
      refresh: load,
      saveStore,
      uploadAvatar,
      uploadBanner,
      setStoreState: setStore,
    }),
    [store, loading, error, load, saveStore, uploadAvatar, uploadBanner]
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
