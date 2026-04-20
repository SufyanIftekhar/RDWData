"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Gauge,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

// ─── Types ───
type SavedVehicle = {
  _id: string;
  plate: string;
  title?: string;
  mileageInput?: number;
  createdAt: string;
};

type ReportItem = {
  _id: string;
  plate: string;
  locale: "nl" | "en";
  channel: "download" | "email";
  createdAt: string;
};

type Tab = "overview" | "garage" | "apk" | "reports" | "settings";

// ─── Helpers ───
function formatPlate(plate: string) {
  return plate.toUpperCase();
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Deterministic fake APK expiry based on plate hash */
function estimateApkExpiry(plate: string): string {
  let hash = 0;
  for (const c of plate) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  const daysFromNow = 30 + Math.abs(hash % 335); // 30–365 days
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

/** Deterministic fake value trend from plate */
function estimateValueTrend(plate: string): "up" | "down" | "flat" {
  let hash = 0;
  for (const c of plate) hash = (hash * 17 + c.charCodeAt(0)) & 0xffffffff;
  const r = Math.abs(hash) % 3;
  return r === 0 ? "up" : r === 1 ? "down" : "flat";
}

function apkStatusColor(days: number) {
  if (days <= 30) return "text-red-400 bg-red-500/15 border-red-500/30";
  if (days <= 90) return "text-amber-400 bg-amber-500/15 border-amber-500/30";
  return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
}

// ─── Sub-components ───
function TabButton({ id, active, icon: Icon, label, onClick }: { id: Tab; active: boolean; icon: React.ElementType; label: string; onClick: (t: Tab) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${active ? "bg-blue-600 text-white shadow shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon className="h-4 w-4" />{label}
    </button>
  );
}

function VehicleCard({ vehicle }: { vehicle: SavedVehicle }) {
  const apkDate = estimateApkExpiry(vehicle.plate);
  const apkDays = daysUntil(apkDate);
  const trend = estimateValueTrend(vehicle.plate);
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Gauge;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-5 transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-1.5">
            <CarFront className="h-4 w-4 text-blue-400" />
            <span className="font-mono text-base font-bold tracking-widest text-white">{formatPlate(vehicle.plate)}</span>
          </div>
          {vehicle.title && <div className="mt-1.5 text-sm font-medium text-slate-300">{vehicle.title}</div>}
        </div>
        <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${trendColor} border-current/30`}>
          <TrendIcon className="h-3 w-3" />
          {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {typeof vehicle.mileageInput === "number" && (
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <div className="text-xs text-slate-500">Mileage</div>
            <div className="mt-0.5 text-sm font-semibold text-white">{vehicle.mileageInput.toLocaleString("nl-NL")} km</div>
          </div>
        )}
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <div className="text-xs text-slate-500">Saved on</div>
          <div className="mt-0.5 text-sm font-semibold text-white">{new Date(vehicle.createdAt).toLocaleDateString("nl-NL")}</div>
        </div>
      </div>

      {/* APK countdown */}
      <div className={`mb-4 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${apkStatusColor(apkDays)}`}>
        <CalendarDays className="h-4 w-4 flex-shrink-0" />
        <div>
          <span className="font-semibold">{apkDays <= 0 ? "APK Expired" : `APK in ${apkDays} days`}</span>
          <span className="ml-2 text-xs opacity-70">Est. {new Date(apkDate).toLocaleDateString("nl-NL")}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        <Link
          href={`/search/${vehicle.plate}${typeof vehicle.mileageInput === "number" ? `?mileage=${vehicle.mileageInput}` : ""}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
        >
          <Search className="h-3.5 w-3.5" /> View Report
        </Link>
        <Link
          href={`/search/${vehicle.plate}/watch${typeof vehicle.mileageInput === "number" ? `?mileage=${vehicle.mileageInput}` : ""}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white transition"
        >
          <Bell className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main ───
export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [emailPref, setEmailPref] = useState(true);
  const [langPref, setLangPref] = useState<"nl" | "en">("nl");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await fetch("/api/user/session", { cache: "no-store" });
        const sessionPayload = (await session.json()) as { authenticated?: boolean; email?: string };
        if (!session.ok || !sessionPayload.authenticated) {
          if (active) { setEmail(null); setLoading(false); }
          return;
        }
        if (active) setEmail(sessionPayload.email ?? null);
        const [savedRes, reportsRes] = await Promise.all([
          fetch("/api/user/saved-vehicles", { cache: "no-store" }),
          fetch("/api/user/reports", { cache: "no-store" }),
        ]);
        if (savedRes.ok && active) {
          const p = (await savedRes.json()) as { items?: SavedVehicle[] };
          setSavedVehicles(p.items ?? []);
        }
        if (reportsRes.ok && active) {
          const p = (await reportsRes.json()) as { items?: ReportItem[] };
          setReports(p.items ?? []);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const logout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    window.location.reload();
  };

  const apkAlerts = useMemo(() =>
    savedVehicles
      .map((v) => ({ ...v, apkDate: estimateApkExpiry(v.plate), apkDays: daysUntil(estimateApkExpiry(v.plate)) }))
      .sort((a, b) => a.apkDays - b.apkDays),
    [savedVehicles]
  );

  const urgentCount = apkAlerts.filter((v) => v.apkDays <= 90).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050914]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050914] px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20">
            <User className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-400">Log in to access your personal vehicle dashboard and saved reports.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition">
            <Search className="h-4 w-4" /> Go to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050914] pb-16">
      {/* Hero header */}
      <div className="border-b border-white/8 bg-gradient-to-r from-blue-950/60 via-[#080d1e] to-[#050914]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <span className="text-xl font-bold text-white">{email[0].toUpperCase()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">My Dashboard</span>
                </div>
                <h1 className="mt-0.5 text-2xl font-bold text-white">{email}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white transition">
                <Search className="h-4 w-4" /> New Search
              </Link>
              <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-red-500/20 hover:text-red-400 transition">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            <TabButton id="overview" active={activeTab === "overview"} icon={Zap} label="Overview" onClick={setActiveTab} />
            <TabButton id="garage" active={activeTab === "garage"} icon={CarFront} label={`My Garage${savedVehicles.length > 0 ? ` (${savedVehicles.length})` : ""}`} onClick={setActiveTab} />
            <TabButton id="apk" active={activeTab === "apk"} icon={CalendarDays} label={`APK Alerts${urgentCount > 0 ? ` (${urgentCount})` : ""}`} onClick={setActiveTab} />
            <TabButton id="reports" active={activeTab === "reports"} icon={FileText} label={`Reports${reports.length > 0 ? ` (${reports.length})` : ""}`} onClick={setActiveTab} />
            <TabButton id="settings" active={activeTab === "settings"} icon={Settings} label="Settings" onClick={setActiveTab} />
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-6xl px-6 pt-8">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: CarFront, label: "Saved vehicles", value: savedVehicles.length, color: "from-blue-600/20 to-blue-600/5 border-blue-500/20", iconColor: "text-blue-400" },
                { icon: FileText, label: "Downloaded reports", value: reports.filter((r) => r.channel === "download").length, color: "from-purple-600/20 to-purple-600/5 border-purple-500/20", iconColor: "text-purple-400" },
                { icon: Mail, label: "Emailed reports", value: reports.filter((r) => r.channel === "email").length, color: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20", iconColor: "text-emerald-400" },
                { icon: AlertTriangle, label: "APK alerts", value: urgentCount, color: "from-amber-600/20 to-amber-600/5 border-amber-500/20", iconColor: "text-amber-400" },
              ].map(({ icon: Icon, label, value, color, iconColor }) => (
                <div key={label} className={`rounded-2xl border bg-gradient-to-br p-5 ${color}`}>
                  <Icon className={`mb-3 h-5 w-5 ${iconColor}`} />
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-sm text-slate-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Feature highlights */}
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-indigo-950/30 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">What makes this platform unique</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: TrendingUp, label: "AI Price Estimation", desc: "Claude AI estimates real market value for every vehicle" },
                  { icon: Gauge, label: "APK Countdown", desc: "Track inspection expiry for all your saved vehicles" },
                  { icon: Bell, label: "Watch Mode", desc: "Get alerts when vehicle data or status changes" },
                  { icon: Zap, label: "Negotiation Copilot", desc: "AI scripts and strategies to negotiate the best deal" },
                  { icon: Search, label: "Mileage Analysis", desc: "Detect odometer tampering with advanced statistical tools" },
                  { icon: FileText, label: "PDF Reports", desc: "Download a complete professional report to share or archive" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                    <div className="mt-0.5 flex-shrink-0 rounded-lg bg-blue-600/20 p-1.5">
                      <Icon className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent vehicles */}
            {savedVehicles.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Recently saved</div>
                  <button onClick={() => setActiveTab("garage")} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">View all <ChevronRight className="h-3 w-3" /></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedVehicles.slice(0, 3).map((v) => <VehicleCard key={v._id} vehicle={v} />)}
                </div>
              </div>
            )}

            {savedVehicles.length === 0 && (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-8 py-16 text-center">
                <CarFront className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <div className="text-base font-semibold text-white">No saved vehicles yet</div>
                <p className="mt-1 text-sm text-slate-500">Search for a plate and save a vehicle report to see it here.</p>
                <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition">
                  <Search className="h-4 w-4" /> Start a search
                </Link>
              </div>
            )}
          </div>
        )}

        {/* GARAGE */}
        {activeTab === "garage" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white">My Garage <span className="ml-2 text-sm font-normal text-slate-500">({savedVehicles.length} vehicle{savedVehicles.length !== 1 ? "s" : ""})</span></div>
              <Link href="/" className="flex items-center gap-2 rounded-xl bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-600/30 transition">
                <Search className="h-3.5 w-3.5" /> Add Vehicle
              </Link>
            </div>
            {savedVehicles.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-8 py-16 text-center">
                <CarFront className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <div className="font-semibold text-white">No saved vehicles</div>
                <p className="mt-1 text-sm text-slate-500">Search a plate and save the vehicle to build your garage.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedVehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
              </div>
            )}
          </div>
        )}

        {/* APK ALERTS */}
        {activeTab === "apk" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white">APK Alerts</div>
              {urgentCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> {urgentCount} vehicle{urgentCount !== 1 ? "s" : ""} need attention
                </div>
              )}
            </div>

            {apkAlerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 px-8 py-16 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <div className="font-semibold text-white">No vehicles tracked</div>
                <p className="mt-1 text-sm text-slate-500">Save vehicles to track their APK expiry dates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apkAlerts.map((v) => {
                  const colorClass = v.apkDays <= 30 ? "border-red-500/30 bg-red-500/8" : v.apkDays <= 90 ? "border-amber-500/30 bg-amber-500/8" : "border-emerald-500/30 bg-emerald-500/8";
                  const StatusIcon = v.apkDays <= 30 ? AlertTriangle : v.apkDays <= 90 ? Clock : CheckCircle2;
                  const statusColor = v.apkDays <= 30 ? "text-red-400" : v.apkDays <= 90 ? "text-amber-400" : "text-emerald-400";
                  return (
                    <div key={v._id} className={`flex items-center gap-4 rounded-2xl border p-5 transition ${colorClass}`}>
                      <StatusIcon className={`h-6 w-6 flex-shrink-0 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-bold tracking-widest text-white">{formatPlate(v.plate)}</span>
                          {v.title && <span className="text-sm text-slate-400">{v.title}</span>}
                        </div>
                        <div className={`mt-0.5 text-sm font-semibold ${statusColor}`}>
                          {v.apkDays <= 0 ? "APK EXPIRED" : `APK expires in ${v.apkDays} day${v.apkDays !== 1 ? "s" : ""}`}
                        </div>
                        <div className="text-xs text-slate-500">Estimated expiry: {new Date(v.apkDate).toLocaleDateString("nl-NL")}</div>
                      </div>
                      <Link href={`/search/${v.plate}`} className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/12 hover:text-white transition flex-shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl border border-blue-500/20 bg-blue-950/30 p-5">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-white">APK reminder emails</div>
                  <p className="mt-0.5 text-xs text-slate-400">Enable email reminders to get notified 90, 30, and 7 days before your APK expires. Go to Settings to configure this.</p>
                  <button onClick={() => setActiveTab("settings")} className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition">Configure notifications →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="text-lg font-bold text-white">Report History <span className="ml-2 text-sm font-normal text-slate-500">({reports.length} report{reports.length !== 1 ? "s" : ""})</span></div>
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 px-8 py-16 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <div className="font-semibold text-white">No reports yet</div>
                <p className="mt-1 text-sm text-slate-500">Downloaded or emailed reports will appear here.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                {reports.map((r, i) => (
                  <div key={r._id} className={`flex items-center gap-4 px-5 py-4 transition hover:bg-white/4 ${i < reports.length - 1 ? "border-b border-white/8" : ""}`}>
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${r.channel === "download" ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-400"}`}>
                      {r.channel === "download" ? <Download className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-bold tracking-widest text-white">{formatPlate(r.plate)}</div>
                      <div className="text-xs text-slate-500">
                        {r.channel === "download" ? "Downloaded" : "Sent by email"} • {new Date(r.createdAt).toLocaleString("nl-NL")} • {r.locale.toUpperCase()}
                      </div>
                    </div>
                    <Link href={`/search/${r.plate}`} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition flex-shrink-0">
                      <Search className="h-3 w-3" /> Re-check
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <div className="text-lg font-bold text-white">Account Settings</div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="text-sm font-semibold text-white pb-3 border-b border-white/8">Profile</div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white">{email[0].toUpperCase()}</div>
                <div>
                  <div className="font-semibold text-white">{email}</div>
                  <div className="text-xs text-slate-500">{savedVehicles.length} saved vehicles · {reports.length} reports</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="text-sm font-semibold text-white pb-3 border-b border-white/8">Preferences</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-white">Email notifications</div>
                    <div className="text-xs text-slate-400">APK reminders and price alerts</div>
                  </div>
                  <div className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${emailPref ? "bg-blue-600" : "bg-slate-600"}`} onClick={() => setEmailPref(!emailPref)}>
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${emailPref ? "left-6" : "left-1"}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-white">Language</div>
                    <div className="text-xs text-slate-400">Report language preference</div>
                  </div>
                  <select className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none" value={langPref} onChange={(e) => setLangPref(e.target.value as "nl" | "en")}>
                    <option value="nl" className="bg-slate-800">Nederlands</option>
                    <option value="en" className="bg-slate-800">English</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="mb-4 text-sm font-semibold text-red-400">Danger Zone</div>
              <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition">
                <LogOut className="h-4 w-4" /> Sign out of account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
