"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Star, ShieldCheck, Database, Zap, CheckCircle } from "lucide-react";
import { normalizePlate, validateDutchPlate, formatDisplayPlate } from "@/lib/rdw/normalize";

// ── Dot grid ──────────────────────────────────────────────────────────────
function DotGrid() {
  return (
    <svg className="absolute right-0 top-0 h-44 w-44 opacity-25" viewBox="0 0 168 168" fill="none" aria-hidden>
      {Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={c * 24 + 12} cy={r * 24 + 12} r="3.5" fill="#6366f1" />
        ))
      )}
    </svg>
  );
}

// ── Floating card ─────────────────────────────────────────────────────────
function FloatCard({
  style, icon: Icon, iconBg, value, sub
}: {
  style: React.CSSProperties;
  icon: React.ElementType;
  iconBg: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="absolute z-20 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-2xl"
      style={style}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </span>
      <div>
        <p className="font-display text-base font-black text-slate-900 leading-none">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

// ── Live counter ──────────────────────────────────────────────────────────
function LiveCount() {
  const [n, setN] = useState(() => 1200 + Math.floor(Math.random() * 60));
  useEffect(() => {
    const id = setInterval(() => setN(c => c + Math.floor(Math.random() * 3) + 1), 2800);
    return () => clearInterval(id);
  }, []);
  return <>{n.toLocaleString("nl-NL")}+</>;
}

// ── Plate search bar ──────────────────────────────────────────────────────
function PlateSearch() {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState(false);
  const router = useRouter();

  const go = () => {
    const n = normalizePlate(raw);
    if (!validateDutchPlate(n)) { setErr(true); setTimeout(() => setErr(false), 800); return; }
    router.push(`/search/${n}`);
  };

  return (
    <div className={`flex w-full overflow-hidden rounded-2xl border bg-white shadow-xl transition-all duration-200
      ${err ? "border-red-300 shadow-red-100" : "border-slate-200 shadow-slate-200/60"}`}
    >
      {/* Plate input */}
      <div className="flex flex-1 flex-col gap-0.5 px-5 py-4">
        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Search className="h-3 w-3" />
          License Plate
        </label>
        <input
          value={raw}
          onChange={e => { setRaw(e.target.value.toUpperCase()); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && go()}
          placeholder="16-RSL-9"
          maxLength={9}
          className="bg-transparent font-display text-xl font-black tracking-[0.15em] text-slate-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-300"
        />
      </div>

      {/* Divider + Country */}
      <div className="hidden sm:flex flex-col justify-center gap-0.5 border-l border-slate-100 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Country</p>
        <div className="flex items-center gap-2">
          <span className="text-base">🇳🇱</span>
          <span className="text-sm font-semibold text-slate-700">Netherlands</span>
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={go}
        className="m-2 flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white
          shadow-md transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/25 active:scale-95"
      >
        <Search className="h-4 w-4" />
        Search
      </button>
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────
export function HeroSection({ title: _t, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 py-12 lg:py-0">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-violet-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100dvh-56px)] max-w-6xl grid-cols-1 items-center
        gap-12 px-6 lg:grid-cols-[1fr_520px] lg:gap-8">

        {/* ── LEFT ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-7 lg:pr-8">

          {/* Live pill */}
          <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-brand-200/80
            bg-brand-50 px-4 py-2 shadow-sm"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
              <span className="relative h-2 w-2 rounded-full bg-brand-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
              Dutch Vehicle Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black uppercase leading-[1.0] tracking-tight text-slate-900
            text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-[64px]"
          >
            <span className="text-brand-600">PlateIntel</span>
            <br />is your vehicle
            <br />intelligence.
          </h1>

          {/* Subtitle */}
          <p className="max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
            {subtitle}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => document.querySelector<HTMLInputElement>("input[placeholder]")?.focus()}
              className="rounded-full bg-brand-600 px-8 py-3.5 text-sm font-bold text-white
                shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700
                hover:shadow-xl hover:shadow-brand-600/35 hover:-translate-y-0.5 active:scale-95"
            >
              Start Free Lookup
            </button>
            <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              No account required
            </span>
          </div>

          {/* Search card */}
          <PlateSearch />
          <p className="text-xs text-slate-400">
            Example:{" "}
            <button
              className="font-mono font-bold text-brand-600 hover:underline"
              onClick={() => {
                const inp = document.querySelector<HTMLInputElement>("input[placeholder]");
                if (inp) { inp.value = "16-RSL-9"; inp.dispatchEvent(new Event("input", { bubbles: true })); inp.focus(); }
              }}
            >
              16-RSL-9
            </button>{" "}
            or any valid Dutch plate.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-8 border-t border-slate-100 pt-6">
            {[
              { value: <LiveCount />, label: "Plates decoded today", color: "text-brand-600" },
              { value: "9M+", label: "Vehicle records", color: "text-violet-600" },
              { value: "< 0.4 s", label: "Avg. response time", color: "text-sky-600" },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <p className={`font-display text-2xl font-black tabular-nums ${color}`}>{value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — car composition ──────────────────────────────── */}
        <div className="relative flex h-[420px] w-full items-center justify-center sm:h-[500px] lg:h-[560px]">

          {/* Big circle — centered */}
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-[45%]
            rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow-2xl
            shadow-brand-500/30 sm:h-80 sm:w-80 lg:h-[340px] lg:w-[340px]"
          />

          {/* Dot grid — top-right corner */}
          <DotGrid />

          {/* Car image — sits on the circle */}
          <div className="absolute bottom-0 left-1/2 w-[320px] -translate-x-[45%]
            sm:w-[380px] lg:w-[440px]"
          >
            <Image
              src="/hero-car.png"
              alt="Vehicle"
              width={440}
              height={270}
              priority
              className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
            />
          </div>

          {/* Float card — top left of circle */}
          <FloatCard
            style={{ top: "8%", left: "2%" }}
            icon={Star}
            iconBg="bg-amber-400"
            value="4.9 ★ Rating"
            sub="User satisfaction"
          />

          {/* Float card — bottom right of circle */}
          <FloatCard
            style={{ bottom: "8%", right: "0%" }}
            icon={Database}
            iconBg="bg-brand-600"
            value="9M+ Records"
            sub="RDW verified data"
          />
        </div>

      </div>
    </section>
  );
}
