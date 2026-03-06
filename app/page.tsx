"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShieldCheck, BarChart2,
  FileText, Star, CheckCircle2, ArrowRight,
  BadgeCheck, Zap, Users, RefreshCw, Car
} from "lucide-react";
import { normalizePlate, validateDutchPlate } from "@/lib/rdw/normalize";

// ─── Sample vehicle cards data ───────────────────────────────────────────
const SAMPLE_CARS = [
  {
    image: "/hero-car.png",
    name: "Toyota Auris",
    type: "MPV", year: 2011, fuel: "Petrol",
    co2: "93 g/km", power: "73 kW",
    apk: "May 2026", price: "€ 27,400",
    colors: ["#3b82f6", "#1e293b", "#94a3b8"],
    rating: 4.8,
  },
  {
    image: "/car-orange.png",
    name: "Volkswagen Golf",
    type: "Hatchback", year: 2019, fuel: "Petrol",
    co2: "115 g/km", power: "110 kW",
    apk: "Mar 2026", price: "€ 34,900",
    colors: ["#f97316", "#94a3b8", "#22c55e"],
    rating: 4.9,
  },
  {
    image: "/car-silver.png",
    name: "BMW 3 Series",
    type: "Sedan", year: 2018, fuel: "Diesel",
    co2: "122 g/km", power: "140 kW",
    apk: "Jul 2025", price: "€ 48,200",
    colors: ["#cbd5e1", "#1e293b", "#3b82f6"],
    rating: 4.7,
  },
];

// ─── Star rating ─────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-slate-500">{rating}</span>
    </div>
  );
}

