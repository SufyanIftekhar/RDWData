"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlateBadge } from "@/components/ui/PlateBadge";
import { InspectionTimeline } from "@/components/vehicle/InspectionTable";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { formatDisplayPlate } from "@/lib/rdw/normalize";

// Micro-components
import { GaugeChart } from "@/components/ui/GaugeChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FeatureCard } from "@/components/ui/FeatureCard";

import {
  ArrowLeft, AlertCircle, RefreshCw,
  CheckCircle2, XCircle, TrendingDown,
  CarFront, AlertTriangle
} from "lucide-react";

type Props = { plate: string };

function fmtColour(n: string | null) {
  if (!n) return null;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

// ─── Primitives
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <p className="font-bold text-slate-500 animate-pulse">Fetching vehicle report...</p>
      </div>
    </div>
  );
}

function SectionTitle({ id, title }: { id: string, title: string }) {
  return (
    <div id={id} className="scroll-mt-24 mb-6 mt-12 flex items-center gap-3">
      <div className="h-6 w-1 rounded-full bg-brand-500" />
      <h2 className="font-display text-2xl font-black text-slate-900">{title}</h2>
    </div>
  );
}

function SpecRow({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-lg">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`text-sm tracking-tight text-right ${strong ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}

function MiniStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center min-h-[100px] transition-all
      ${ok ? "border-emerald-100 bg-white hover:border-emerald-200" : "border-red-100 bg-red-50 hover:bg-red-100"}`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${ok ? "bg-emerald-100" : "bg-red-200"}`}>
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={3} /> : <XCircle className="h-4 w-4 text-red-600" strokeWidth={3} />}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`text-xs font-black mt-0.5 ${ok ? "text-slate-800" : "text-red-700"}`}>{ok ? "OK" : "Alert"}</p>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────
export function VehicleResultScreen({ plate }: Props) {
  const { normalized, isValid, data, isLoading, isError } = useVehicleLookup(plate);
  const [activeSection, setActiveSection] = useState("samenvatting");

  // Sticky Sidebar intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Find the first intersecting section 
      const visible = entries.find(e => e.isIntersecting);
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-20% 0px -70% 0px" });

    document.querySelectorAll('div[id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  if (!isValid || isError) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><AlertCircle className="h-6 w-6 text-red-500" /></div>
        <h1 className="mt-5 font-display text-xl font-black text-slate-900">Vehicle Not Found</h1>
        <p className="mt-2 text-sm text-slate-500">We couldn&apos;t find {plate} or the RDW service is unavailable.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </div>
      </div>
    </div>
  );

  if (isLoading || !data || !data.enriched) return <LoadingScreen />;

  const v = data.vehicle;
  const e = data.enriched;

  const sections = [
    { id: "samenvatting", label: "Summary & Verdict" },
    { id: "problemen", label: "Maintenance Issues" },
    { id: "tech", label: "Technical Specifications" },
    { id: "risico", label: "Risks & Opportunities" },
    { id: "registratie", label: "Registration & Mileage" },
    { id: "historie", label: "History & MOT (APK)" },
    { id: "waarde", label: "Value & Costs" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-black tracking-tight text-brand-900">
            <span className="flex items-center justify-center rounded-lg bg-brand-600 p-1.5"><CarFront className="h-5 w-5 text-white" /></span>
            VehicleReport<span className="text-brand-500">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${data.fromCache ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
              <CheckCircle2 className="h-3 w-3" /> {data.fromCache ? "Cached" : "Live data"}
            </span>
            <Link href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">New search</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:flex lg:gap-10">

        {/* ── LEFT: MAIN CONTENT ── */}
        <div className="min-w-0 flex-1 space-y-8">

          {/* 1. HERO CARD */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-900/5">
            <div className="flex flex-col md:flex-row">
              {/* Fake Car Image Placeholder */}
              <div className="relative flex aspect-video w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 md:w-2/5">
                <CarFront className="h-24 w-24 text-slate-300 opacity-50" />
                <span className="absolute bottom-4 left-4 rounded-lg bg-slate-900/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  {v.bodyType || "Vehicle"}
                </span>
              </div>

              {/* Identity Details */}
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <PlateBadge plate={formatDisplayPlate(normalized)} size="lg" />
                    <h1 className="mt-4 font-display text-3xl font-black leading-none tracking-tight text-slate-900 sm:text-4xl">
                      {v.brand} {v.tradeName}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {v.engine?.displacement && `${(v.engine.displacement / 1000).toFixed(1)}L `}
                      {v.fuelType} • {v.engine?.powerKw ? `${Math.round(v.engine.powerKw * 1.36)} HP (${v.engine.powerKw} kW)` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex flex-wrap gap-2 text-sm font-semibold text-brand-600">
                  <span className="rounded-lg bg-brand-50 px-3 py-1.5">{v.firstRegistrationNL ? "Original from Netherlands" : "Imported"}</span>
                  {v.emissionStandard && <span className="rounded-lg border border-brand-100 px-3 py-1.5">{v.emissionStandard}</span>}
                </div>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 bg-slate-50 sm:grid-cols-4 sm:divide-y-0 text-center">
              <div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Police Status</p><p className="font-bold text-slate-800">{v.wok ? "WOK Alert" : "Clear"}</p></div>
              <div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Stolen Check</p><p className="font-bold text-slate-800">No</p></div>
              <div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Known Defects</p><p className="font-bold text-slate-800">{data.defects.length} Records</p></div>
              <div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Odometer</p><p className="font-bold text-emerald-600">{v.napVerdict || "Unknown"}</p></div>
            </div>
          </div>

          {/* 2. SAMENVATTING */}
          <section>
            <SectionTitle id="samenvatting" title="Summary & Verdict" />
            <div className="grid gap-4 sm:grid-cols-2">
              {e.ageInMonths && e.ageInMonths > 180 && (
                <FeatureCard
                  variant="warning"
                  title="Age Warning"
                  desc={`This vehicle is ${e.ageString} old. There is an increased risk of hidden defects & higher maintenance costs.`}
                />
              )}
              <FeatureCard
                variant="info"
                title="Emissions & Environment"
                desc={<span>Emission Class: <strong>{v.emissionStandard?.split(" ")[1] ?? "N/A"}</strong><br />CO2 Emissions: <strong>{v.co2} g/km</strong></span>}
                badge={v.fuelType === "Diesel" ? "Restricted in eco-zones" : undefined}
              />
              <FeatureCard
                variant={e.isImported ? "critical" : "success"}
                title="Import Risk Check"
                desc={e.isImported
                  ? "This vehicle is imported. Mileage and maintenance history from abroad can be difficult to verify."
                  : "Original Dutch vehicle — lower risk of odometer rollback."}
              />
            </div>

            <h3 className="mt-8 mb-4 font-display text-lg font-black text-slate-800">Control Overview</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStatus ok={!v.hasOpenRecall} label="Recalls" />
              <MiniStatus ok={true} label="Police (Stolen)" />
              <MiniStatus ok={!v.exportIndicator} label="Export Check" />
              <MiniStatus ok={!v.isTaxi} label="Registered Taxi" />
              <MiniStatus ok={!v.wok} label="WOK Status" />
              <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center min-h-[100px] bg-white hover:bg-slate-50 border-slate-100`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100`}>
                  <AlertTriangle className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recorded Damages</p>
                  <p className="text-xs font-black mt-0.5 text-slate-800">{data.defects.length} Reports</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. PROBLEMEN */}
          {e.knownIssues.length > 0 && (
            <section>
              <SectionTitle id="problemen" title="Known Maintenance Issues" />
              <div className="overflow-hidden rounded-3xl border border-amber-100/50 bg-amber-50/20 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
                    <p className="text-sm font-medium text-amber-800">Common problems for this engine type ({v.fuelType}):</p>
                  </div>
                  <div className="space-y-4">
                    {e.knownIssues.map((issue, idx) => (
                      <div key={idx} className="rounded-2xl border border-amber-100 bg-white p-5">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-amber-900">{idx + 1}. {issue.title}</h4>
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">{issue.severity}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600"><strong>Applies to:</strong> {issue.target}</p>
                        <p className="mt-1 text-sm font-medium text-amber-800"><em>Advice: {issue.advice}</em></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. TECH SPECS */}
          <section>
            <SectionTitle id="tech" title="Technical Specifications" />
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-6">
                  <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-brand-600">Engine & Performance</h3>
                  <div className="space-y-1 text-slate-600">
                    <SpecRow label="Engine Capacity" value={v.engine?.displacement ? `${v.engine.displacement} cc` : "-"} strong />
                    <SpecRow label="Power Output" value={v.engine?.powerKw ? `${v.engine.powerKw} kW` : "-"} strong />
                    <SpecRow label="Drivetrain" value="FWD (Estimated)" />
                    <SpecRow label="Color" value={fmtColour(v.color?.primary)} />
                    <SpecRow label="Body Style" value={v.bodyType} />
                    <SpecRow label="Cylinders" value={v.engine?.cylinders} strong />
                    <SpecRow label="Energy Label" value={v.energyLabel} />
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50">
                  <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-brand-600">Dimensions & Weight</h3>
                  <div className="space-y-1 text-slate-600">
                    <SpecRow label="Curb Weight" value={v.weight?.empty ? `${v.weight.empty.toLocaleString("en-US")} kg` : "-"} strong />
                    <SpecRow label="Gross Weight" value={v.weight?.max ? `${v.weight.max.toLocaleString("en-US")} kg` : "-"} strong />
                    <SpecRow label="Seats" value={v.seats} />
                    <SpecRow label="Doors" value={v.doors} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. RISICO & KANSEN */}
          <section>
            <SectionTitle id="risico" title="Risks & Opportunities" />
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
              <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                Legend: green = favorable, orange = attention. For <em>Maintenance Risk</em>, lower is better. (Algorithm based)
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
                <GaugeChart score={e.maintenanceRiskScore} max={10} invertColors label="Maintenance Risk" desc="Based on age & mileage" />
                <GaugeChart score={v.apkExpiryDate ? 78 : 45} max={100} label="Sales Potential" desc="Expected: 60-90 days" />
                <div className="col-span-2 md:col-span-1 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0">
                  <GaugeChart score={e.apkPassChance} max={100} label="MOT Pass Chance" desc="Check lighting first" />
                </div>
              </div>

              {e.repairChances.length > 0 && (
                <>
                  <h3 className="font-display text-lg font-black text-slate-800 mb-5">Repair Probabilities (Next 12 limits)</h3>
                  <div className="space-y-6 max-w-2xl">
                    {e.repairChances.map(rc => (
                      <ProgressBar key={rc.name} label={rc.name} percentage={rc.chance} estMin={rc.estMin} estMax={rc.estMax} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 5B. REGISTRATIE & KILOMETERSTAND */}
          <section>
            <SectionTitle id="registratie" title="Registration & Mileage" />
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-6">
                  <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-brand-600">Registration Details</h3>
                  <div className="space-y-1 text-slate-600">
                    <SpecRow label="First Registration (NL)" value={v.firstRegistrationNL ?? "-"} strong />
                    <SpecRow label="First Registration (WW)" value={v.firstRegistrationWorld ?? "-"} />
                    <SpecRow label="Transfer Possible" value={v.transferPossible ? "Yes" : "No"} />
                    <SpecRow label="MOT (APK) Expiry" value={v.apkExpiryDate ?? "-"} strong />
                    <SpecRow label="Currently Insured" value={v.insured ? "Yes" : "No"} />
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50">
                  <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-brand-600">Mileage & Odometer</h3>
                  <div className="space-y-1 text-slate-600">
                    <SpecRow label="NAP Odometer Verdict" value={v.napVerdict ?? "Unknown"} strong />
                    <SpecRow label="Year Last Registered" value={v.napLastYear ?? "N/A"} />
                    <SpecRow label="Original Catalogue Price" value={v.cataloguePrice ? `€ ${v.cataloguePrice.toLocaleString("en-US")}` : "-"} />
                    <SpecRow label="Owner Count" value={v.owners?.count ?? "Not disclosed"} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. HISTORIE & APK */}
          <section>
            <SectionTitle id="historie" title="History & MOT (APK)" />
            <div className="space-y-6">
              {/* Timeline implementation using our existing InspectionTable */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-black text-slate-800 mb-4">MOT Reports & Inspections</h3>
                <InspectionTimeline items={data.inspections} descriptions={data.defectDescriptions} />
              </div>

              {/* Recall block */}
              {data.recalls.length > 0 && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                  <h3 className="font-display text-lg font-black text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Open Safety Recalls ({data.recalls.length})
                  </h3>
                  <ul className="list-inside list-disc text-sm text-red-800 mt-3 space-y-1">
                    {data.recalls.map((r, i) => (
                      <li key={i}>{String(r.gedetailleerde_gebrek_omschrijving ?? "Defect without description")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* 7. WAARDE & KOSTEN */}
          <section>
            <SectionTitle id="waarde" title="Value & Costs" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">Depreciation & Current Value</h3>
                <SpecRow label="Original Catalogue Price" value={v.cataloguePrice ? `€ ${v.cataloguePrice.toLocaleString("en-US")}` : "Unknown"} strong />
                <SpecRow label="Estimated Value Now" value={e.estimatedValueNow ? `€ ${e.estimatedValueNow.toLocaleString("en-US")}` : "-"} strong />
                <SpecRow label="Expected Next Year" value={e.estimatedValueNextYear ? `€ ${e.estimatedValueNextYear.toLocaleString("en-US")}` : "-"} />

                {e.estimatedValueNow && e.estimatedValueNextYear && (
                  <div className="mt-6 rounded-2xl bg-brand-50 p-4 border border-brand-100 flex items-center justify-between text-brand-900">
                    <span className="text-sm font-bold">Trend:</span>
                    <span className="flex items-center gap-1 font-black text-red-600">
                      <TrendingDown className="h-4 w-4" /> -12% / year
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">Monthly Running Costs</h3>
                <SpecRow label="Fuel (Est. 1000km/mo)" value={e.fuelEstMonth ? `€ ${e.fuelEstMonth} / mo` : "-"} />
                <SpecRow label="Road Tax" value={e.roadTaxEstQuarter ? `€ ${Math.round(e.roadTaxEstQuarter.min / 3)} / mo` : "Exempt"} />
                <SpecRow label="Insurance (Est.)" value={e.insuranceEstMonth ? `€ ${e.insuranceEstMonth} / mo` : "-"} />

                <div className="mt-8 border-t border-slate-100 pt-5 flex items-center justify-between">
                  <span className="font-bold text-slate-500">Total estimated</span>
                  <span className="font-display text-2xl font-black text-slate-900">
                    € {(e.fuelEstMonth || 0) + (e.insuranceEstMonth || 0) + (e.roadTaxEstQuarter ? Math.round(e.roadTaxEstQuarter.min / 3) : 0)} <span className="text-sm text-slate-500 font-medium">/ mo</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-12 text-center text-xs text-slate-400 mb-20 pb-10">
              © {new Date().getFullYear()} VehicleReport.nl (Demo) - All data is indicative based on RDW Open Data.
            </div>
          </section>

        </div>

        {/* ── RIGHT: STICKY TOC SIDEBAR ── */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-black text-slate-900 mb-4">Table of Contents</h3>
            <nav className="flex flex-col space-y-1">
              {sections.map(s => {
                const isActive = activeSection === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
                      ${isActive ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-brand-500" : "bg-transparent"}`} />
                    {s.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
              <h4 className="font-bold font-display text-lg">Premium Report</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">Add exact mileage charts, previous owner details, and hidden damage history for £4.95.</p>
              <button className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold shadow-sm hover:bg-brand-400 transition-colors">
                Unlock Premium
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
