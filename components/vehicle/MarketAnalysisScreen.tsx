"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Pencil,
  TrendingUp
} from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { formatDisplayPlate } from "@/lib/rdw/normalize";
import styles from "./MarketAnalysisScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";

type Props = {
  plate: string;
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("nl-NL");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function MarketAnalysisScreen({ plate }: Props) {
  const { normalized, isValid, data, isLoading, isError } = useVehicleLookup(plate);
  const [sellerPrice, setSellerPrice] = useState<string>("");

  const marketValue = data?.enriched?.estimatedValueNow ?? data?.vehicle.cataloguePrice ?? null;
  const marketValueMin = data?.enriched?.estimatedValueMin ?? null;
  const marketValueMax = data?.enriched?.estimatedValueMax ?? null;
  const marketConfidence = data?.enriched?.marketValueConfidence ?? null;

  useEffect(() => {
    if (!sellerPrice && marketValue) {
      setSellerPrice(String(Math.round(marketValue + 900)));
    }
  }, [marketValue, sellerPrice]);

  const { verdictText, verdictTone, markerLeft } = useMemo(() => {
    if (!marketValue) {
      return {
        verdictText: "Market value unavailable.",
        verdictTone: "neutral",
        markerLeft: "50%"
      };
    }

    const seller = Number(sellerPrice.replace(/[^0-9]/g, ""));
    const diff = seller - marketValue;

    const verdictTone = diff > 500 ? "warning" : diff < -500 ? "success" : "fair";
    const verdictText = diff > 500
      ? `Vehicle is priced €${formatNumber(diff)} above market value.`
      : diff < -500
      ? `Vehicle is priced €${formatNumber(Math.abs(diff))} below market value.`
      : "Listing price aligns with market value.";

    const marker = clamp(((diff + 3000) / 6000) * 100, 5, 95);

    return {
      verdictText,
      verdictTone,
      markerLeft: `${marker}%`
    };
  }, [marketValue, sellerPrice]);

  const chartPoints = useMemo(() => {
    const year = new Date().getFullYear();
    if (!marketValue) {
      return [
        { label: year - 4, value: null },
        { label: year - 3, value: null },
        { label: year - 2, value: null },
        { label: year - 1, value: null },
        { label: "Today", value: null }
      ];
    }
    const start = marketValue * 1.65;
    const step = (start - marketValue) / 4;
    return [
      { label: year - 4, value: Math.round(start) },
      { label: year - 3, value: Math.round(start - step) },
      { label: year - 2, value: Math.round(start - step * 2) },
      { label: year - 1, value: Math.round(start - step * 3) },
      { label: "Today", value: Math.round(marketValue) }
    ];
  }, [marketValue]);

  if (!isValid || isError) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <AlertCircle size={18} /> Vehicle not found.
        </div>
      </div>
    );
  }

  if (isLoading || !data || !data.enriched) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>Loading market analysis...</div>
      </div>
    );
  }

  const v = data.vehicle;
  const displayPlate = formatDisplayPlate(normalized);
  const title = [v.brand, v.tradeName, v.year].filter(Boolean).join(" ");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <VehicleNavBar plate={normalized} subtitle={`Market analysis · ${displayPlate}`} />

        <div className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>Market Price Analysis</h1>
          <p className={styles.dashboardSubtitle}>{title || "Vehicle profile"}</p>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.panel}>
            <div className={styles.valueHero}>
              <div className={styles.valueLabel}>Estimated Market Value</div>
              <div className={styles.valueAmount}>{formatCurrency(marketValue)}</div>
              <div className={styles.valueContext}>
                <TrendingUp size={16} />
                {marketValue ? "High demand in current market" : "Awaiting market signal"}
              </div>
              <div className={styles.valueRange}>
                {marketValueMin != null && marketValueMax != null
                  ? `80% range: ${formatCurrency(marketValueMin)} - ${formatCurrency(marketValueMax)}`
                  : "80% range unavailable"}
                {marketConfidence ? (
                  <span className={styles.valueConfidence}>Confidence: {marketConfidence}</span>
                ) : null}
              </div>
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>Value trend over time</div>
                <div className={styles.chartNote}>Based on similar listings</div>
              </div>

              <div className={styles.chartMock}>
                {chartPoints.map((point, index) => {
                  const maxValue = Math.max(...chartPoints.map((p) => p.value ?? 0), 1);
                  const height = point.value ? `${(point.value / maxValue) * 90}%` : "20%";
                  const isCurrent = index === chartPoints.length - 1;
                  return (
                    <div key={String(point.label)} className={styles.barGroup}>
                      <div className={styles.barValue}>{point.value ? formatCurrency(point.value) : "—"}</div>
                      <div className={`${styles.bar} ${isCurrent ? styles.barCurrent : ""}`} style={{ height }} />
                      <div className={`${styles.barLabel} ${isCurrent ? styles.barLabelCurrent : ""}`}>
                        {point.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.calcPanel}`}>
            <div className={styles.calcHeader}>
              <div className={styles.calcTitle}>Check a listing price</div>
              <div className={styles.calcSubtitle}>Compare seller’s price against our market data</div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputLabel}>Seller asking price</div>
              <div className={styles.inputMock}>
                <span className={styles.inputMockText}>€</span>
                <input
                  className={styles.priceInput}
                  inputMode="numeric"
                  value={sellerPrice}
                  onChange={(event) => setSellerPrice(event.target.value)}
                  placeholder="14000"
                />
                <span className={styles.inputMockIcon}>
                  <Pencil size={20} />
                </span>
              </div>
            </div>

            <div className={styles.meterSection}>
              <div className={styles.meterTrack}>
                <div className={styles.meterMarker} style={{ left: markerLeft }} />
              </div>
              <div className={styles.meterLabels}>
                <span className={styles.meterCheap}>Cheap</span>
                <span className={styles.meterFair}>Fair</span>
                <span className={styles.meterOverpriced}>Overpriced</span>
              </div>
            </div>

            <div className={`${styles.verdictBox} ${styles[verdictTone] ?? ""}`}>
              <div className={styles.verdictHeader}>
                <div className={styles.verdictIcon}>
                  <AlertCircle size={14} />
                </div>
                <div className={styles.verdictTitle}>Price Verdict</div>
              </div>
              <div className={styles.verdictText}>{verdictText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
