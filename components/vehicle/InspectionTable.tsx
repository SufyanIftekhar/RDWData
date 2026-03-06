import type { RdwRecord } from "@/lib/rdw/types";
import { ShieldCheck, AlertTriangle, CalendarClock, Hash } from "lucide-react";

type Props = {
  items: RdwRecord[];
  descriptions: Record<string, string>;
};

type InspectionGroup = {
  dateRaw: string;
  dateDisplay: string;
  defects: { code: string; count: number; desc?: string }[];
};

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const s = String(raw).replace(/\D/g, "");
  if (s.length === 8) return `${s.slice(6, 8)}-${s.slice(4, 6)}-${s.slice(0, 4)}`;
  if ((raw as string).includes("T")) return (raw as string).split("T")[0];
  return raw as string;
}

function groupByDate(items: RdwRecord[], dict: Record<string, string>): InspectionGroup[] {
  const map = new Map<string, InspectionGroup>();
  for (const item of items) {
    const dateRaw = String(item.meld_datum_door_keuringsinstantie ?? "");
    if (!map.has(dateRaw)) {
      map.set(dateRaw, { dateRaw, dateDisplay: formatDate(dateRaw), defects: [] });
    }
    const code = String(item.gebrek_identificatie ?? "—");
    const count = Number(item.aantal_gebreken_geconstateerd ?? 0);
    const desc = dict[code];
    map.get(dateRaw)!.defects.push({ code, count, desc });
  }
  return Array.from(map.values()).sort((a, b) => b.dateRaw.localeCompare(a.dateRaw));
}

/** Named export to match VehicleResultScreen import */
export function InspectionTimeline({ items, descriptions }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5">
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
        <p className="text-sm text-slate-500">No APK defect records on file.</p>
      </div>
    );
  }

  const groups = groupByDate(items, descriptions);

  return (
    <div className="relative space-y-0">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-100" />

      {groups.map((group, idx) => {
        const hasDefects = group.defects.some((d) => d.count > 0);
        const totalDefects = group.defects.reduce((s, d) => s + d.count, 0);
        return (
          <div key={group.dateRaw} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline node */}
            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm
              ${hasDefects ? "border-amber-300" : "border-emerald-300"}`}
            >
              {hasDefects
                ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
            </div>

            {/* Card */}
            <div className={`flex-1 overflow-hidden rounded-2xl border transition-shadow hover:shadow-sm
              ${hasDefects ? "border-amber-100 bg-amber-50/50" : "border-emerald-100 bg-emerald-50/40"}`}
            >
              {/* Header */}
              <div className={`flex items-center gap-3 px-4 py-3 border-b
                ${hasDefects ? "border-amber-100/70" : "border-emerald-100/70"}`}
              >
                <CalendarClock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">{group.dateDisplay}</span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-black
                  ${hasDefects ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800"}`}
                >
                  {totalDefects === 0 ? "Clean" : `${totalDefects} defect${totalDefects !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Defect rows */}
              <div className="divide-y divide-slate-100/50 px-4">
                {group.defects.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-white/70 ring-1 ring-slate-200">
                      <Hash className="h-2.5 w-2.5 text-slate-400" />
                    </span>
                    <span className="text-xs text-slate-600">
                      Code <strong className="font-mono font-bold text-slate-800">{d.code}</strong>
                      {d.desc && <span className="ml-2 border-l border-slate-200 pl-2 text-slate-500">{d.desc}</span>}
                    </span>
                    <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                      ×{d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Keep original named export for back-compat */
export { InspectionTimeline as InspectionTable };
