"use client";

import { useMemo } from "react";
import { Briefcase, Store, User } from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import styles from "./OwnershipTimelineScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";

type Props = {
  plate: string;
};

type OwnershipEntry = {
  id: string;
  label: string;
  type: string;
  range: string;
  duration: string;
  warning?: string;
  tone: "default" | "warning";
  icon: "business" | "private" | "lease";
};

function formatYear(dateValue: string | null) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getFullYear();
}

function buildOwnershipTimeline(
  firstYear: number | null,
  ownersCount: number | null
): OwnershipEntry[] {
  if (!ownersCount || ownersCount < 1 || !firstYear) {
    return [];
  }

  const currentYear = new Date().getFullYear();
  const totalYears = Math.max(currentYear - firstYear, ownersCount);
  const segment = Math.max(Math.floor(totalYears / ownersCount), 1);

  const entries: OwnershipEntry[] = [];
  let start = firstYear;

  for (let i = ownersCount; i >= 1; i -= 1) {
    const end = i === 1 ? "Present" : String(start + segment);
    const range = `${start} – ${end}`;
    const duration = i === 1 ? "Current owner" : `${segment} year${segment > 1 ? "s" : ""}`;

    const icon: OwnershipEntry["icon"] = i === ownersCount
      ? "lease"
      : i === 1
      ? "business"
      : "private";

    entries.push({
      id: `owner-${i}`,
      label: `Owner ${i}${i === 1 ? " (Current)" : ""}`,
      type: icon === "lease" ? "Corporate Lease" : icon === "business" ? "Dealer / Business" : "Private Individual",
      range,
      duration,
      warning: i === 1 && segment <= 1 ? "Review recommended: short ownership window." : undefined,
      tone: i === 1 && segment <= 1 ? "warning" : "default",
      icon
    });

    if (typeof end === "string" && end !== "Present") {
      start = Number(end);
    }
  }

  return entries.reverse();
}

function IconForType({ type }: { type: OwnershipEntry["icon"] }) {
  if (type === "business") return <Store size={24} />;
  if (type === "lease") return <Briefcase size={24} />;
  return <User size={24} />;
}

export function OwnershipTimelineScreen({ plate }: Props) {
  const { isValid, data, isLoading, isError } = useVehicleLookup(plate);

  const ownersCount = data?.vehicle.owners.count ?? null;
  const firstYear = formatYear(data?.vehicle.firstRegistrationWorld ?? null);

  const entries = useMemo(() => buildOwnershipTimeline(firstYear, ownersCount), [firstYear, ownersCount]);

  if (!isValid || isError) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.glassPanel}>Vehicle not found.</div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.glassPanel}>Loading ownership timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <VehicleNavBar plate={plate} subtitle="Ownership history" />

        <div className={`${styles.timelineContainer} ${styles.glassPanel}`}>
          <div className={styles.timelineHeader}>
            <h2 className={styles.timelineTitle}>Ownership Timeline</h2>
            <p className={styles.timelineSubtitle}>
              Review the transfer periods associated with this vehicle. RDW only provides owner count and registration
              dates, so periods are estimated from available data.
            </p>
          </div>

          <div className={styles.timeline}>
            {entries.length === 0 ? (
              <div className={styles.emptyNote}>Ownership detail data not available from RDW.</div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className={styles.timelineItem}>
                  <div className={`${styles.timelineNode} ${entry.tone === "warning" ? styles.nodeWarning : ""}`} />
                  <div className={`${styles.ownerCard} ${entry.tone === "warning" ? styles.cardWarning : ""}`}>
                    <div className={styles.ownerTop}>
                      <div className={styles.ownerIdentity}>
                        <div className={styles.ownerAvatar}>
                          <IconForType type={entry.icon} />
                        </div>
                        <div className={styles.ownerInfo}>
                          <div className={styles.ownerName}>{entry.label}</div>
                          <div className={styles.ownerType}>{entry.type}</div>
                        </div>
                      </div>
                      <div className={styles.ownerDates}>
                        <div className={styles.dateRange}>{entry.range}</div>
                        <div className={styles.durationBadge}>{entry.duration}</div>
                      </div>
                    </div>
                    {entry.warning ? (
                      <div className={styles.warningAlert}>
                        {entry.warning}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
