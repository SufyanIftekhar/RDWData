"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, ScanLine, FileText, ArrowRight } from "lucide-react";

type Step = { title: string; description: string };
type Props = { items: Step[] };

const stepCfg = [
  { Icon: KeyRound, num: "01", bg: "bg-brand-600", ring: "ring-brand-100", bar: "bg-brand-200", from: "from-brand-400", to: "to-brand-600", glow: "rgba(99,102,241,0.12)", connector: "to-violet-400" },
  { Icon: ScanLine, num: "02", bg: "bg-violet-600", ring: "ring-violet-100", bar: "bg-violet-200", from: "from-violet-400", to: "to-violet-600", glow: "rgba(139,92,246,0.12)", connector: "to-sky-400" },
  { Icon: FileText, num: "03", bg: "bg-sky-600", ring: "ring-sky-100", bar: "bg-sky-200", from: "from-sky-400", to: "to-sky-600", glow: "rgba(14,165,233,0.12)", connector: null },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function HowItWorks({ items }: Props) {
  const { ref, inView } = useInView();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Auto-cycle through steps
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setActiveStep((s) => (s === null ? 0 : (s + 1) % 3));
    }, 2000);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div
          ref={ref}
          className={`mb-16 text-center transition-all duration-700
            ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <span className="section-label">How it works</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Your vehicle report in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500">
            No account required. Just enter the plate and PlateIntel handles everything else.
          </p>
        </div>

        {/* Step indicator dots */}
        <div className="mb-10 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-2 rounded-full transition-all duration-300
                ${activeStep === i ? "w-8 bg-brand-600" : "w-2 bg-slate-200 hover:bg-slate-300"}`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Steps grid */}
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Animated connector line */}
          <div
            className="pointer-events-none absolute left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] top-10 hidden h-px md:block transition-opacity duration-500"
            style={{
              background: "linear-gradient(90deg, #6366f1, #7c3aed 50%, #0ea5e9)",
              opacity: inView ? 0.25 : 0,
            }}
            aria-hidden="true"
          />

          {items.map((item, i) => {
            const cfg = stepCfg[i % stepCfg.length];
            const isActive = activeStep === i;
            return (
              <div
                key={item.title}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-7 shadow-card ring-4 ${cfg.ring} ring-opacity-30
                  transition-all duration-500
                  ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
                  ${isActive ? "shadow-xl border-transparent -translate-y-1.5" : "border-slate-100 hover:-translate-y-1 hover:shadow-md"}`}
                style={{ transitionDelay: `${i * 120}ms` }}
                onMouseEnter={() => setActiveStep(i)}
              >
                {/* Hover gradient bar — always visible when active */}
                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${cfg.from} ${cfg.to}
                  transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />

                {/* Hover glow */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  style={{ background: `radial-gradient(ellipse 80% 60% at 20% 30%, ${cfg.glow}, transparent 70%)` }}
                />

                {/* Number badge */}
                <div className="relative inline-flex">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full font-display text-xl font-black text-white shadow-md ${cfg.bg}
                    transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                    {cfg.num}
                  </div>
                  <div className={`absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-slate-100`}>
                    <cfg.Icon className={`h-3.5 w-3.5 ${cfg.bg.replace("bg-", "text-")}`} />
                  </div>
                </div>

                {/* Animated progress bar */}
                <div className={`mt-4 h-1 rounded-full ${cfg.bar} transition-all duration-500 ${isActive ? "w-16" : "w-10 group-hover:w-16"}`} />

                <h3 className="relative mt-4 font-display text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>

                {/* Arrow */}
                <ArrowRight className={`absolute bottom-7 right-7 h-4 w-4 transition-all duration-300
                  ${isActive ? "opacity-100 text-slate-400 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-slate-300"}`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
