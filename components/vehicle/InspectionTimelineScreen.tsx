"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Repeat,
  ShieldCheck,
  TriangleAlert,
  XCircle
} from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import styles from "./InspectionTimelineScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";

type Props = {
  plate: string;
};

type InspectionEvent = {
  id: string;
  date: string;
  mileage: number | null;
  result: "pass" | "advisory" | "fail";
  notes: string;
  defects: Array<{ code: string; description: string; recurring: boolean }>
};

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(parsed);
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("nl-NL");
}

function parseMileage(record: Record<string, unknown>): number | null {
  const candidates = [
    record.tellerstand,
    record.km_stand,
    record.kilometerstand,
    record.mileage,
    record.odo_reading
  ];
  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function parseDate(record: Record<string, unknown>): string | null {
  const candidates = [
    record.datum_keuring,
    record.datum_keuring_dt,
    record.meld_datum_door_keuringsinstantie,
    record.datum,
    record.datum_dt
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function parseResult(record: Record<string, unknown>): "pass" | "advisory" | "fail" {
  const raw = String(
    record.keuringsresultaat ??
      record.keuringsoordeel ??
      record.oordeel ??
      record.resultaat ??
      ""
  ).toLowerCase();
  if (raw.includes("afkeur") || raw.includes("fail") || raw.includes("reject")) return "fail";
  if (raw.includes("advies") || raw.includes("advis")) return "advisory";
  if (raw.includes("goedgekeurd")) return "pass";
  if (raw.includes("goed")) return "pass";
  if (raw.includes("herkeur") || raw.includes("retest")) return "advisory";
  if (raw.includes("advies") || raw.includes("advis")) return "advisory";
  return "pass";
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  if (value.includes("T")) return value.split("T")[0];
  return value;
}

function parseDefectCode(record: Record<string, unknown>): string | null {
  const value = record.gebrek_identificatie ?? record.gebrek_identificatienummer ?? record.gebrek_code;
  if (!value) return null;
  return String(value);
}

function nodeIcon(result: InspectionEvent["result"]) {
  if (result === "fail") return <XCircle size={24} />;
  if (result === "advisory") return <TriangleAlert size={24} />;
  return <CheckCheck size={24} />;
}

function statusBadge(result: InspectionEvent["result"]) {
  if (result === "fail") return { label: "Fail", className: "badgeFail" };
  if (result === "advisory") return { label: "Pass with advisory", className: "badgeAdvisory" };
  return { label: "Pass", className: "badgePass" };
}

export function InspectionTimelineScreen({ plate }: Props) {
  const { isValid, data, isLoading, isError } = useVehicleLookup(plate);
  const [filter, setFilter] = useState<"all" | "pass" | "advisory" | "fail">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const events = useMemo(() => {
    if (!data?.inspections) return [] as InspectionEvent[];

    const inspectionByDate = new Map<string, { date: string; mileage: number | null; results: Set<InspectionEvent["result"]> }>();
    for (const record of data.inspections) {
      const rawDate = parseDate(record);
      const date = normalizeDate(rawDate);
      if (!date) continue;
      const mileage = parseMileage(record);
      const result = parseResult(record);

      if (!inspectionByDate.has(date)) {
        inspectionByDate.set(date, { date, mileage, results: new Set() });
      }
      const entry = inspectionByDate.get(date)!;
      entry.results.add(result);
      if (entry.mileage === null && mileage !== null) entry.mileage = mileage;
    }

    const defectsByDate = new Map<string, Map<string, number>>();
    const defectSources = [...(data.defects ?? []), ...(data.inspections ?? [])];
    for (const record of defectSources) {
      const rawDate = parseDate(record);
      const date = normalizeDate(rawDate);
      const code = parseDefectCode(record);
      if (!date || !code) continue;
      const count = Number(record.aantal_gebreken_geconstateerd ?? 1);
      if (!defectsByDate.has(date)) defectsByDate.set(date, new Map<string, number>());
      const byCode = defectsByDate.get(date)!;
      byCode.set(code, (byCode.get(code) ?? 0) + (Number.isFinite(count) ? count : 1));
    }

    const defectCounts: Record<string, number> = {};
    for (const byCode of defectsByDate.values()) {
      for (const [code] of byCode) {
        defectCounts[code] = (defectCounts[code] ?? 0) + 1;
      }
    }

    const mapped = Array.from(inspectionByDate.values()).map((entry, index) => {
      const result: InspectionEvent["result"] = entry.results.has("fail")
        ? "fail"
        : entry.results.has("advisory")
        ? "advisory"
        : "pass";

      const defects = Array.from(defectsByDate.get(entry.date)?.entries() ?? []).map(([code]) => ({
        code,
        description: data.defectDescriptions[code] ?? "Defect recorded",
        recurring: (defectCounts[code] ?? 0) > 1
      }));

      const notes = result === "fail"
        ? "This inspection failed and should be reviewed carefully."
        : result === "advisory"
        ? "Passed with advisories; review recurring issues."
        : "Clean pass with no listed defects or advisories.";

      return {
        id: `inspection-${index}`,
        date: entry.date,
        mileage: entry.mileage,
        result,
        notes,
        defects
      };
    });

    return mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const filteredEvents = events.filter((event) => (filter === "all" ? true : event.result === filter));
  const latestEvent = events[0];

  const recurringDefect = events
    .flatMap((event) => event.defects)
    .find((defect) => defect.recurring)?.description;

  const passRate = events.length
    ? Math.round((events.filter((event) => event.result !== "fail").length / events.length) * 100)
    : 0;

  const repairChances = data?.enriched?.repairChances ?? [];
  const knownIssues = data?.enriched?.knownIssues ?? [];

  if (!isValid || isError) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>Vehicle not found.</div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>Loading inspection timeline...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <VehicleNavBar plate={plate} subtitle="Inspection timeline" />

        <div className={`${styles.heroPanel} ${styles.surfacePanel}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <ShieldCheck size={14} /> Inspection activity timeline
              </div>
              <div className={styles.heroTitle}>APK inspection history with recurring defect tracking</div>
              <div className={styles.heroSubtitle}>
                Review each inspection event, compare recorded mileage, and quickly scan which defects appeared once
                versus which issues returned across multiple inspections.
              </div>
              <div className={styles.heroStatRow}>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatLabel}>Latest inspection</div>
                  <div className={styles.heroStatValue}>{latestEvent ? formatDate(latestEvent.date) : "—"}</div>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatLabel}>Recorded mileage</div>
                  <div className={styles.heroStatValue}>
                    {latestEvent?.mileage ? `${formatNumber(latestEvent.mileage)} km` : "—"}
                  </div>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatLabel}>Timeline health</div>
                  <div className={styles.heroStatValue}>{data.vehicle.napVerdict ?? "Stable pattern"}</div>
                </div>
              </div>
            </div>
            <div className={styles.statusCard}>
              <div className={styles.statusCardTop}>
                <div>
                  <div className={styles.statusLabel}>Inspection status</div>
                  <div className={styles.statusValue}>
                    {data.vehicle.apkExpiryDate ? `Valid until ${formatDate(data.vehicle.apkExpiryDate)}` : "Unknown"}
                  </div>
                </div>
                <div className={styles.statusChip}>
                  <BadgeCheck size={14} /> Active
                </div>
              </div>
              <div className={styles.statusProgress}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} />
                </div>
                <div className={styles.statusMeta}>
                  <span>Roadworthiness confidence</span>
                  <span>84%</span>
                </div>
              </div>
              <div className={styles.badgeRow}>
                <div className={styles.miniChip}>{events.length} inspections reviewed</div>
                <div className={styles.miniChip}>
                  {recurringDefect ? "1 recurring issue" : "No recurring issues"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.controlsGrid} ${styles.surfacePanel}`}>
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterPill} ${filter === "all" ? styles.filterActive : ""}`}
              type="button"
              onClick={() => setFilter("all")}
            >
              All events
            </button>
            <button
              className={`${styles.filterPill} ${filter === "pass" ? styles.filterActive : ""}`}
              type="button"
              onClick={() => setFilter("pass")}
            >
              Passed
            </button>
            <button
              className={`${styles.filterPill} ${filter === "advisory" ? styles.filterActive : ""}`}
              type="button"
              onClick={() => setFilter("advisory")}
            >
              Advisories
            </button>
            <button
              className={`${styles.filterPill} ${filter === "fail" ? styles.filterActive : ""}`}
              type="button"
              onClick={() => setFilter("fail")}
            >
              Failed
            </button>
          </div>
          <div className={styles.summaryNote}>
            <Repeat size={14} />
            {recurringDefect ? `${recurringDefect} appears more than once` : "No recurring defects"}
          </div>
        </div>

        <div className={styles.timelineShell}>
          <div className={`${styles.insightPanel} ${styles.surfacePanel}`}>
            <div className={styles.insightTitle}>Inspection insights</div>
            <div className={styles.insightCopy}>
              A quick risk summary based on outcomes, mileage consistency, and repeated defect themes across the visible
              record.
            </div>
            <div className={styles.signalCard}>
              <div className={styles.signalLabel}>Pass rate</div>
              <div className={styles.signalValue}>{passRate}%</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.signalLabel}>Recurring defects</div>
              <div className={styles.signalValue}>{recurringDefect ?? "None detected"}</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.signalLabel}>Highest concern event</div>
              <div className={styles.signalValue}>
                {events.find((event) => event.result === "fail")?.date
                  ? formatDate(events.find((event) => event.result === "fail")?.date ?? "")
                  : "No failed inspections"}
              </div>
            </div>
          </div>

          <div className={`${styles.timelinePanel} ${styles.surfacePanel}`}>
            <div className={styles.timelineHeaderRow}>
              <div>
                <div className={styles.timelineTitle}>Inspection event timeline</div>
                <div className={styles.timelineSubtitle}>
                  Each marker opens the detailed history view. Events with advisories or failures are visually elevated
                  so recurring defects stand out faster.
                </div>
              </div>
              <div className={styles.badgeRow}>
                <div className={styles.miniChip}>Clickable markers</div>
                <div className={styles.miniChip}>Expanded defect lists</div>
              </div>
            </div>

            <div className={styles.timelineList}>
              {filteredEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <AlertCircle size={18} /> No inspection events match this filter.
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const badge = statusBadge(event.result);
                  const highlight = event.result === "fail" ? styles.highlightDestructive : event.result === "advisory" ? styles.highlightWarning : "";
                  const nodeClass = event.result === "fail" ? styles.nodeDestructive : event.result === "advisory" ? styles.nodeWarning : styles.nodeSuccess;
                  const isExpanded = expanded[event.id] ?? true;
                  return (
                    <div key={event.id} className={styles.timelineItem}>
                      <div className={styles.timelineMeta}>
                        <div className={styles.timelineDate}>{formatDate(event.date)}</div>
                        <div className={styles.timelineMileage}>
                          {event.mileage ? `${formatNumber(event.mileage)} km` : "—"}
                        </div>
                      </div>
                      <div className={`${styles.timelineNode} ${nodeClass}`}>
                        {nodeIcon(event.result)}
                      </div>
                      <div className={`${styles.timelineCard} ${highlight}`}>
                        <div className={styles.cardTop}>
                          <div className={styles.cardTitleBlock}>
                            <div className={styles.inspectionTitle}>Routine inspection</div>
                            <div className={styles.inspectionNote}>{event.notes}</div>
                          </div>
                          <div className={styles.badgeRow}>
                            <div className={`${styles.statusBadge} ${styles[badge.className]}`}>{badge.label}</div>
                            <div className={styles.miniChip}>{event.defects.length} item</div>
                          </div>
                        </div>

                        {event.defects.length === 0 ? (
                          <div className={styles.emptyState}>
                            <AlertCircle size={18} /> No defects reported for this inspection.
                          </div>
                        ) : (
                          <div className={styles.defectStack}>
                            <div className={styles.defectToolbar}>
                              <div className={styles.defectTitle}>Expandable defect list</div>
                              <button
                                className={styles.expandLink}
                                type="button"
                                onClick={() =>
                                  setExpanded((prev) => ({ ...prev, [event.id]: !isExpanded }))
                                }
                              >
                                {isExpanded ? "Collapse details" : "Expand details"}
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            {isExpanded ? (
                              <div className={styles.defectGrid}>
                                {event.defects.map((defect) => (
                                  <div key={defect.code} className={styles.defectItem}>
                                    <div className={`${styles.defectIcon} ${nodeClass}`}>
                                      <TriangleAlert size={18} />
                                    </div>
                                    <div className={styles.defectCopy}>
                                      <div className={styles.defectName}>Defect {defect.code}</div>
                                      <div className={styles.defectDesc}>{defect.description}</div>
                                      {defect.recurring ? (
                                        <div className={styles.recurringTag}>
                                          <Repeat size={12} /> Recurring defect
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className={styles.repairDeck}>
          <div className={styles.repairCard}>
            <div className={styles.repairHeader}>Repair chances</div>
            {repairChances.length ? (
              <div className={styles.repairList}>
                {repairChances.map((item) => (
                  <div key={item.name} className={styles.repairRow}>
                    <div>
                      <div className={styles.repairTitle}>{item.name}</div>
                      <div className={styles.repairMeta}>Chance: {item.chance}%</div>
                    </div>
                    <div className={styles.repairRange}>€{item.estMin.toLocaleString()}–€{item.estMax.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.repairEmpty}>No repair chances reported.</div>
            )}
          </div>

          <div className={styles.repairCard}>
            <div className={styles.repairHeader}>Known issues</div>
            {knownIssues.length ? (
              <div className={styles.repairList}>
                {knownIssues.map((issue) => (
                  <div key={issue.title} className={styles.repairRow}>
                    <div>
                      <div className={styles.repairTitle}>{issue.title}</div>
                      <div className={styles.repairMeta}>{issue.target} • {issue.severity}</div>
                    </div>
                    <div className={styles.issueAdvice}>{issue.advice}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.repairEmpty}>No known issues stored.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
