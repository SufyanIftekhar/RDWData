"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
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
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatDisplayPlate } from "@/lib/rdw/normalize";
import { getVehicleImageUrl } from "@/lib/utils/imagin";
import { useI18n } from "@/lib/i18n/context";
import { hasPaidAccessForPlate } from "@/lib/payments/access";
import styles from "./VehicleResultScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";
import { SubscriptionModal } from "@/components/ui/SubscriptionModal";

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
  if (amount === null || Number.isNaN(amount)) return "N/A";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatNumber(value: number | null, unit?: string) {
  if (value === null || Number.isNaN(value)) return "-";
  return unit ? `${value.toLocaleString("nl-NL")} ${unit}` : value.toLocaleString("nl-NL");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function titleCase(value: string | null) {
  if (!value) return "-";
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
  locale: "nl" | "en";
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
    strong: args.locale === "nl" ? "Sterk resultaat" : "Strong result",
    steady: args.locale === "nl" ? "Stabiel profiel" : "Steady profile",
    mixed: args.locale === "nl" ? "Gemengde signalen" : "Mixed signals",
    caution: args.locale === "nl" ? "Controle nodig" : "Needs review"
  };

  const descriptionByTone: Record<ScoreTone, string> = {
    strong:
      args.locale === "nl"
        ? "Positief eigendoms- en gebruiksprofiel met een sterk vertrouwenssignaal."
        : "Positive ownership and usage profile with a healthy overall confidence signal.",
    steady:
      args.locale === "nl"
        ? "De meeste signalen zijn stabiel, met enkele kleine aandachtspunten."
        : "Most signals look solid with only minor items to double-check.",
    mixed:
      args.locale === "nl"
        ? "Meerdere signalen vragen extra controle voor je beslist."
        : "Several signals need closer attention before making a decision.",
    caution:
      args.locale === "nl"
        ? "Belangrijke signalen vereisen opvolging voordat je doorgaat."
        : "Key signals require follow-up before moving forward."
  };

  const confidence =
    tone === "strong" || tone === "steady"
      ? args.locale === "nl"
        ? "Hoog"
        : "High"
      : tone === "mixed"
      ? args.locale === "nl"
        ? "Middel"
        : "Medium"
      : args.locale === "nl"
      ? "Laag"
      : "Low";
  const riskFlag = args.wok || args.defects > 4 ? (args.locale === "nl" ? "Verhoogd" : "Elevated") : args.locale === "nl" ? "Laag" : "Low";

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

function ScoreModule({
  score,
  locale,
  onDownload
}: {
  score: ScoreResult;
  locale: "nl" | "en";
  onDownload: () => void;
}) {
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
        <div className={styles.scoreTitle}>Kentekenrapport Score</div>
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
            <div className={styles.scoreMax}>{locale === "nl" ? "van 100" : "out of 100"}</div>
          </div>
        </div>
      </div>

      <div className={styles.scoreCopy}>{score.description}</div>

      <div className={styles.scoreMetrics}>
        <div className={styles.scoreMetricCard}>
          <div className={styles.scoreMetricLabel}>{locale === "nl" ? "Betrouwbaarheid" : "Confidence"}</div>
          <div className={styles.scoreMetricValue}>{score.confidence}</div>
        </div>
        <div className={styles.scoreMetricCard}>
          <div className={styles.scoreMetricLabel}>{locale === "nl" ? "Risico-indicatie" : "Risk flag"}</div>
          <div className={styles.scoreMetricValue}>{score.riskFlag}</div>
        </div>
      </div>

      <div className={styles.scoreActions}>
        <button className={styles.actionPrimary} type="button" onClick={onDownload}>
          <Download size={18} />
          {locale === "nl" ? "Rapport downloaden" : "Download Report"}
        </button>
        <div className={styles.actionRow}>
          <button className={styles.actionSecondary} type="button">
            <Bookmark size={16} />
            {locale === "nl" ? "Voertuig opslaan" : "Save Vehicle"}
          </button>
          <button className={styles.actionSecondary} type="button">
            <Share2 size={16} />
            {locale === "nl" ? "Delen" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ locale }: { locale: "nl" | "en" }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingCard}>
        <RefreshCw className={styles.loadingIcon} />
        <p>{locale === "nl" ? "Voertuigrapport ophalen..." : "Fetching vehicle report..."}</p>
      </div>
    </div>
  );
}

