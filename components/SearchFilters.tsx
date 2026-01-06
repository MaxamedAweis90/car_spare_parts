"use client";

import { useState, useMemo } from "react";
import { Select } from "antd";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCompatibilityOptions } from "@/hooks/queries/useCompatibilityOptions";

const { Option } = Select;

interface SearchFiltersProps {
  filters: {
    minPrice: number;
    maxPrice: number;
    onSale: boolean;
    make?: string;
    model?: string;
    year?: string;
    category?: string;
  };
  onFiltersChange: (filters: {
    minPrice: number;
    maxPrice: number;
    onSale: boolean;
    make?: string;
    model?: string;
    year?: string;
    category?: string;
  }) => void;
  onClose: () => void;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClose,
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: compatibilityOptions, isLoading: compatLoading } =
    useCompatibilityOptions();

  // Create flat hierarchy labels for a single dropdown
  const hierarchicalCategories = useMemo(() => {
    if (!categories) return [];

    return categories
      .filter((c) => c.type === "sellable" || !c.type) // Focus on final part categories
      .map((part) => {
        const names: string[] = [part.name];
        let current = part;
        while (current.parentCategoryId) {
          const parent = categories.find(
            (c) => c.id === current.parentCategoryId
          );
          if (parent) {
            names.unshift(parent.name);
            current = parent;
          } else {
            break;
          }
        }
        return {
          id: part.id,
          name: part.name,
          fullLabel: names.join(" > "),
        };
      })
      .sort((a, b) => a.fullLabel.localeCompare(b.fullLabel));
  }, [categories]);

  // Compatibility Memos
  const makes = useMemo(() => {
    if (!compatibilityOptions) return [];
    return Array.from(
      new Set(compatibilityOptions.map((o) => (o as any).make).filter(Boolean))
    ).sort();
  }, [compatibilityOptions]);

  const models = useMemo(() => {
    if (!compatibilityOptions || !localFilters.make) return [];
    return Array.from(
      new Set(
        compatibilityOptions
          .filter((o) => (o as any).make === localFilters.make)
          .map((o) => (o as any).model)
          .filter(Boolean)
      )
    ).sort();
  }, [compatibilityOptions, localFilters.make]);

  const years = useMemo(() => {
    if (!compatibilityOptions) return [];
    const allYears = new Set<string>();
    compatibilityOptions.forEach((o: any) => {
      if (o.yearFrom && o.yearTo) {
        for (let y = o.yearFrom; y <= o.yearTo; y++) {
          allYears.add(String(y));
        }
      }
    });
    return Array.from(allYears).sort((a, b) => Number(b) - Number(a));
  }, [compatibilityOptions]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      minPrice: 0,
      maxPrice: 1000,
      onSale: false,
      make: "",
      model: "",
      year: "",
      category: "",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="w-[calc(100vw-2rem)] max-w-80 rounded-[2rem] border border-(--color-border-strong) bg-(--color-surface) p-6 shadow-2xl backdrop-blur-xl sm:w-80">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-widest text-(--color-text)">
          Filters
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-bg) text-(--color-muted) hover:text-(--color-primary) transition-colors"
          aria-label="Close filters"
        >
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
      </div>

      {/* Single Hierarchical Category Dropdown */}
      <div className="mb-8">
        <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-(--color-muted)">
          Category
        </label>
        <Select
          showSearch
          allowClear
          placeholder="Filter by Part Category..."
          loading={catsLoading}
          value={localFilters.category || undefined}
          onChange={(val) =>
            setLocalFilters({ ...localFilters, category: val || "" })
          }
          className="w-full custom-antd-select"
          optionFilterProp="children"
        >
          {hierarchicalCategories.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.fullLabel}
            </Option>
          ))}
        </Select>
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-(--color-muted)">
          Price Range
        </label>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-(--color-muted)">
                $
              </span>
              <input
                type="number"
                value={localFilters.minPrice}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minPrice: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-(--color-border-strong) bg-(--color-bg) py-2.5 pl-7 pr-3 text-sm font-bold text-(--color-text) focus:border-(--color-primary) focus:outline-none focus:ring-4 focus:ring-(--color-primary-light)"
                placeholder="From"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-(--color-muted)">
                $
              </span>
              <input
                type="number"
                value={localFilters.maxPrice}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxPrice: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-(--color-border-strong) bg-(--color-bg) py-2.5 pl-7 pr-3 text-sm font-bold text-(--color-text) focus:border-(--color-primary) focus:outline-none focus:ring-4 focus:ring-(--color-primary-light)"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compatibility */}
      <div className="mb-8 space-y-4">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-(--color-muted)">
          Vehicle Compatibility
        </label>

        <div className="grid gap-3">
          <Select
            showSearch
            allowClear
            placeholder="Select Make"
            loading={compatLoading}
            value={localFilters.make || undefined}
            onChange={(val) =>
              setLocalFilters({ ...localFilters, make: val || "", model: "" })
            }
            className="w-full custom-antd-select"
            optionFilterProp="children"
          >
            {makes.map((m) => (
              <Option key={m} value={m}>
                {m}
              </Option>
            ))}
          </Select>

          <Select
            showSearch
            allowClear
            placeholder="Select Model"
            disabled={!localFilters.make}
            value={localFilters.model || undefined}
            onChange={(val) =>
              setLocalFilters({ ...localFilters, model: val || "" })
            }
            className="w-full custom-antd-select"
            optionFilterProp="children"
          >
            {models.map((m) => (
              <Option key={m} value={m}>
                {m}
              </Option>
            ))}
          </Select>

          <Select
            showSearch
            allowClear
            placeholder="Select Year"
            value={localFilters.year || undefined}
            onChange={(val) =>
              setLocalFilters({ ...localFilters, year: val || "" })
            }
            className="w-full custom-antd-select"
            optionFilterProp="children"
          >
            {years.map((y) => (
              <Option key={y} value={y}>
                {y}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* On Sale */}
      <div className="mb-8">
        <label className="flex cursor-pointer items-center justify-between group">
          <span className="text-sm font-black uppercase tracking-wider text-(--color-text) group-hover:text-(--color-primary) transition-colors">
            On Sale Only
          </span>
          <div
            onClick={() =>
              setLocalFilters({ ...localFilters, onSale: !localFilters.onSale })
            }
            className={`relative h-6 w-11 rounded-full p-1 transition-all duration-300 ${
              localFilters.onSale
                ? "bg-(--color-primary)"
                : "bg-(--color-border-strong)"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                localFilters.onSale ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-xl border border-(--color-border-strong) bg-(--color-bg) py-3 text-xs font-black uppercase tracking-[0.2em] text-(--color-muted) hover:bg-(--color-surface) transition-all"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-xl bg-(--color-primary) py-3 text-xs font-black uppercase tracking-[0.2em] text-white hover:brightness-110 shadow-lg shadow-(--color-primary-light) transition-all active:scale-95"
        >
          Apply
        </button>
      </div>

      <style jsx global>{`
        .custom-antd-select .ant-select-selector {
          border-radius: 12px !important;
          border-color: var(--color-border-strong) !important;
          background-color: var(--color-bg) !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
          font-weight: 700 !important;
          color: var(--color-text) !important;
          padding-left: 12px !important;
        }
        .custom-antd-select .ant-select-selection-placeholder {
          color: var(--color-muted) !important;
          font-weight: 600 !important;
        }
        .custom-antd-select .ant-select-item-option-content {
          font-size: 13px !important;
          font-weight: 500 !important;
        }
        .custom-antd-select .ant-select-selection-item {
          font-size: 13px !important;
          font-weight: 700 !important;
        }
      `}</style>
    </div>
  );
}
