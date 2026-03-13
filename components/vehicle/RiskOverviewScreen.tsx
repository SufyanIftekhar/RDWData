"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowUpRight,
  FileCheck2,
  Gauge,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import styles from "./RiskOverviewScreen.module.css";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { VehicleNavBar } from "./VehicleNavBar";

type Props = {
  plate?: string;
};

function buildPlateHref(plate: string | undefined, suffix = "") {
  if (!plate) return suffix || "/";
  return `/search/${plate}${suffix}`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(parsed);
}

function RiskCard({
  title,
  status,
  description,
  badge,
  trend,
  icon: Icon,
  tone,
  link
}: {
  title: string;
  status: string;
  description: string;
  badge: string;
  trend: string;
  icon: ElementType;
  tone: "success" | "warning" | "primary";
  link: string;
}) {
  return (
    <Link href={link} className={styles.riskCard}>
      <div className={styles.cardTop}>
        <div className={styles.cardIconStack}>
          <div className={`${styles.riskIconWrapper} ${styles[`icon${tone}`]}`}>
            <Icon size={24} />
          </div>
          <div className={`${styles.cardBadge} ${styles[`badge${tone}`]}`}>{badge}</div>
        </div>
        <div className={styles.riskChevron}>
          <ArrowUpRight size={18} />
        </div>
      </div>
      <div className={styles.riskBody}>
        <div className={styles.riskTitle}>{title}</div>
        <div className={styles.riskStatus}>{status}</div>
        <div className={styles.riskDescription}>{description}</div>
      </div>
      <div className={styles.riskFooter}>
        <div className={styles.trendRow}>
          <span className={`${styles.trendDot} ${styles[`trend${tone}`]}`} />
          <span className={styles.trendText}>{trend}</span>
        </div>
        <div className={styles.viewLink}>Open history</div>
      </div>
    </Link>
  );
}

export function RiskOverviewScreen({ plate }: Props) {
  const { isValid, data, isLoading, isError } = useVehicleLookup(plate ?? "");

  if (!plate || !isValid || isError) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContainer}>
          <div className={styles.contentContainer}>
            <div className={styles.glassPanel}>Vehicle not found.</div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContainer}>
          <div className={styles.contentContainer}>
            <div className={styles.glassPanel}>Loading risk overview...</div>
          </div>
        </div>
      </div>
    );
  }

  const v = data.vehicle;

  const positiveChecks = [
    v.napVerdict && v.napVerdict.toLowerCase().includes("logisch"),
    !v.wok,
    !v.hasOpenRecall
  ].filter(Boolean).length;

  const metrics = [
    { label: "Positive checks", value: `${positiveChecks} / 3` },
    { label: "Needs review", value: `${v.wok || v.hasOpenRecall ? 1 : 0} item` },
    { label: "Last update", value: data.fromCache ? "Cached" : "Live" }
  ];

  const resolvedMileageVerdict =
    data.enriched?.mileageVerdict && data.enriched.mileageVerdict !== "UNKNOWN"
      ? data.enriched.mileageVerdict
      : v.napVerdict ?? "Unknown";

  const mileageTone =
    typeof resolvedMileageVerdict === "string" && resolvedMileageVerdict.toLowerCase().includes("logisch")
      ? "success"
      : "warning";

  const riskCards = [
    {
      id: "mileage",
      title: "Mileage History",
      status: resolvedMileageVerdict,
      description:
        "Mileage verdict is derived from APK history with weighted trend detection.",
      badge: resolvedMileageVerdict !== "Unknown" ? "Verified" : "Unknown",
      trend: resolvedMileageVerdict ?? "No verdict",
      icon: Gauge,
      tone: mileageTone,
      link: "/mileage-history"
    },
    {
      id: "damage",
      title: "Damage History",
      status: data.defects.length === 0 ? "No defects found" : `${data.defects.length} records`,
      description:
        "Defect records reported during inspections. Expand for details.",
      badge: data.defects.length === 0 ? "Clear" : "Review",
      trend: data.defects.length === 0 ? "Clean record" : "Check defects",
      icon: ShieldCheck,
      tone: data.defects.length === 0 ? "success" : "warning",
      link: "/damage-history"
    },
    {
      id: "ownership",
      title: "Ownership",
      status: v.owners.count ? `${v.owners.count} previous owners` : "Unknown",
      description:
        "RDW reports only owner count and registration dates.",
      badge: v.owners.count && v.owners.count > 2 ? "Review" : "Stable",
      trend: v.owners.count ? "Transfer dates" : "No data",
      icon: Users,
      tone: v.owners.count && v.owners.count > 2 ? "warning" : "success",
      link: "/ownership-history"
    },
    {
      id: "apk",
      title: "APK Inspection",
      status: v.apkExpiryDate ? `Valid until ${formatDate(v.apkExpiryDate)}` : "Unknown",
      description:
        "Inspection validity and event history from RDW APK records.",
      badge: v.apkExpiryDate ? "Current" : "Unknown",
      trend: v.apkExpiryDate ? "Inspection active" : "Missing",
      icon: FileCheck2,
      tone: v.apkExpiryDate ? "primary" : "warning",
      link: "/inspection-timeline"
    }
  ];

  const resolvedCards = riskCards.map((card) => ({
    ...card,
    link: buildPlateHref(plate, card.link)
  }));

  return (
    <div className={styles.page}>
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <VehicleNavBar plate={plate} subtitle="Risk overview" />

          <div className={`${styles.heroPanel} ${styles.glassPanel}`}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <Sparkles size={14} /> Smart risk summary
              </div>
              <div className={styles.heroTitle}>Understand the vehicle in seconds</div>
              <div className={styles.heroSubtitle}>
                Each card highlights a core checkpoint with status signals, supportive context, and a clear path into the
                detailed history.
              </div>
              <div className={styles.heroMetrics}>
                {metrics.map((metric) => (
                  <div key={metric.label} className={styles.metricChip}>
                    <div className={styles.metricLabel}>{metric.label}</div>
                    <div className={styles.metricValue}>{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.heroSide}>
              <div className={styles.spotlightCard}>
                <div className={styles.spotlightLabel}>Vehicle trust snapshot</div>
                <div className={styles.spotlightValue}>Low risk</div>
                <div className={styles.spotlightNote}>History looks stable with no major red flags in the key datasets.</div>
              </div>
              <div className={styles.spotlightCard}>
                <div className={styles.spotlightLabel}>Next best action</div>
                <div className={styles.spotlightNote}>
                  Open ownership history to review transfer timing and confirm the ownership pattern.
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.riskSection} ${styles.glassPanel}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionCopy}>
                <div className={styles.sectionTitle}>Risk Overview</div>
                <div className={styles.sectionSubtitle}>
                  A more modern, card-first overview with stronger emphasis on scanability, confidence signals, and click
                  targets for deeper inspection.
                </div>
              </div>
              <button className={styles.sectionAction} type="button">
                <LayoutGrid size={16} /> Overview mode
              </button>
            </div>

            <div className={styles.riskGrid}>
              {resolvedCards.map((card) => (
                <RiskCard key={card.id} {...card} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
