"use client";

import Link from "next/link";
import { useMemo, useState, type ElementType } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gauge,
  GaugeCircle,
  Leaf,
  Ruler,
  Settings,
  ShieldCheck,
  Zap
} from "lucide-react";
import styles from "./TechnicalSpecsScreen.module.css";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { VehicleNavBar } from "./VehicleNavBar";

type Props = {
  plate?: string;
};

function buildPlateHref(plate: string | undefined, suffix = "") {
  if (!plate) return suffix || "/";
  return `/search/${plate}${suffix}`;
}

function formatNumber(value: number | null, unit?: string) {
  if (value === null || Number.isNaN(value)) return null;
  return unit ? `${value.toLocaleString("nl-NL")} ${unit}` : value.toLocaleString("nl-NL");
}

function formatDisplacement(value: number | null) {
  if (!value) return null;
  return `${(value / 1000).toFixed(1)} L`;
}

function formatPower(value: number | null) {
  if (!value) return null;
  return `${value} kW / ${Math.round(value * 1.36)} HP`;
}

function titleCase(value: string | null) {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(parsed);
}

function SpecItem({
  label,
  value,
  meta,
  icon: Icon
}: {
  label: string;
  value: string;
  meta?: string;
  icon: ElementType;
}) {
  return (
    <div className={styles.specItem}>
      <div className={styles.specIcon}>
        <Icon size={24} />
      </div>
      <div className={styles.specDetails}>
        <div className={styles.specLabel}>{label}</div>
        <div className={styles.specValue}>{value}</div>
        {meta ? <div className={styles.specMeta}>{meta}</div> : null}
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  subtitle,
  icon: Icon,
  expanded,
  specs,
  onToggle
}: {
  title: string;
  subtitle: string;
  icon: ElementType;
  expanded: boolean;
  specs: Array<{ id: string; label: string; value: string; meta?: string; icon: ElementType }>;
  onToggle: () => void;
}) {
  return (
    <div className={`${styles.accordionCard} ${styles.surfacePanel} ${expanded ? "" : styles.collapsed}`}>
      <button className={styles.accordionHeader} type="button" onClick={onToggle}>
        <div className={styles.accordionHeaderLeft}>
          <div className={styles.accordionIconWrap}>
            <Icon size={20} />
          </div>
          <div className={styles.accordionTitleBlock}>
            <div className={styles.accordionTitle}>{title}</div>
            <div className={styles.accordionSubtitle}>{subtitle}</div>
          </div>
        </div>
        <div className={styles.accordionToggle}>
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      <div className={styles.accordionContent}>
        {specs.length ? (
          <div className={styles.specsGrid}>
            {specs.map((spec) => (
              <SpecItem key={spec.id} {...spec} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyNotice}>No data loaded yet for this section.</div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingCard}>Loading technical specifications...</div>
    </div>
  );
}

function ErrorScreen({ plate }: { plate?: string }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingCard}>
        We couldn&apos;t load technical specifications for {plate ?? "this vehicle"}.
      </div>
    </div>
  );
}

export function TechnicalSpecsScreen({ plate }: Props) {
  const backHref = buildPlateHref(plate, "/risk-overview");
  const { isValid, data, isLoading, isError } = useVehicleLookup(plate ?? "");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    performance: true,
    efficiency: true,
    dimensions: false,
    registration: false
  });

  const sections = useMemo(() => {
    const v = data?.vehicle;
    if (!v) return [];

    const performanceSpecs = [
      { id: "power", label: "Engine power", value: formatPower(v.engine?.powerKw), meta: "Factory output", icon: Zap },
      { id: "displacement", label: "Displacement", value: formatDisplacement(v.engine?.displacement), icon: Settings },
      { id: "cylinders", label: "Cylinders", value: formatNumber(v.engine?.cylinders), icon: GaugeCircle }
    ].filter((spec) => spec.value) as Array<{ id: string; label: string; value: string; meta?: string; icon: ElementType }>;

    const efficiencySpecs = [
      { id: "fuel", label: "Fuel type", value: titleCase(v.fuelType), icon: Gauge },
      { id: "consumption", label: "Fuel consumption", value: formatNumber(v.consumptionCombined, "L/100km"), icon: Gauge },
      { id: "co2", label: "CO2 emissions", value: formatNumber(v.co2, "g/km"), icon: Leaf },
      { id: "emission", label: "Emission standard", value: v.emissionStandard ?? null, icon: Leaf },
      { id: "energy", label: "Energy label", value: v.energyLabel ?? null, icon: Leaf }
    ].filter((spec) => spec.value) as Array<{ id: string; label: string; value: string; meta?: string; icon: ElementType }>;

    const dimensionSpecs = [
      { id: "body", label: "Body type", value: titleCase(v.bodyType), icon: Ruler },
      { id: "doors", label: "Doors", value: formatNumber(v.doors), icon: Ruler },
      { id: "seats", label: "Seats", value: formatNumber(v.seats), icon: Ruler },
      { id: "axles", label: "Axles", value: formatNumber(v.axles), icon: Ruler },
      { id: "weight-empty", label: "Empty weight", value: formatNumber(v.weight?.empty, "kg"), icon: Ruler },
      { id: "weight-max", label: "Max weight", value: formatNumber(v.weight?.max, "kg"), icon: Ruler },
      { id: "payload", label: "Payload", value: formatNumber(v.weight?.payload, "kg"), icon: Ruler }
    ].filter((spec) => spec.value) as Array<{ id: string; label: string; value: string; meta?: string; icon: ElementType }>;

    return [
      {
        id: "performance",
        title: "Engine & Performance",
        subtitle: "Power output, speed limits, and acceleration",
        icon: Gauge,
        specs: performanceSpecs
      },
      {
        id: "efficiency",
        title: "Efficiency & Environment",
        subtitle: "Fuel economy and emissions ratings",
        icon: Leaf,
        specs: efficiencySpecs
      },
      {
        id: "dimensions",
        title: "Dimensions & Weight",
        subtitle: "Vehicle measurements and capacities",
        icon: Ruler,
        specs: dimensionSpecs
      },
      {
        id: "registration",
        title: "Registration & Inspection",
        subtitle: "Key RDW registration dates and APK status",
        icon: ShieldCheck,
        specs: [
          {
            id: "first-nl",
            label: "First registration (NL)",
            value: formatDate(v.firstRegistrationNL),
            icon: ShieldCheck
          },
          {
            id: "first-world",
            label: "First registration (world)",
            value: formatDate(v.firstRegistrationWorld),
            icon: ShieldCheck
          },
          {
            id: "apk-expiry",
            label: "APK expiry",
            value: formatDate(v.apkExpiryDate),
            icon: ShieldCheck
          }
        ].filter((spec) => spec.value) as Array<{ id: string; label: string; value: string; meta?: string; icon: ElementType }>
      }
    ];
  }, [data]);

  if (!plate || !isValid || isError) return <ErrorScreen plate={plate} />;
  if (isLoading || !data) return <LoadingScreen />;

  return (
    <div className={styles.page}>
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <VehicleNavBar plate={plate} subtitle="Technical specifications" />

          <div className={styles.pageHeader}>
            <Link href={backHref} className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Risk Overview
            </Link>
            <div className={styles.headerTitleBlock}>
              <div className={styles.headerTitle}>Technical Specifications</div>
              <div className={styles.headerSubtitle}>
                Review the factory-recorded performance metrics and environmental impact data for this vehicle.
              </div>
            </div>
          </div>

          <div className={styles.specsContainer}>
            {sections.map((section) => (
              <AccordionSection
                key={section.id}
                {...section}
                expanded={openSections[section.id] ?? false}
                onToggle={() =>
                  setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
