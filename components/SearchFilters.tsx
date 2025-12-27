"use client";

import { useState } from "react";

interface SearchFiltersProps {
  filters: {
    minPrice: number;
    maxPrice: number;
    onSale: boolean;
  };
  onFiltersChange: (filters: {
    minPrice: number;
    maxPrice: number;
    onSale: boolean;
  }) => void;
  onClose: () => void;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClose,
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = { minPrice: 0, maxPrice: 1000, onSale: false };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Filters</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close filters"
        >
          <i className="fa-solid fa-xmark text-lg" aria-hidden />
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-700">
          Price Range
        </label>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              From
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                £
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
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                min="0"
                max={localFilters.maxPrice}
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              To
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                £
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
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                min={localFilters.minPrice}
              />
            </div>
          </div>
        </div>

        {/* Dual Range Slider */}
        <div className="relative h-2">
          <div className="absolute inset-0 rounded-full bg-slate-200" />
          <div
            className="absolute h-full rounded-full bg-orange-500"
            style={{
              left: `${(localFilters.minPrice / 1000) * 100}%`,
              right: `${100 - (localFilters.maxPrice / 1000) * 100}%`,
            }}
          />
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={localFilters.minPrice}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                minPrice: Math.min(
                  Number(e.target.value),
                  localFilters.maxPrice - 10
                ),
              })
            }
            className="pointer-events-none absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={localFilters.maxPrice}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                maxPrice: Math.max(
                  Number(e.target.value),
                  localFilters.minPrice + 10
                ),
              })
            }
            className="pointer-events-none absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110"
          />
        </div>
      </div>

      {/* On Sale Toggle */}
      <div className="mb-6">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-bold text-slate-900">On Sale Only</span>
          <button
            type="button"
            role="switch"
            aria-checked={localFilters.onSale}
            onClick={() =>
              setLocalFilters({ ...localFilters, onSale: !localFilters.onSale })
            }
            className={`relative h-6 w-11 rounded-full transition ${
              localFilters.onSale ? "bg-orange-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                localFilters.onSale ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
