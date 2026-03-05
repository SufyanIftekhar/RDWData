"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Zap, ShieldCheck, TrendingUp } from "lucide-react";

type Stat = { label: string; value: string };
type Props = { items: Stat[] };

const cfg = [
  { Icon: Hash, color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-100", glow: "rgba(99,102,241,0.12)" },
  { Icon: Zap, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100", glow: "rgba(139,92,246,0.12)" },
  { Icon: ShieldCheck, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100", glow: "rgba(14,165,233,0.12)" },
  { Icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", glow: "rgba(16,185,129,0.12)" },
];

// Extracts numeric part and suffix (e.g. "1,200+" → [1200, "+"]), "< 0.4 s" → [0.4, " s"]
function parseValue(val: string): { numeric: number; prefix?: string; suffix?: string } {
  const lt = val.startsWith("<");
  const num = parseFloat(val.replace(/[^0-9.]/g, ""));
  const base = val.replace(/[0-9.,]+/, "").replace(/\s+/g, " ").trim();
  const suffix = lt ? ` ${base.replace("<", "").trim()}` : base;
  return { numeric: isNaN(num) ? 0 : num, prefix: lt ? "< " : "", suffix };
}

function AnimatedCount({ value, inView }: { value: string; inView: boolean }) {
  const { numeric, prefix, suffix } = parseValue(value);
  const [display, setDisplay] = useState(0);
  const isDecimal = String(numeric).includes(".");

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(isDecimal ? parseFloat((eased * numeric).toFixed(1)) : Math.round(eased * numeric));
      if (pct < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, numeric, isDecimal]);

  const formatted = isDecimal
    ? display.toFixed(1)
    : display >= 1000 ? display.toLocaleString("nl-NL") : display.toString();

  return (
    <span className="tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  );
}

export function StatStrip({ items }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-y border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {items.map((item, i) => {
            const { Icon, color, bg, border, glow } = cfg[i % cfg.length];
            return (
              <div
                key={item.label}
                className="group relative flex items-center gap-5 px-8 py-10 first:pl-0 last:pr-0 overflow-hidden transition-all duration-300 hover:bg-slate-50/60 cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 30% 50%, ${glow}, transparent 70%)` }}
                />

                <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${bg} ${border}
                  transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}
                >
                  <Icon className={`h-6 w-6 ${color}`} />
                </span>

                <div className="relative">
                  <p className={`font-display text-3xl font-black ${color}`}>
                    <AnimatedCount value={item.value} inView={inView} />
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-600">{item.label}</p>
                </div>

                {/* Animated underline on hover */}
                <div className={`absolute inset-x-8 bottom-0 h-0.5 ${bg.replace("bg-", "bg-").replace("50", "400")} scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
