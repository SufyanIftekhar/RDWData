"use client";

import { useMemo, useState, type ElementType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Camera,
  Clock3,
  Coins,
  Download,
  Fuel,
  Gauge,
  RefreshCw,
  Settings2,
  Share2,
  ShieldCheck,
  TrendingUp,
  Wrench
} from "lucide-react";

import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { formatDisplayPlate } from "@/lib/rdw/normalize";
import styles from "./VehicleResultScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";

type Props = { plate: string };

type ScoreTone = "strong" | "steady" | "mixed" | "caution";

type ScoreResult = {
  score: number;
  tone: ScoreTone;
  label: string;
  description: string;
  confidence: string;
  riskFlag: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) return "Not available";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatNumber(value: number | null, unit?: string) {
  if (value === null || Number.isNaN(value)) return "Unknown";
  return unit ? `${value.toLocaleString("nl-NL")} ${unit}` : value.toLocaleString("nl-NL");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function titleCase(value: string | null) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getScoreTone(score: number): ScoreTone {
  if (score >= 80) return "strong";
  if (score >= 65) return "steady";
  if (score >= 50) return "mixed";
  return "caution";
}

function buildScoreResult(args: {
  defects: number;
  riskScore: number;
  apkPassChance: number | null;
  wok: boolean;
  imported: boolean;
}): ScoreResult {
  const base = 78;
  const defectPenalty = Math.min(args.defects * 2.5, 18);
  const riskPenalty = Math.round(args.riskScore * 2.2);
  const wokPenalty = args.wok ? 16 : 0;
  const importPenalty = args.imported ? 6 : 0;
  const apkBonus = args.apkPassChance ? Math.round(args.apkPassChance / 12) : 0;

  const score = clamp(base + apkBonus - defectPenalty - riskPenalty - wokPenalty - importPenalty, 32, 95);
  const tone = getScoreTone(score);

  const labelByTone: Record<ScoreTone, string> = {
    strong: "Strong result",
    steady: "Steady profile",
    mixed: "Mixed signals",
    caution: "Needs review"
  };

  const descriptionByTone: Record<ScoreTone, string> = {
    strong: "Positive ownership and usage profile with a healthy overall confidence signal.",
    steady: "Most signals look solid with only minor items to double-check.",
    mixed: "Several signals need closer attention before making a decision.",
    caution: "Key signals require follow-up before moving forward."
  };

  const confidence = tone === "strong" || tone === "steady" ? "High" : tone === "mixed" ? "Medium" : "Low";
  const riskFlag = args.wok || args.defects > 4 ? "Elevated" : "Low";

  return {
    score,
    tone,
    label: labelByTone[tone],
    description: descriptionByTone[tone],
    confidence,
    riskFlag
  };
}

function ScoreBadgeIcon() {
  return (
    <span className={styles.badgeIcon}>
      <TrendingUp size={12} />
    </span>
  );
}

function LicensePlate({ plate }: { plate: string }) {
  return <div className={styles.licensePlate}>{plate}</div>;
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaCard}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailCard}>
      <div className={styles.detailCardLabel}>{label}</div>
      <div className={styles.detailCardValue}>{value}</div>
    </div>
  );
}

function SpecChip({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className={styles.chip}>
      <span className={styles.chipIcon}>
        <Icon size={16} />
      </span>
      {label}
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  value
}: {
  icon: ElementType;
  title: string;
  value: string;
}) {
  return (
    <div className={styles.insightCard}>
      <div className={styles.insightIcon}>
        <Icon size={18} />
      </div>
      <div className={styles.insightCopy}>
        <div className={styles.insightTitle}>{title}</div>
        <div className={styles.insightValue}>{value}</div>
      </div>
    </div>
  );
}