function ErrorScreen({ plate, locale }: { plate: string; locale: "nl" | "en" }) {
  return (
    <div className={styles.errorScreen}>
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>
          <ShieldCheck size={20} />
        </div>
        <h1>{locale === "nl" ? "Voertuig niet gevonden" : "Vehicle Not Found"}</h1>
        <p>
          {locale === "nl"
            ? `We konden ${plate} niet vinden of de RDW-service is tijdelijk niet beschikbaar.`
            : `We couldn't find ${plate} or the RDW service is unavailable.`}
        </p>
        <div className={styles.errorActions}>
          <Link href="/" className={styles.errorButton}>
            <ArrowLeft size={16} /> {locale === "nl" ? "Home" : "Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function VehicleResultScreen({ plate }: Props) {
  const { locale } = useI18n();
  const { settings } = useSiteSettings();
  const { normalized, isValid, data, isLoading, isError } = useVehicleLookup(plate);
  const [lastUpdated] = useState(() => new Date());
  const [currentAngle, setCurrentAngle] = useState("01");
  const [showPayment, setShowPayment] = useState(false);
  const [downloadAfterUnlock, setDownloadAfterUnlock] = useState(false);
  const [isPaidForPlate, setIsPaidForPlate] = useState(false);

  const score = useMemo(() => {
    if (!data?.vehicle || !data.enriched) {
      return buildScoreResult({ defects: 0, riskScore: 6, apkPassChance: 78, wok: false, imported: false, locale });
    }

    return buildScoreResult({
      defects: data.defects.length,
      riskScore: data.enriched.maintenanceRiskScore,
      apkPassChance: data.enriched.apkPassChance,
      wok: data.vehicle.wok,
      imported: data.enriched.isImported,
      locale
    });
  }, [data, locale]);

  const normalizedPlate = normalized;
  useEffect(() => {
    if (!normalizedPlate) {
      setIsPaidForPlate(false);
      return;
    }
    setIsPaidForPlate(hasPaidAccessForPlate(normalizedPlate));
  }, [normalizedPlate]);

  if (!isValid || isError) return <ErrorScreen plate={plate} locale={locale} />;
  if (isLoading || !data || !data.enriched) return <LoadingScreen locale={locale} />;

  const v = data.vehicle;
  const e = data.enriched;
  const displayPlate = formatDisplayPlate(normalizedPlate);

  const downloadReport = () => {
    try {
      printVehiclePdfReport({
        plate: normalizedPlate,
        locale,
        generatedAt: new Date(),
        score,
        data
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "nl"
          ? "Kon PDF rapport niet genereren."
          : "Unable to generate PDF report.";
      window.alert(message);
    }
  };

  const handleDownload = () => {
    const downloadRequiresPayment = settings.paymentEnabled && settings.lockSections.reportDownload;
    if (!downloadRequiresPayment) {
      downloadReport();
      return;
    }
    if (isPaidForPlate) {
      downloadReport();
      return;
    }
    setDownloadAfterUnlock(true);
    setShowPayment(true);
  };

  const vehicleTitle = [v.brand, v.tradeName].filter(Boolean).join(" ").trim();
  const vehicleSubtitle = [
    v.engine?.displacement ? `${(v.engine.displacement / 1000).toFixed(1)}L` : null,
    v.fuelType,
    v.engine?.powerKw ? `${Math.round(v.engine.powerKw * 1.36)} HP` : null
  ]
    .filter(Boolean)
    .join(" • ");

  const conditionLabel =
    data.defects.length === 0
      ? locale === "nl"
        ? "Goed onderhouden"
        : "Well maintained"
      : data.defects.length < 3
      ? locale === "nl"
        ? "Kleine aandachtspunten"
        : "Minor issues"
      : locale === "nl"
      ? "Controle nodig"
      : "Needs review";
  const ownersLabel = v.owners.count
    ? locale === "nl"
      ? `${v.owners.count} vorige eigenaar(s)`
      : `${v.owners.count} previous`
    : locale === "nl"
    ? "Onbekend"
    : "Unknown";
  const marketLabel = e.estimatedValueNow
    ? locale === "nl"
      ? "Stabiele vraag"
      : "Stable demand"
    : locale === "nl"
    ? "Marktdata in afwachting"
    : "Market data pending";

  const detailCards = [
    { label: locale === "nl" ? "Brandstof" : "Fuel type", value: titleCase(v.fuelType) },
    {
      label: locale === "nl" ? "APK vervalt" : "APK Expiry",
      value: v.apkExpiryDate ? new Date(v.apkExpiryDate).toLocaleDateString("nl-NL") : locale === "nl" ? "Onbekend" : "Unknown"
    },
    {
      label: locale === "nl" ? "Wegenbelasting (schatting)" : "Road Tax (est)",
      value: e.roadTaxEstQuarter
        ? `€${e.roadTaxEstQuarter.min} - €${e.roadTaxEstQuarter.max} / qtr`
        : locale === "nl"
        ? "Onbekend"
        : "Unknown"
    },
    { label: locale === "nl" ? "Deuren" : "Doors", value: formatNumber(v.doors) },
    { label: locale === "nl" ? "Zitplaatsen" : "Seats", value: formatNumber(v.seats) },
    { label: locale === "nl" ? "Kleur" : "Color", value: titleCase(v.color.primary) },
    { label: locale === "nl" ? "Leeggewicht" : "Empty weight", value: formatNumber(v.weight?.empty, "kg") }
  ];



  return (
    <div className={styles.page}>
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <VehicleNavBar plate={normalizedPlate} />

          <div className={styles.heroShell}>
            <div className={styles.heroCard}>
              <div className={styles.heroImagePanel}>
                <div className={styles.heroImageWrapper}>
                  <Image
                    alt={`${v.brand} ${v.tradeName}`}
                    src={getVehicleImageUrl(v.brand, v.tradeName, {
                      angle: currentAngle,
                      zoomtype: "relative",
                      color: v.color?.primary ?? null
                    })}
                    width={580}
                    height={340}
                    className="h-full w-full object-contain transition-all duration-500"
                    priority
                    unoptimized
                  />
                  <div className={styles.imageOverlayTag}>
                    <Camera size={14} />
                    IMAGIN.studio
                  </div>
                  
                  <div className={styles.angleSwitcher}>
                    {["01", "09", "28"].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setCurrentAngle(angle)}
                        className={`${styles.angleBtn} ${currentAngle === angle ? styles.angleBtnActive : ""}`}
                        type="button"
                        title={locale === "nl" ? `Bekijk hoek ${angle}` : `View angle ${angle}`}
                      >
                        {angle === "01" && <span className="text-[10px]">{locale === "nl" ? "Voor" : "Front"}</span>}
                        {angle === "09" && <span className="text-[10px]">{locale === "nl" ? "Zij" : "Side"}</span>}
                        {angle === "28" && <span className="text-[10px]">{locale === "nl" ? "Achter" : "Rear"}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.imageMetaRow}>
                  <MetaCard label={locale === "nl" ? "Conditie" : "Condition"} value={conditionLabel} />
                  <MetaCard label={locale === "nl" ? "Eigenaren" : "Owners"} value={ownersLabel} />
                  <MetaCard label={locale === "nl" ? "Markt" : "Market"} value={marketLabel} />
                </div>
              </div>

              <div className={styles.heroInfo}>
                <div className={styles.eyebrowRow}>
                  <div className={styles.eyebrowPill}>
                    <ShieldCheck size={14} />
                    {locale === "nl" ? "Vertrouwde databron" : "Trusted data source"}
                  </div>
                </div>

                <LicensePlate plate={displayPlate} />

                <div className={styles.vehicleTitleBlock}>
                  <div className={styles.carTitle}>
                    {vehicleTitle || (locale === "nl" ? "Voertuigoverzicht" : "Vehicle overview")}
                    {v.year ? ` ${v.year}` : ""}
                  </div>
                  <div className={styles.carSubtitle}>
                    {vehicleSubtitle ||
                      (locale === "nl"
                        ? "Snelle samenvatting van identiteit, aandrijving, gebruik en score voor een snellere beslissing."
                        : "Quick summary of the vehicle identity, drivetrain, usage, and score so you can decide faster.")}
                  </div>
                </div>

                <div className={styles.carSpecsChips}>
                  <SpecChip icon={Fuel} label={titleCase(v.fuelType)} />
                  <SpecChip icon={Settings2} label={v.emissionStandard ?? (locale === "nl" ? "Emissienorm" : "Emission standard")} />
                  <SpecChip icon={Gauge} label={v.napVerdict ? `NAP ${v.napVerdict}` : locale === "nl" ? "NAP onbekend" : "NAP unknown"} />
                  <SpecChip icon={BadgeCheck} label={v.year ? v.year.toString() : locale === "nl" ? "Bouwjaar" : "Year"} />
                </div>

                <div className={styles.detailGrid}>
                  {detailCards.map((card) => (
                    <DetailCard key={card.label} label={card.label} value={card.value} />
                  ))}
                </div>
              </div>

              <div className={styles.heroActions}>
                <ScoreModule score={score} locale={locale} onDownload={handleDownload} />
              </div>
            </div>

            <div className={styles.insightStrip}>
              <InsightCard
                icon={BadgeCheck}
                title={locale === "nl" ? "Registratiestatus" : "Registration status"}
                value={v.transferPossible ? (locale === "nl" ? "Geldig en actief" : "Valid and active") : locale === "nl" ? "Overdracht beperkt" : "Transfer restricted"}
              />
              <InsightCard
                icon={Wrench}
                title={locale === "nl" ? "Onderhoudssignaal" : "Service signal"}
                value={data.defects.length < 3 ? (locale === "nl" ? "Historie lijkt consistent" : "History looks consistent") : locale === "nl" ? "Onderhoud gemarkeerd" : "Maintenance flagged"}
              />
              <InsightCard
                icon={Coins}
                title={locale === "nl" ? "Geschatte waarde" : "Estimated value"}
                value={formatCurrency(e.estimatedValueNow)}
              />
              <InsightCard
                icon={Clock3}
                title={locale === "nl" ? "Laatst bijgewerkt" : "Last updated"}
                value={formatDateTime(lastUpdated)}
              />
            </div>
          </div>
        </div>
      </div>
      <SubscriptionModal
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          setDownloadAfterUnlock(false);
        }}
        featureName={locale === "nl" ? "Rapportdownload en premium toegang" : "Report download and premium access"}
        plate={normalizedPlate}
        onUnlocked={() => {
          setIsPaidForPlate(true);
          if (downloadAfterUnlock) {
            downloadReport();
          }
          setDownloadAfterUnlock(false);
        }}
      />
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printVehiclePdfReport(args: {
  plate: string;
  locale: "nl" | "en";
  generatedAt: Date;
  score: ScoreResult;
  data: unknown;
}) {
  const { plate, locale, generatedAt, score, data } = args;
  const d = data as Record<string, unknown>;
  const vehicle = (d.vehicle ?? {}) as Record<string, unknown>;
  const enriched = (d.enriched ?? {}) as Record<string, unknown>;
  const inspections = Array.isArray(d.inspections) ? (d.inspections as Array<Record<string, unknown>>) : [];
  const defects = Array.isArray(d.defects) ? (d.defects as Array<Record<string, unknown>>) : [];
  const recalls = Array.isArray(d.recalls) ? (d.recalls as Array<Record<string, unknown>>) : [];
  const defectDescriptions = (d.defectDescriptions ?? {}) as Record<string, string>;

  const escape = (value: unknown) => escapeHtml(String(value ?? "-"));
  const reportTitle = locale === "nl" ? "Voertuigrapport" : "Vehicle Report";
  const generatedLabel = locale === "nl" ? "Gegenereerd op" : "Generated at";
  const jsonRaw = escapeHtml(JSON.stringify(data, null, 2));

  const inspectionsRows = inspections
    .map(
      (item) =>
        `<tr><td>${escape(item.meld_datum_door_keuringsinstantie_dt ?? item.meld_datum_door_keuringsinstantie ?? "-")}</td><td>${escape(item.gebrek_identificatie ?? "-")}</td><td>${escape(item.soort_erkenning_omschrijving ?? "-")}</td><td>${escape(item.aantal_gebreken_geconstateerd ?? "-")}</td></tr>`
    )
    .join("");

  const defectsRows = defects
    .map((item) => {
      const defectCode = String(item.gebrek_identificatie ?? "-");
      return `<tr><td>${escape(defectCode)}</td><td>${escape(item.gebrek_omschrijving ?? defectDescriptions[defectCode] ?? "-")}</td><td>${escape(item.toelichting ?? "-")}</td></tr>`;
    })
    .join("");

  const recallsRows = recalls
    .map(
      (item) =>
        `<tr><td>${escape(item.campagnenummer ?? "-")}</td><td>${escape(item.omschrijving_defect ?? "-")}</td><td>${escape(item.status ?? "-")}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escape(reportTitle)} ${escape(plate)}</title>
  <style>
    body { font-family: Arial, sans-serif; color:#0f172a; margin:24px; line-height:1.4; }
    h1,h2 { margin:0 0 8px; }
    h1 { font-size:24px; }
    h2 { font-size:16px; margin-top:24px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; }
    .meta { color:#475569; font-size:12px; margin-bottom:16px; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .card { border:1px solid #e2e8f0; border-radius:8px; padding:10px; }
    .label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.04em; }
    .value { font-size:14px; font-weight:600; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
    th,td { border:1px solid #e2e8f0; text-align:left; padding:6px; vertical-align:top; }
    th { background:#f8fafc; }
    pre { white-space:pre-wrap; word-break:break-word; border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc; font-size:11px; }
    @page { size:A4; margin:14mm; }
  </style>
</head>
<body>
  <h1>${escape(reportTitle)} - ${escape(formatDisplayPlate(plate))}</h1>
  <div class="meta">${escape(generatedLabel)}: ${escape(generatedAt.toLocaleString(locale === "nl" ? "nl-NL" : "en-US"))}</div>

  <h2>${escape(locale === "nl" ? "Samenvatting" : "Summary")}</h2>
  <div class="grid">
    <div class="card"><div class="label">${escape(locale === "nl" ? "Voertuig" : "Vehicle")}</div><div class="value">${escape(`${String(vehicle.brand ?? "")} ${String(vehicle.tradeName ?? "")}`.trim())}</div></div>
    <div class="card"><div class="label">${escape(locale === "nl" ? "Bouwjaar" : "Year")}</div><div class="value">${escape(vehicle.year ?? "-")}</div></div>
    <div class="card"><div class="label">${escape(locale === "nl" ? "Brandstof" : "Fuel")}</div><div class="value">${escape(vehicle.fuelType ?? "-")}</div></div>
    <div class="card"><div class="label">Score</div><div class="value">${escape(score.score)} / 100 (${escape(score.label)})</div></div>
  </div>

  <h2>${escape(locale === "nl" ? "Technische gegevens" : "Technical details")}</h2>
  <table>
    <tr><th>${escape(locale === "nl" ? "Veld" : "Field")}</th><th>${escape(locale === "nl" ? "Waarde" : "Value")}</th></tr>
    <tr><td>APK</td><td>${escape(vehicle.apkExpiryDate ?? "-")}</td></tr>
    <tr><td>${escape(locale === "nl" ? "Leeggewicht" : "Empty weight")}</td><td>${escape((vehicle.weight as Record<string, unknown> | undefined)?.empty ?? "-")} kg</td></tr>
    <tr><td>CO2</td><td>${escape(vehicle.co2 ?? "-")}</td></tr>
    <tr><td>${escape(locale === "nl" ? "Energielabel" : "Energy label")}</td><td>${escape(vehicle.energyLabel ?? "-")}</td></tr>
    <tr><td>${escape(locale === "nl" ? "Onderhoudsrisico" : "Maintenance risk")}</td><td>${escape(enriched.maintenanceRiskScore ?? "-")}</td></tr>
  </table>

  <h2>${escape(locale === "nl" ? "APK inspecties" : "APK inspections")}</h2>
  <table>
    <tr><th>${escape(locale === "nl" ? "Datum" : "Date")}</th><th>${escape(locale === "nl" ? "Gebrek code" : "Defect code")}</th><th>${escape(locale === "nl" ? "Type" : "Type")}</th><th>${escape(locale === "nl" ? "Aantal" : "Count")}</th></tr>
    ${inspectionsRows || `<tr><td colspan="4">-</td></tr>`}
  </table>

  <h2>${escape(locale === "nl" ? "Defecten" : "Defects")}</h2>
  <table>
    <tr><th>${escape(locale === "nl" ? "Code" : "Code")}</th><th>${escape(locale === "nl" ? "Omschrijving" : "Description")}</th><th>${escape(locale === "nl" ? "Toelichting" : "Notes")}</th></tr>
    ${defectsRows || `<tr><td colspan="3">-</td></tr>`}
  </table>

  <h2>${escape(locale === "nl" ? "Terugroepacties" : "Recalls")}</h2>
  <table>
    <tr><th>${escape(locale === "nl" ? "Campagne" : "Campaign")}</th><th>${escape(locale === "nl" ? "Defect" : "Defect")}</th><th>Status</th></tr>
    ${recallsRows || `<tr><td colspan="3">-</td></tr>`}
  </table>

  <h2>${escape(locale === "nl" ? "Volledige ruwe data (JSON)" : "Full raw data (JSON)")}</h2>
  <pre>${jsonRaw}</pre>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    throw new Error(
      locale === "nl"
        ? "Popup geblokkeerd. Sta popups toe om de PDF te downloaden."
        : "Popup blocked. Allow popups to download the PDF."
    );
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
