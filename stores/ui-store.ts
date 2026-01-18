import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Specific for mobile or responsive
  mobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

      mobileSidebarOpen: false,
      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
    }),
    {
      name: "ui-storage",
    }
  )
);

interface FilterState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  category: string | null;
  setCategory: (category: string | null) => void;

  priceRange: [number, number] | null;
  setPriceRange: (range: [number, number] | null) => void;

  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      searchTerm: "",
      setSearchTerm: (term) => set({ searchTerm: term }),

      category: null,
      setCategory: (category) => set({ category: category }),

      priceRange: null,
      setPriceRange: (range) => set({ priceRange: range }),

      resetFilters: () =>
        set({ searchTerm: "", category: null, priceRange: null }),
    }),
    {
      name: "filter-storage",
    }
  )
);

