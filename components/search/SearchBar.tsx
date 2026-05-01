"use client";

import { usePlateSearch } from "@/hooks/usePlateSearch";
import { PlateBadge } from "@/components/ui/PlateBadge";
import { Badge } from "@/components/ui/Badge";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function SearchBar() {
  const { locale } = useI18n();
  const {
    plateInput, setPlateInput, error, setError,
    normalized, preview, isValid, onSubmit
  } = usePlateSearch();

  return (
    <div className="mt-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            id="plate"
            value={plateInput}
            onChange={(e) => { setPlateInput(e.target.value); if (error) setError(null); }}
            placeholder="e.g. 16-RSL-9"
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 font-display text-base font-semibold uppercase tracking-[0.08em] text-slate-900 shadow-sm outline-none placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            autoComplete="off"
            maxLength={8}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-brand-sm transition-all hover:bg-brand-700 hover:shadow-brand focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-1"
          >
            <Search className="h-4 w-4" />
            {locale === "nl" ? "Zoeken" : "Search"}
          </button>
        </div>
      </form>

      {plateInput.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-slate-400">Preview:</span>
          <PlateBadge plate={preview || "-- -- --"} size="sm" />
          {normalized.length > 0 && (
            <Badge variant={isValid ? "success" : "warning"} dot>
              {isValid
                ? locale === "nl"
                  ? "Geldig formaat"
                  : "Valid format"
                : locale === "nl"
                ? "Onvolledig"
                : "Incomplete"}
            </Badge>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
