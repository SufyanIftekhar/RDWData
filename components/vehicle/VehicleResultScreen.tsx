"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PlateBadge } from "@/components/ui/PlateBadge";
import { MapPanel } from "@/components/vehicle/MapPanel";
import { InspectionTimeline } from "@/components/vehicle/InspectionTable";
import { RecallList } from "@/components/vehicle/RecallList";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { formatDisplayPlate } from "@/lib/rdw/normalize";
import type { VehicleProfile } from "@/lib/rdw/types";
import {
  ArrowLeft, RotateCcw, AlertCircle, CreditCard, RefreshCw,
  CheckCircle2, XCircle, Zap, Car, Gauge, Settings2, Weight,
  Fuel, Thermometer, Banknote, ClipboardList, AlertTriangle,
  MapPin, Layers, Clock, Hash, Shield, TrendingUp, Activity,
  Users, Calendar, Globe, BadgeAlert, Truck, Flag
} from "lucide-react";

type Props = { plate: string };
type Tab = "overview" | "history" | "safety" | "map";

// ─── Dutch colour → hex ──────────────────────────────────────────────────
const DUTCH_HEX: Record<string, string> = {
  BLAUW: "#3b82f6", GRIJS: "#94a3b8", ZWART: "#1e293b", WIT: "#e2e8f0",
  ROOD: "#ef4444", GROEN: "#22c55e", GEEL: "#eab308", ORANJE: "#f97316",
  ZILVER: "#cbd5e1", BEIGE: "#d4c5a9", BRUIN: "#92400e", PAARS: "#a855f7",
};
const colourHex = (n: string | null) => DUTCH_HEX[n?.toUpperCase() ?? ""] ?? "#94a3b8";
function fmtColour(n: string | null) {
  if (!n) return null;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

// ─── Skeleton ────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-6">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────
function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center
      transition-all hover:-translate-y-0.5 hover:shadow-md
      ${ok ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-full
        ${ok ? "bg-emerald-100" : "bg-red-100"}`}
      >
        {ok
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
          : <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2.5} />}
      </span>
      <span className={`text-[10px] font-black leading-tight uppercase tracking-wide
        ${ok ? "text-emerald-800" : "text-red-700"}`}
      >{label}</span>
    </div>
  );
}

function SpecRow({ label, value, highlight = false }: {
  label: string; value: string | null | undefined; highlight?: boolean
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5
      ${highlight ? "bg-brand-50 ring-1 ring-brand-100" : "bg-slate-50 hover:bg-slate-100 transition-colors"}`}
    >
      <span className="min-w-0 text-xs font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`text-right text-sm font-bold tabular-nums
        ${highlight ? "text-brand-700" : "text-slate-900"}`}
      >{value}</span>
    </div>
  );
}

function SpecCard({ label, value, Icon, highlight = false }: {
  label: string; value: string | null | undefined; Icon: React.ElementType; highlight?: boolean
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4
      transition-all hover:-translate-y-0.5 hover:shadow-md
      ${highlight
        ? "border-brand-100 bg-gradient-to-b from-brand-50 to-white"
        : "border-slate-100 bg-white hover:border-slate-200"}`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl
        ${highlight ? "bg-brand-100" : "bg-slate-100"}`}
      >
        <Icon className={`h-4 w-4 ${highlight ? "text-brand-600" : "text-slate-500"}`} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm font-black leading-tight ${highlight ? "text-brand-700" : "text-slate-900"}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{count}</span>
      )}
      <span className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────
function OverviewTab({ v }: { v: VehicleProfile["vehicle"] }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Powertrain */}
      <div>
        <SectionHead title="Powertrain" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <SpecCard label="Fuel type" value={v.fuelType} Icon={Fuel} />
          <SpecCard label="Displacement" value={v.engine?.displacement ? `${v.engine.displacement} cc` : null} Icon={Settings2} />
          <SpecCard label="Cylinders" value={v.engine?.cylinders?.toString()} Icon={Hash} />
          <SpecCard label="Max power" value={v.engine?.powerKw ? `${v.engine.powerKw} kW` : null} Icon={Zap} highlight />
          <SpecCard label="CO₂ emissions" value={v.co2 ? `${v.co2} g/km` : null} Icon={Thermometer} />
          <SpecCard label="Consumption" value={v.consumptionCombined ? `${v.consumptionCombined} L/100` : null} Icon={Gauge} />
          <SpecCard label="Energy label" value={v.energyLabel} Icon={Activity} highlight />
          <SpecCard label="Euro emission" value={v.emissionStandard} Icon={Thermometer} />
        </div>
      </div>

      {/* Body & Dimensions */}
      <div>
        <SectionHead title="Body & Dimensions" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <SpecCard label="Body type" value={v.bodyType} Icon={Car} />
          <SpecCard label="Doors" value={v.doors?.toString()} Icon={Car} />
          <SpecCard label="Seats" value={v.seats?.toString()} Icon={Car} />
          {v.axles && <SpecCard label="Axles" value={v.axles?.toString()} Icon={Truck} />}
          <SpecCard label="Kerb weight" value={v.weight?.empty ? `${v.weight.empty.toLocaleString("nl-NL")} kg` : null} Icon={Weight} />
          <SpecCard label="Max GVW" value={v.weight?.max ? `${v.weight.max.toLocaleString("nl-NL")} kg` : null} Icon={Weight} />
          {v.weight?.payload && <SpecCard label="Payload" value={`${v.weight.payload.toLocaleString("nl-NL")} kg`} Icon={Weight} />}
        </div>
      </div>

      {/* Registration & History */}
      <div>
        <SectionHead title="Registration & History" />
        <div className="space-y-1.5">
          <SpecRow label="First registered (NL)" value={v.firstRegistrationNL} />
          <SpecRow label="First registered (World)" value={v.firstRegistrationWorld} />
          <SpecRow label="APK valid until" value={v.apkExpiryDate} highlight />
          <SpecRow label="Registered owners" value={v.owners?.count !== null && v.owners?.count !== undefined ? String(v.owners.count) : null} />
          <SpecRow label="NAP verdict" value={v.napVerdict} />
          <SpecRow label="Last odometer year" value={v.napLastYear?.toString()} />
        </div>
      </div>

      {/* Financial */}
      <div>
        <SectionHead title="Financial" />
        <div className="space-y-1.5">
          <SpecRow label="Original catalogue price" value={v.cataloguePrice ? `€ ${v.cataloguePrice.toLocaleString("nl-NL")}` : null} highlight />
        </div>
      </div>

      {/* Flag status row */}
      <div>
        <SectionHead title="Status Flags" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: "WAM Insured", ok: v.insured, note: v.insured ? "Active" : "Unknown" },
            { label: "No open recall", ok: !v.hasOpenRecall, note: !v.hasOpenRecall ? "Clear" : "Check!" },
            { label: "Not a taxi", ok: !v.isTaxi, note: !v.isTaxi ? "Private" : "Taxi" },
            { label: "Transfer OK", ok: v.transferPossible, note: v.transferPossible ? "Allowed" : "Blocked" },
            { label: "No export flag", ok: !v.exportIndicator, note: !v.exportIndicator ? "NL registered" : "Exported" },
            { label: "No WOK block", ok: !v.wok, note: !v.wok ? "Clear" : "Blocked" },
          ].map(({ label, ok, note }) => (
            <div key={label} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3
              ${ok ? "border-emerald-100 bg-emerald-50/60" : "border-red-100 bg-red-50/60"}`}
            >
              {ok
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                : <XCircle className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2.5} />}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 leading-tight">{label}</p>
                <p className={`text-[11px] font-semibold ${ok ? "text-emerald-600" : "text-red-600"}`}>{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({ v, raw }: { v: VehicleProfile["vehicle"]; raw: VehicleProfile["raw"] }) {
  const colour = v.color?.primary ?? null;
  const colSec = v.color?.secondary ?? null;
  const colName = fmtColour(colour);
  const colSecName = colSec && colSec !== "Niet geregistreerd" ? fmtColour(colSec) : null;

  return (
    <div className="space-y-3">

      {/* Identity */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-sky-400" />
        <div className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</p>
          <h2 className="mt-1 font-display text-2xl font-black leading-none tracking-tight text-slate-900 sm:text-3xl">
            {v.brand ?? "—"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">{v.tradeName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {v.year && (
              <span className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-black text-white">{v.year}</span>
            )}
            {colName && (
              <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <span className="h-3 w-3 rounded-full border border-slate-300/50 shadow-sm" style={{ background: colourHex(colour) }} />
                {colName}
                {colSecName && <span className="text-slate-400">/ {colSecName}</span>}
              </span>
            )}
            {v.bodyType && (
              <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{v.bodyType}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick spec rows */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="space-y-1.5 p-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Engine</p>
          <SpecRow label="Fuel" value={v.fuelType} />
          <SpecRow label="Displacement" value={v.engine?.displacement ? `${v.engine.displacement} cc` : null} />
          <SpecRow label="Power" value={v.engine?.powerKw ? `${v.engine.powerKw} kW` : null} />
          <SpecRow label="Cylinders" value={v.engine?.cylinders?.toString()} />

          <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Registration</p>
          <SpecRow label="APK until" value={v.apkExpiryDate} highlight />
          <SpecRow label="First reg. (NL)" value={v.firstRegistrationNL} />
          <SpecRow label="First reg. (World)" value={v.firstRegistrationWorld} />
          <SpecRow label="Owners" value={v.owners?.count !== null && v.owners?.count !== undefined ? String(v.owners.count) : null} />

          <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Financial</p>
          <SpecRow label="List price" value={v.cataloguePrice ? `€ ${v.cataloguePrice.toLocaleString("nl-NL")}` : null} />
          <SpecRow label="NAP verdict" value={v.napVerdict} />
          <SpecRow label="Last odometer year" value={v.napLastYear?.toString()} />
        </div>
      </div>

      {/* Hybrid badge */}
      {raw.fuel.length > 1 && (
        <div className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100">
            <Zap className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-black text-sky-900">Hybrid Vehicle</p>
            <p className="text-[11px] text-sky-700">
              {raw.fuel.map((f) => String(f.brandstof_omschrijving ?? "")).filter(Boolean).join(" + ")}
            </p>
          </div>
        </div>
      )}

      {/* EU Body */}
      {raw.body.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">EU Body Class</p>
          </div>
          <div className="divide-y divide-slate-50 px-4 pb-3">
            {raw.body.slice(0, 3).map((b, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <span className="rounded-lg bg-brand-50 px-2 py-0.5 font-mono text-xs font-black text-brand-700">
                  {String(b.carrosserietype ?? "—")}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {String(b.type_carrosserie_europese_omschrijving ?? "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────
export function VehicleResultScreen({ plate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const tabBarRef = useRef<HTMLDivElement>(null);
  const { normalized, isValid, data, isLoading, isFetching, isError, refetch } = useVehicleLookup(plate);

  useEffect(() => {
    tabBarRef.current?.querySelector("[data-active]")?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [activeTab]);

  if (!isValid) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50"><CreditCard className="h-6 w-6 text-amber-500" /></div>
        <h1 className="mt-5 font-display text-xl font-black text-slate-900">Invalid plate</h1>
        <p className="mt-2 text-sm text-slate-500">We couldn't recognise <strong>{plate}</strong>.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Go back
        </Link>
      </div>
    </div>
  );

  if (isLoading) return <LoadingScreen />;

  if (isError || !data) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><AlertCircle className="h-6 w-6 text-red-500" /></div>
        <h1 className="mt-5 font-display text-xl font-black text-slate-900">Lookup Failed</h1>
        <p className="mt-2 text-sm text-slate-500">Couldn't retrieve vehicle data.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={refetch} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"><RotateCcw className="h-4 w-4" /> Retry</button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </div>
      </div>
    </div>
  );

  const v = data.vehicle;

  if (!v) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50"><RefreshCw className="h-6 w-6 text-amber-500 animate-spin" /></div>
        <h1 className="mt-5 font-display text-xl font-black text-slate-900">Refreshing data</h1>
        <p className="mt-2 text-sm text-slate-500">Cached entry is outdated. Fetching fresh data…</p>
        <button onClick={refetch} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"><RefreshCw className="h-4 w-4" /> Refresh now</button>
      </div>
    </div>
  );

  const apkOk = !!v.apkExpiryDate && new Date(v.apkExpiryDate) > new Date();
  const napOk = !!v.napVerdict && !v.napVerdict.toLowerCase().includes("onlogisch");
  const colour = v.color?.primary ?? null;

  const tabs: { id: Tab; label: string; Icon: React.ElementType; badge?: number }[] = [
    { id: "overview", label: "Overview", Icon: Layers },
    { id: "history", label: "Inspections", Icon: ClipboardList, badge: data.inspections.length },
    { id: "safety", label: "Safety", Icon: Shield, badge: data.recalls.length },
    { id: "map", label: "Find Garage", Icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">

        {/* ── TOP BAR ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">New search</span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="hidden font-mono text-xs font-bold text-slate-400 sm:block">NL</span>
            <span className="font-display text-sm font-black tracking-wider text-slate-800 truncate">
              {formatDisplayPlate(normalized)}
            </span>
            <span className="ml-auto truncate text-sm font-semibold text-slate-500">
              {v.brand} {v.tradeName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isFetching && (
              <span className="hidden items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 sm:flex">
                <RefreshCw className="h-3 w-3 animate-spin" /> Updating
              </span>
            )}
            <span className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold
              ${data.fromCache ? "border-slate-200 bg-white text-slate-500" : "border-brand-100 bg-brand-50 text-brand-700"}`}
            >
              <Zap className="h-3.5 w-3.5" />
              {data.fromCache ? "Cached" : "Live"}
            </span>
          </div>
        </div>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md">
          <div className="h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-sky-400" />
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-7">
            {/* Plate */}
            <div className="shrink-0">
              <PlateBadge plate={formatDisplayPlate(normalized)} size="lg" />
            </div>

            {/* Name + chips */}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl">
                {v.brand}{" "}
                <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
                  {v.tradeName}
                </span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {v.year && <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-xs font-black text-white">{v.year}</span>}
                {colour && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-200" style={{ background: colourHex(colour) }} />
                    {fmtColour(colour)}
                  </span>
                )}
                {v.bodyType && <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{v.bodyType}</span>}
                {v.seats && <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{v.seats} seats</span>}
                {v.doors && <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{v.doors} doors</span>}
              </div>
            </div>

            {/* Status blocks */}
            <div className="flex gap-2 sm:flex-col sm:items-end">
              <div className={`flex flex-col items-center rounded-2xl border px-4 py-2.5 text-center min-w-[88px]
                ${apkOk ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest ${apkOk ? "text-emerald-500" : "text-red-400"}`}>APK</span>
                <span className={`mt-0.5 text-sm font-black ${apkOk ? "text-emerald-800" : "text-red-700"}`}>{v.apkExpiryDate ?? "—"}</span>
              </div>
              {v.napVerdict && (
                <div className={`flex flex-col items-center rounded-2xl border px-4 py-2.5 text-center min-w-[88px]
                  ${napOk ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${napOk ? "text-emerald-500" : "text-amber-500"}`}>NAP</span>
                  <span className={`mt-0.5 text-sm font-black ${napOk ? "text-emerald-800" : "text-amber-800"}`}>{v.napVerdict}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TRUST STRIP ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatusBadge ok={apkOk} label="Road Legal" />
          <StatusBadge ok={napOk} label="NAP OK" />
          <StatusBadge ok={v.insured} label="Insured" />
          <StatusBadge ok={!v.hasOpenRecall} label="No Recall" />
          <StatusBadge ok={v.transferPossible} label="Transfer OK" />
          <StatusBadge ok={!v.wok} label="No WOK" />
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

          {/* Sidebar — hidden on mobile, shown first on lg */}
          <div className="hidden lg:block">
            <Sidebar v={v} raw={data.raw} />
          </div>

          {/* Tab panel */}
          <div className="space-y-3 min-w-0">
            {/* Tab bar — scrollable, no visible scrollbar */}
            <div
              ref={tabBarRef}
              className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm
                [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {tabs.map(({ id, label, Icon, badge }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    data-active={active || undefined}
                    onClick={() => setActiveTab(id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                      ${active ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black
                        ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}
                      >{badge}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="h-0.5 bg-gradient-to-r from-brand-400/80 via-violet-400/50 to-transparent" />
              <div className={activeTab === "map" ? "" : "p-5 sm:p-6"}>
                {activeTab === "overview" && <OverviewTab v={v} />}
                {activeTab === "history" && (
                  <div className="animate-fade-in p-5 sm:p-6">
                    <SectionHead title="APK Inspection Records" count={data.inspections.length} />
                    <InspectionTimeline items={data.inspections} descriptions={data.defectDescriptions} />
                  </div>
                )}
                {activeTab === "safety" && (
                  <div className="animate-fade-in p-5 sm:p-6">
                    <SectionHead title="Safety Recalls" count={data.recalls.length} />
                    <RecallList items={data.recalls} />
                  </div>
                )}
                {activeTab === "map" && <MapPanel />}
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE SIDEBAR (below tabs on mobile only) ────────────────── */}
        <div className="lg:hidden">
          <Sidebar v={v} raw={data.raw} />
        </div>

      </div>
    </div>
  );
}
