"use client";

import Image from "next/image";
import type { VehicleProfile } from "@/lib/rdw/types";
import { getVehicleImageUrl } from "@/lib/utils/imagin";
import {
  Tag, Car, Calendar, Fuel, ShieldCheck, AlertTriangle,
  CheckCircle, Gauge, Settings2, Weight, Users, Globe,
  MapPin, Zap, Thermometer, BadgeCheck, ShieldAlert,
  Banknote, TrendingUp, Leaf, Clock
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Props = { profile: VehicleProfile };

function Field({
  label, value, Icon, accent = false
}: {
  label: string; value: string | null | undefined; Icon: React.ElementType; accent?: boolean;
}) {
  const display = (value === null || value === undefined || value === "") ? "-" : value;
  return (
    <div className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150
      ${accent ? "bg-brand-50 ring-1 ring-brand-100" : "bg-slate-50 hover:bg-slate-100"}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110
        ${accent ? "bg-brand-100" : "bg-white border border-slate-200"}`}
      >
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-brand-600" : "text-slate-500"}`} />
      </span>
      <span className="min-w-0 flex-1 text-xs text-slate-500">{label}</span>
      <span className={`text-right text-sm font-semibold ${accent ? "text-brand-700" : "text-slate-900"}`}>
        {display}
      </span>
    </div>
  );
}

function SectionHeader({ title, Icon, color = "brand" }: { title: string; Icon: React.ElementType; color?: string }) {
  const colorMap: Record<string, string> = {
    brand: "bg-brand-50  text-brand-600  ring-brand-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    sky: "bg-sky-50    text-sky-600    ring-sky-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50  text-amber-600  ring-amber-100",
    rose: "bg-rose-50   text-rose-600   ring-rose-100",
    teal: "bg-teal-50   text-teal-600   ring-teal-100",
  };
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${colorMap[color] ?? colorMap.brand}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
  );
}

