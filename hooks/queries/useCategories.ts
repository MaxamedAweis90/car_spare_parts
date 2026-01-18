import { useQuery } from "@tanstack/react-query";
import { useCatalogStore } from "../stores/useCatalogStore";

interface Category {
  id: string;
  name: string;
  label?: string;
  slug?: string;
}

export function useCategories() {
  const fetchCategories = useCatalogStore((state) => state.fetchCategories);
  const categories = useCatalogStore((state) => state.categories);

  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
    initialData: categories.length > 0 ? categories : undefined,
  });
}

