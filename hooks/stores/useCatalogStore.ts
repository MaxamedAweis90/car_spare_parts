"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Category {
  id: string;
  name: string;
  parentCategoryId: string | null;
  type: string | null;
}

interface CompatibilityOption {
  id: string;
  label: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
}

interface CatalogState {
  categories: Category[];
  compatibilityOptions: CompatibilityOption[];
  categoriesLoadedAt: number | null;
  compatOptionsLoadedAt: number | null;
  isLoadingCategories: boolean;
  isLoadingCompatOptions: boolean;

  fetchCategories: (force?: boolean) => Promise<Category[]>;
  fetchCompatibilityOptions: (
    force?: boolean
  ) => Promise<CompatibilityOption[]>;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categories: [],
      compatibilityOptions: [],
      categoriesLoadedAt: null,
      compatOptionsLoadedAt: null,
      isLoadingCategories: false,
      isLoadingCompatOptions: false,

      fetchCategories: async (force = false) => {
        const { categories, categoriesLoadedAt, isLoadingCategories } = get();

        if (
          !force &&
          categories.length > 0 &&
          categoriesLoadedAt &&
          Date.now() - categoriesLoadedAt < CACHE_TTL
        ) {
          return categories;
        }

        if (isLoadingCategories) return categories;

        set({ isLoadingCategories: true });
        try {
          const res = await fetch("/api/categories");
          if (!res.ok) throw new Error("Failed to fetch categories");
          const data = await res.json();
          const items = data.items as Category[];

          set({
            categories: items,
            categoriesLoadedAt: Date.now(),
            isLoadingCategories: false,
          });
          return items;
        } catch (error) {
          console.error("CatalogStore: Error fetching categories", error);
          set({ isLoadingCategories: false });
          return categories;
        }
      },

      fetchCompatibilityOptions: async (force = false) => {
        const {
          compatibilityOptions,
          compatOptionsLoadedAt,
          isLoadingCompatOptions,
        } = get();

        if (
          !force &&
          compatibilityOptions.length > 0 &&
          compatOptionsLoadedAt &&
          Date.now() - compatOptionsLoadedAt < CACHE_TTL
        ) {
          return compatibilityOptions;
        }

        if (isLoadingCompatOptions) return compatibilityOptions;

        set({ isLoadingCompatOptions: true });
        try {
          const res = await fetch("/api/compatibility-options");
          if (!res.ok) throw new Error("Failed to fetch compatibility options");
          const data = await res.json();
          const items = data.items as CompatibilityOption[];

          set({
            compatibilityOptions: items,
            compatOptionsLoadedAt: Date.now(),
            isLoadingCompatOptions: false,
          });
          return items;
        } catch (error) {
          console.error(
            "CatalogStore: Error fetching compatibility options",
            error
          );
          set({ isLoadingCompatOptions: false });
          return compatibilityOptions;
        }
      },
    }),
    {
      name: "spareparts-catalog-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        compatibilityOptions: state.compatibilityOptions,
        categoriesLoadedAt: state.categoriesLoadedAt,
        compatOptionsLoadedAt: state.compatOptionsLoadedAt,
      }),
    }
  )
);