function StatusBadge({ label, ok, warnOnTrue = false }: { label: string; ok: boolean; warnOnTrue?: boolean }) {
  const isGood = warnOnTrue ? !ok : ok;
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none
      ${isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
    >
      {isGood ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function fmt(v: number | null | undefined, unit = ""): string | null {
  if (v == null) return null;
  return `${v.toLocaleString("nl-NL")}${unit ? ` ${unit}` : ""}`;
}

export function VehicleCard({ profile }: Props) {
  const { locale } = useI18n();
  const isNl = locale === "nl";
  const v = profile.vehicle;
  const apkOk = v.apkExpiryDate && new Date(v.apkExpiryDate) > new Date();

  return (
    <div className="card-glow overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-violet-500" />

      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Image
          alt={`${v.brand} ${v.tradeName}`}
          src={getVehicleImageUrl(v.brand, v.tradeName, {
            angle: "01",
            zoomtype: "relative",
            color: v.color?.primary ?? null
          })}
          width={400}
          height={225}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>

      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            {v.brand ?? "-"} {v.tradeName ?? ""}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {v.year ?? "-"} · {v.bodyType ?? "-"} · {v.color?.primary ?? "-"}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold
          ${apkOk
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
        >
          {apkOk
            ? <><ShieldCheck className="h-3 w-3" /> {isNl ? "Rijklaar" : "Road Legal"}</>
            : <><AlertTriangle className="h-3 w-3" /> {isNl ? "APK verlopen" : "APK Expired"}</>}
        </span>
      </div>

      <div className="space-y-5 p-4">
        <div>
          <SectionHeader title={isNl ? "Status & historie" : "Status & History"} Icon={ShieldAlert} color="teal" />

          {v.napVerdict && (
            <div className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 ring-1
              ${v.napVerdict.toLowerCase().includes("logisch") && !v.napVerdict.toLowerCase().includes("on")
                ? "bg-emerald-50 ring-emerald-100"
                : v.napVerdict.toLowerCase().includes("onlogisch")
                  ? "bg-red-50 ring-red-100"
                  : "bg-slate-50 ring-slate-100"}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                ${v.napVerdict.toLowerCase().includes("logisch") && !v.napVerdict.toLowerCase().includes("on")
                  ? "bg-emerald-100" : "bg-slate-100"}`}
              >
                <TrendingUp className={`h-3.5 w-3.5
                  ${v.napVerdict.toLowerCase().includes("logisch") && !v.napVerdict.toLowerCase().includes("on")
                    ? "text-emerald-600" : "text-slate-500"}`}
                />
              </span>
              <span className="flex-1 text-xs text-slate-500">{isNl ? "NAP kilometeroordeel" : "NAP Mileage Verdict"}</span>
              <span className={`text-sm font-bold
                ${v.napVerdict.toLowerCase().includes("logisch") && !v.napVerdict.toLowerCase().includes("on")
                  ? "text-emerald-700" : "text-red-700"}`}
              >
                {v.napVerdict}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Field Icon={Clock} label={isNl ? "Laatste tellerjaar" : "Last odometer year"} value={fmt(v.napLastYear)} />
            <Field Icon={Banknote} label={isNl ? "Catalogusprijs" : "Original list price"} value={v.cataloguePrice != null ? `EUR ${v.cataloguePrice.toLocaleString("nl-NL")}` : null} />
            <Field Icon={Leaf} label={isNl ? "Emissienorm" : "Emission standard"} value={v.emissionStandard} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusBadge label={isNl ? "Verzekerd" : "Insured"} ok={v.insured} />
            <StatusBadge label={isNl ? "Geen open terugroepactie" : "No open recall"} ok={!v.hasOpenRecall} />
            <StatusBadge label={isNl ? "Geen taxi" : "Not a taxi"} ok={!v.isTaxi} />
            <StatusBadge label={isNl ? "Overdracht mogelijk" : "Transfer possible"} ok={v.transferPossible} />
            <StatusBadge label={isNl ? "Geen exportindicator" : "No export flag"} ok={!v.exportIndicator} />
            <StatusBadge label={isNl ? "Geen WOK" : "No WOK"} ok={!v.wok} />
          </div>
        </div>

        <div>
          <SectionHeader title={isNl ? "Identiteit" : "Identity"} Icon={Car} color="brand" />
          <div className="space-y-1.5">
            <Field Icon={Tag} label={isNl ? "Merk" : "Make"} value={v.brand} />
            <Field Icon={Car} label={isNl ? "Model" : "Model"} value={v.tradeName} />
            <Field Icon={Calendar} label={isNl ? "Bouwjaar" : "Year"} value={fmt(v.year)} />
            <Field Icon={Gauge} label={isNl ? "Carrosserie" : "Body type"} value={v.bodyType} />
            <Field Icon={Users} label={isNl ? "Zitplaatsen" : "Seats"} value={fmt(v.seats)} />
            <Field Icon={Car} label={isNl ? "Deuren" : "Doors"} value={fmt(v.doors)} />
            {v.color?.primary && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-slate-200"
                    style={{
                      background: v.color.primary.toLowerCase() === "blauw" ? "#3b82f6"
                        : v.color.primary.toLowerCase() === "grijs" ? "#94a3b8"
                          : v.color.primary.toLowerCase() === "zwart" ? "#1e293b"
                            : v.color.primary.toLowerCase() === "wit" ? "#f1f5f9"
                              : v.color.primary.toLowerCase() === "rood" ? "#ef4444"
                                : "#94a3b8"
                    }}
                  />
                </span>
                <span className="flex-1 text-xs text-slate-500">{isNl ? "Kleur" : "Colour"}</span>
                <span className="text-sm font-semibold text-slate-900 capitalize">{v.color.primary.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeader title={isNl ? "Aandrijflijn" : "Powertrain"} Icon={Fuel} color="sky" />
          <div className="space-y-1.5">
            <Field Icon={Fuel} label={isNl ? "Brandstof" : "Fuel type"} value={v.fuelType} />
            <Field Icon={Settings2} label={isNl ? "Cilinderinhoud" : "Displacement"} value={fmt(v.engine?.displacement, "cc")} />
            <Field Icon={Settings2} label={isNl ? "Cilinders" : "Cylinders"} value={fmt(v.engine?.cylinders)} />
            <Field Icon={Zap} label={isNl ? "Max vermogen" : "Max power"} value={fmt(v.engine?.powerKw, "kW")} />
            <Field Icon={Thermometer} label="CO2" value={fmt(v.co2, "g/km")} />
            <Field Icon={Gauge} label={isNl ? "Verbruik" : "Consumption"} value={v.consumptionCombined != null ? `${v.consumptionCombined} L/100km` : null} />
            {v.energyLabel && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                <span className="flex-1 text-xs text-slate-500">{isNl ? "Energielabel" : "Energy label"}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-sm font-black text-white">
                  {v.energyLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeader title={isNl ? "Gewicht" : "Weight"} Icon={Weight} color="violet" />
          <div className="space-y-1.5">
            <Field Icon={Weight} label={isNl ? "Leeggewicht" : "Kerb weight"} value={fmt(v.weight?.empty, "kg")} />
            <Field Icon={Weight} label={isNl ? "Maximaal gewicht" : "Max GVW"} value={fmt(v.weight?.max, "kg")} />
            <Field Icon={Weight} label={isNl ? "Laadvermogen" : "Payload"} value={fmt(v.weight?.payload, "kg")} />
          </div>
        </div>

        <div>
          <SectionHeader title={isNl ? "Registratie" : "Registration"} Icon={Globe} color="green" />
          <div className="space-y-1.5">
            <Field Icon={MapPin} label={isNl ? "Eerste toelating (NL)" : "First registered (NL)"} value={v.firstRegistrationNL} />
            <Field Icon={Globe} label={isNl ? "Eerste toelating (wereld)" : "First registered (world)"} value={v.firstRegistrationWorld} />
            <Field Icon={Calendar} label={isNl ? "APK geldig tot" : "APK valid until"} value={v.apkExpiryDate} accent />
            <Field Icon={BadgeCheck} label={isNl ? "Overdracht mogelijk" : "Transfer possible"} value={v.transferPossible ? (isNl ? "Ja" : "Yes") : (isNl ? "Nee" : "No")} />
            <Field Icon={Users} label={isNl ? "Aantal eigenaren" : "Registered owners"} value={fmt(v.owners?.count)} />
          </div>
        </div>

      </div>
    </div>
  );
}