function ScoreModule({ score }: { score: ScoreResult }) {
  const degrees = Math.round((score.score / 100) * 360);
  const ringColor =
    score.tone === "strong"
      ? "var(--success)"
      : score.tone === "steady"
      ? "#38BDF8"
      : score.tone === "mixed"
      ? "var(--warning)"
      : "var(--destructive)";

  return (
    <div className={styles.scoreModule}>
      <div className={styles.scoreHeader}>
        <div className={styles.scoreTitle}>KentekenScore</div>
        <div className={styles.scoreBadge}>
          <ScoreBadgeIcon />
          {score.label}
        </div>
      </div>

      <div className={styles.gaugeWrap}>
        <div
          className={styles.gaugeRing}
          style={{
            background: `conic-gradient(${ringColor} 0 ${degrees}deg, rgba(255,255,255,0.12) ${degrees}deg 360deg)`
          }}
        >
          <div className={styles.gaugeContent}>
            <div className={styles.scoreValue}>{score.score}</div>
            <div className={styles.scoreMax}>out of 100</div>
          </div>
        </div>
      </div>

      <div className={styles.scoreCopy}>{score.description}</div>

      <div className={styles.scoreMetrics}>
        <div className={styles.scoreMetricCard}>
          <div className={styles.scoreMetricLabel}>Confidence</div>
          <div className={styles.scoreMetricValue}>{score.confidence}</div>
        </div>
        <div className={styles.scoreMetricCard}>
          <div className={styles.scoreMetricLabel}>Risk flag</div>
          <div className={styles.scoreMetricValue}>{score.riskFlag}</div>
        </div>
      </div>

      <div className={styles.scoreActions}>
        <button className={styles.actionPrimary} type="button">
          <Download size={18} />
          Download Report
        </button>
        <div className={styles.actionRow}>
          <button className={styles.actionSecondary} type="button">
            <Bookmark size={16} />
            Save Vehicle
          </button>
          <button className={styles.actionSecondary} type="button">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingCard}>
        <RefreshCw className={styles.loadingIcon} />
        <p>Fetching vehicle report...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ plate }: { plate: string }) {
  return (
    <div className={styles.errorScreen}>
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>
          <ShieldCheck size={20} />
        </div>
        <h1>Vehicle Not Found</h1>
        <p>We couldn&apos;t find {plate} or the RDW service is unavailable.</p>
        <div className={styles.errorActions}>
          <Link href="/" className={styles.errorButton}>
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function VehicleResultScreen({ plate }: Props) {
  const { normalized, isValid, data, isLoading, isError } = useVehicleLookup(plate);
  const [lastUpdated] = useState(() => new Date());

  const score = useMemo(() => {
    if (!data?.vehicle || !data.enriched) {
      return buildScoreResult({ defects: 0, riskScore: 6, apkPassChance: 78, wok: false, imported: false });
    }

    return buildScoreResult({
      defects: data.defects.length,
      riskScore: data.enriched.maintenanceRiskScore,
      apkPassChance: data.enriched.apkPassChance,
      wok: data.vehicle.wok,
      imported: data.enriched.isImported
    });
  }, [data]);

  if (!isValid || isError) return <ErrorScreen plate={plate} />;
  if (isLoading || !data || !data.enriched) return <LoadingScreen />;

  const v = data.vehicle;
  const e = data.enriched;
  const displayPlate = formatDisplayPlate(normalized);

  const vehicleTitle = [v.brand, v.tradeName].filter(Boolean).join(" ").trim();
  const vehicleSubtitle = [
    v.engine?.displacement ? `${(v.engine.displacement / 1000).toFixed(1)}L` : null,
    v.fuelType,
    v.engine?.powerKw ? `${Math.round(v.engine.powerKw * 1.36)} HP` : null
  ]
    .filter(Boolean)
    .join(" • ");

  const conditionLabel = data.defects.length === 0 ? "Well maintained" : data.defects.length < 3 ? "Minor issues" : "Needs review";
  const ownersLabel = v.owners.count ? `${v.owners.count} previous` : "Unknown";
  const marketLabel = e.estimatedValueNow ? "Stable demand" : "Market data pending";

  const detailCards = [
    { label: "Fuel type", value: titleCase(v.fuelType) },
    { label: "Transmission", value: "Unknown" },
    { label: "Doors", value: formatNumber(v.doors) },
    { label: "Seats", value: formatNumber(v.seats) },
    { label: "Color", value: titleCase(v.color.primary) },
    { label: "Empty weight", value: formatNumber(v.weight?.empty, "kg") }
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <VehicleNavBar plate={normalized} />

          <div className={styles.heroShell}>
            <div className={styles.heroCard}>
              <div className={styles.heroImagePanel}>
                <div className={styles.heroImageWrapper}>
                  <Image
                    alt="Vehicle exterior"
                    src="https://storage.googleapis.com/banani-generated-images/generated-images/e0649eef-2848-49b1-a352-34ec7d23ba0c.jpg"
                    width={580}
                    height={340}
                    className="h-full w-full object-cover"
                  />
                  <div className={styles.imageOverlayTag}>
                    <Camera size={14} />
                    Exterior verified
                  </div>
                </div>
                <div className={styles.imageMetaRow}>
                  <MetaCard label="Condition" value={conditionLabel} />
                  <MetaCard label="Owners" value={ownersLabel} />
                  <MetaCard label="Market" value={marketLabel} />
                </div>
              </div>

              <div className={styles.heroInfo}>
                <div className={styles.eyebrowRow}>
                  <div className={styles.eyebrowPill}>
                    <ShieldCheck size={14} />
                    Trusted data source
                  </div>
                </div>

                <LicensePlate plate={displayPlate} />

                <div className={styles.vehicleTitleBlock}>
                  <div className={styles.carTitle}>
                    {vehicleTitle || "Vehicle overview"}
                    {v.year ? ` ${v.year}` : ""}
                  </div>
                  <div className={styles.carSubtitle}>
                    {vehicleSubtitle || "Quick summary of the vehicle identity, drivetrain, usage, and score so you can decide faster."}
                  </div>
                </div>

                <div className={styles.carSpecsChips}>
                  <SpecChip icon={Fuel} label={titleCase(v.fuelType)} />
                  <SpecChip icon={Settings2} label={v.emissionStandard ?? "Emission standard"} />
                  <SpecChip icon={Gauge} label={v.napVerdict ? `NAP ${v.napVerdict}` : "NAP unknown"} />
                  <SpecChip icon={BadgeCheck} label={v.year ? v.year.toString() : "Year"} />
                </div>

                <div className={styles.detailGrid}>
                  {detailCards.map((card) => (
                    <DetailCard key={card.label} label={card.label} value={card.value} />
                  ))}
                </div>
              </div>

              <div className={styles.heroActions}>
                <ScoreModule score={score} />
              </div>
            </div>

            <div className={styles.insightStrip}>
              <InsightCard
                icon={BadgeCheck}
                title="Registration status"
                value={v.transferPossible ? "Valid and active" : "Transfer restricted"}
              />
              <InsightCard
                icon={Wrench}
                title="Service signal"
                value={data.defects.length < 3 ? "History looks consistent" : "Maintenance flagged"}
              />
              <InsightCard
                icon={Coins}
                title="Estimated value"
                value={formatCurrency(e.estimatedValueNow)}
              />
              <InsightCard
                icon={Clock3}
                title="Last updated"
                value={formatDateTime(lastUpdated)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
