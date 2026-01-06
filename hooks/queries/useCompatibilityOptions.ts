import { useQuery } from "@tanstack/react-query";
import { useCatalogStore } from "../stores/useCatalogStore";

interface CompatibilityOption {
  id: string;
  label: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
}

export function useCompatibilityOptions() {
  const fetchOptions = useCatalogStore(
    (state) => state.fetchCompatibilityOptions
  );
  const options = useCatalogStore((state) => state.compatibilityOptions);

  return useQuery({
    queryKey: ["compatibilityOptions"],
    queryFn: () => fetchOptions(),
    staleTime: 1000 * 60 * 60, // 1 hour
    initialData: options.length > 0 ? options : undefined,
  });
}