// ─── Live counter ─────────────────────────────────────────────────────────
function LiveCount() {
  const [n, setN] = useState(10500); // Fixed initial for SSR hydration

  useEffect(() => {
    setN(10000 + Math.floor(Math.random() * 500)); // randomize after mount
    const id = setInterval(() => setN(c => c + Math.floor(Math.random() * 2) + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return <>{n.toLocaleString("nl-NL")}+</>;
}

// ─── Plate search input ───────────────────────────────────────────────────
function PlateInput({ large = false }: { large?: boolean }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const router = useRouter();

  const go = () => {
    const n = normalizePlate(val);
    if (!validateDutchPlate(n)) { setErr(true); setTimeout(() => setErr(false), 700); return; }
    router.push(`/search/${n}`);
  };

  return (
    <div className={`flex w-full min-w-0 overflow-hidden rounded-xl border bg-white shadow-md transition-all
      ${err ? "border-red-300 shadow-red-100" : "border-slate-200"}`}
    >
      <input
        value={val}
        onChange={e => { setVal(e.target.value.toUpperCase()); setErr(false); }}
        onKeyDown={e => e.key === "Enter" && go()}
        placeholder="e.g. 16-RSL-9"
        className={`min-w-0 flex-1 bg-transparent outline-none text-slate-800 font-semibold placeholder:text-slate-300
          ${large ? "px-4 py-4 text-base sm:px-5" : "px-3 py-3 text-sm sm:px-4"}`}
      />
      <button
        onClick={go}
        className={`flex shrink-0 items-center gap-1.5 bg-brand-600 font-bold text-white transition-all
          hover:bg-brand-700 active:scale-95
          ${large ? "px-4 py-4 sm:px-7" : "px-3 py-3 sm:px-5"}`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-sm">Search</span>
      </button>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-bold text-brand-600">{children}</p>;
}

// ════════════════════════════════════════════════════════════════════════════
// HERO
// ════════════════════════════════════════════════════════════════════════════
function Hero() {
  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-0 px-6 py-12
        lg:grid-cols-[1fr_520px] lg:py-16">

        {/* LEFT */}
        <div className="flex flex-col gap-6 lg:pr-12">
          {/* Pre-tag */}
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            Trusted by{" "}
            <span className="font-black text-slate-900"><LiveCount /></span>{" "}
            Dutch drivers
          </p>

          {/* Headline */}
          <h1 className="font-display text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-[56px]">
            Find the Vehicle Report{" "}
            <span className="text-brand-600">You Need,</span>
            <br />
            <span className="text-brand-600">Your Way</span>
          </h1>

          <p className="max-w-sm text-base leading-relaxed text-slate-500">
            Enter any Dutch license plate and instantly receive a complete,
            structured vehicle report — specs, APK status, recall alerts and more.
          </p>

          <Link
            href="/#search"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-600
              px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-600/20
              transition-all hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5"
          >
            Start Free Lookup <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Search bar */}
          <div id="search" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
            {/* Plate label */}
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <Search className="h-3 w-3" /> Plate Number
            </label>
            {/* Input + country row */}
            <div className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1">
                <PlateInput />
              </div>
              <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:flex">
                <span className="text-base">🇳🇱</span>
                <span className="whitespace-nowrap text-sm font-semibold text-slate-700">Netherlands</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Example: <span className="font-mono font-bold text-brand-600">16-RSL-9</span>
            </p>
          </div>

          {/* Trust links */}
          <p className="text-xs text-slate-400">
            Not sure what to search?{" "}
            <Link href="/#how" className="font-semibold text-brand-600 hover:underline">
              How it works →
            </Link>
          </p>
        </div>

        {/* RIGHT — stacked cars */}
        <div className="relative hidden lg:flex h-[500px] items-end justify-center overflow-visible">
          {/* Back circle */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full
            bg-gradient-to-br from-brand-100 to-brand-200 opacity-60" />

          {/* Rear car — silver, slightly back */}
          <div className="absolute top-20 right-0 w-[300px] opacity-70 blur-[0.5px]">
            <Image src="/car-silver.png" alt="Silver car" width={300} height={180} className="w-full h-auto drop-shadow-lg" />
          </div>

          {/* Front car — main */}
          <div className="absolute bottom-0 left-1/2 z-10 w-[420px] -translate-x-[40%]">
            <Image src="/hero-car.png" alt="Main car" width={420} height={260} priority className="w-full h-auto drop-shadow-2xl" />
          </div>

          {/* Floating stat — top left */}
          <div className="absolute left-2 top-16 z-20 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="font-black text-slate-900">4.9 Rating</p>
              <p className="text-xs text-slate-500">User satisfaction</p>
            </div>
          </div>

          {/* Floating stat — bottom right */}
          <div className="absolute bottom-12 right-2 z-20 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <Users className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="font-black text-slate-900">9M+ Records</p>
              <p className="text-xs text-slate-500">RDW vehicle database</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FEATURES STRIP — "All the Ways to Know Your Vehicle"
// ════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  { Icon: ShieldCheck, label: "Official RDW Data", bg: "bg-blue-50", ic: "text-blue-600" },
  { Icon: BadgeCheck, label: "APK Status Check", bg: "bg-green-50", ic: "text-green-600" },
  { Icon: BarChart2, label: "NAP Odometer Verify", bg: "bg-purple-50", ic: "text-purple-600" },
  { Icon: FileText, label: "Safety Recall Alerts", bg: "bg-rose-50", ic: "text-rose-600" },
];

function FeaturesStrip() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <Label>Why PlateIntel</Label>
          <h2 className="font-display text-3xl font-bold text-slate-900">
            All the Ways to Know Your Vehicle
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {FEATURES.map(({ Icon, label, bg, ic }) => (
            <div key={label} className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm hover:shadow-md transition-shadow">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-4.5 w-4.5 ${ic}`} />
              </span>
              <span className="text-sm font-semibold text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SAMPLE REPORT CARDS — like car listing cards
// ════════════════════════════════════════════════════════════════════════════
function CarCard({ car }: { car: typeof SAMPLE_CARS[0] }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm
      transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Image area */}
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-50">
        <Image
          src={car.image} alt={car.name}
          width={280} height={170}
          className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-slate-900">{car.name}</h3>
            <p className="text-sm text-slate-500">{car.type} · {car.year}</p>
          </div>
          <Stars rating={car.rating} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-brand-400" />{car.power}</span>
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-green-500" />{car.fuel}</span>
          <span className="flex items-center gap-1"><BarChart2 className="h-3.5 w-3.5 text-purple-400" />{car.co2}</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-amber-500" />APK {car.apk}</span>
        </div>
        {/* Color dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {car.colors.map((c, i) => (
            <span key={i} className="h-4 w-4 rounded-full border border-slate-200 shadow-inner" style={{ background: c }} />
          ))}
        </div>
        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <p className="font-display text-base font-black text-slate-900">{car.price}</p>
          <Link href="/search/16RSL9" className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors">
            View Report <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SampleReports() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label>Sample Reports</Label>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              See What You Get Instantly
            </h2>
          </div>
          <Link href="/search/16RSL9" className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
            View full report <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_CARS.map(car => <CarCard key={car.name} car={car} />)}
        </div>
        <div className="mt-8 text-center">
          <Link href="/search/16RSL9"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-8 py-3 text-sm font-bold text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <Car className="h-4 w-4" /> View a Live Example Report
          </Link>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BUILD CONFIDENCE SECTION — 2 col
// ════════════════════════════════════════════════════════════════════════════
function VerifyWithConfidence() {
  const points = [
    "Real-time APK validity and expiry date",
    "NAP odometer history verification",
    "Zero open safety recalls confirmed",
    "Insurance status from WAM register",
  ];
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:items-center">
        {/* Left text */}
        <div className="flex flex-col gap-6">
          <Label>Why trust us</Label>
          <h2 className="font-display text-3xl font-bold text-slate-900 lg:text-4xl">
            Verify Your Vehicle
            <br />
            <span className="text-brand-600">With Confidence</span>
          </h2>
          <p className="text-slate-500 leading-relaxed">
            PlateIntel pulls directly from official Dutch government RDW records —
            the same source insurers, dealers, and inspectors rely on. No guesswork. No outdated data.
          </p>
          <ul className="space-y-3">
            {points.map(p => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span className="text-sm text-slate-600">{p}</span>
              </li>
            ))}
          </ul>
          <Link href="/search/16RSL9"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
          >
            Start Free Lookup <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Right — mock report card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="h-1.5 bg-gradient-to-r from-brand-500 to-brand-400" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sample Report</p>
                <p className="mt-1 font-display text-xl font-black text-slate-900">Toyota Auris 2011</p>
              </div>
              <div className="rounded-xl border-4 border-brand-600 bg-brand-50 px-3 py-2 text-center">
                <p className="text-[10px] font-black text-brand-800">NL</p>
                <p className="font-mono text-sm font-black tracking-widest text-brand-900">16-RSL-9</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "APK valid until", value: "May 2026", ok: true },
                { label: "NAP verdict", value: "Logisch", ok: true },
                { label: "Open recalls", value: "None", ok: true },
                { label: "Insured", value: "Yes (WAM)", ok: true },
                { label: "Fuel type", value: "Benzine", ok: null },
                { label: "Original price", value: "€ 27,400", ok: null },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className={`text-sm font-black ${ok === true ? "text-emerald-600" : "text-slate-800"}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BUYING A CAR? (Selling/Trading equivalent) — instant plate search CTA
// ════════════════════════════════════════════════════════════════════════════
const STEPS = [
  { Icon: Search, title: "Enter the Plate", desc: "Type or paste any Dutch plate — hyphens optional." },
  { Icon: RefreshCw, title: "We Verify Instantly", desc: "PlateIntel queries live RDW records in real time." },
  { Icon: FileText, title: "Get Your Full Report", desc: "Specs, APK, recalls, NAP, insurance and more." },
];

function PlateCheckSection() {
  return (
    <section id="how" className="bg-white py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:items-center">
        {/* Left steps */}
        <div>
          <Label>How it works</Label>
          <h2 className="font-display text-3xl font-bold text-slate-900 lg:text-4xl">
            Checking a Car?
            <br />
            <span className="text-brand-600">Fast, Free &amp; Accurate</span>
          </h2>
          <div className="mt-8 space-y-6">
            {STEPS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/25">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — quick search form card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="h-1 bg-brand-600" />
          <div className="p-8">
            <p className="font-display text-lg font-bold text-slate-900">Get an Instant Report</p>
            <p className="mt-1 text-sm text-slate-500">Takes less than 1 second</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Plate Number
                </label>
                <PlateInput large />
              </div>
              <ul className="space-y-2 pt-2">
                {["No account needed", "100% free forever", "Official RDW data"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CTA FOOTER BAND
// ════════════════════════════════════════════════════════════════════════════
function CtaBand() {
  return (
    <section className="bg-brand-600 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">
            Buy &amp; Verify Platform.
            <br />
            <span className="text-brand-200">Know Any Dutch Vehicle.</span>
          </h2>
          <p className="max-w-sm text-brand-200">
            Thousands of plate lookups happen every day. Join them — it takes three seconds.
          </p>
          <Link
            href="/#search"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:-translate-y-0.5"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div>
      <Hero />
      <FeaturesStrip />
      <SampleReports />
      <VerifyWithConfidence />
      <PlateCheckSection />
      <CtaBand />
    </div>
  );
}
