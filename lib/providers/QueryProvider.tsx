"use client";

import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, useEffect, ReactNode } from "react";

// Increase version to invalidate cache when deploying new features
const CACHE_VERSION = "v1.0.1";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data remains fresh for 5 minutes (no refetch)
            staleTime: 5 * 60 * 1000,
            // Cache persists in storage for 7 days
            gcTime: 7 * 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      }),
  );

  const [persister] = useState(() => {
    // Check if we are in the browser
    if (typeof window !== "undefined") {
      return createSyncStoragePersister({
        storage: window.localStorage,
      });
    }
    return undefined;
  });

  // Effect to handle manual cache clearing if needed (optional hook point)
  useEffect(() => {
    // Ensure we are client side
    if (
      typeof window !== "undefined" &&
      !window.localStorage.getItem("app_cache_version")
    ) {
      window.localStorage.setItem("app_cache_version", CACHE_VERSION);
    }
  }, []);

  if (!persister) {
    // Fallback for SSR - use standard provider without persistence capabilities
    // This allows useQueryClient() to work even if persistence isn't ready
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: createSyncStoragePersister({ storage: undefined }), // No-op persister
          // We can also just use QueryClientProvider here, but PersistQueryClientProvider is safer to keep hooks consistent
        }}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        buster: CACHE_VERSION, // Cache invalidation version
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
