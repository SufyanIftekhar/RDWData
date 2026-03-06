import Link from "next/link";
import { Search, FileText, Settings, Download, User, Sparkles } from "lucide-react";

const features = [
  { Icon: Search, title: "Saved Lookups", desc: "Instantly revisit your recent plate searches without typing again." },
  { Icon: FileText, title: "Report History", desc: "Access all your previously purchased premium vehicle reports anytime." },
  { Icon: Settings, title: "Account Settings", desc: "Update your personal info, manage your plan, and set preferences." },
  { Icon: Download, title: "Export Your Data", desc: "Download your lookup history and reports as CSV or PDF." },
];

export default function AccountPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-white py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.06),transparent)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 ring-4 ring-brand-100">
            <User className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 md:text-4xl">Your Account</h1>
          <p className="mt-3 max-w-sm mx-auto text-slate-500">
            A full account dashboard is coming soon. Here&apos;s a preview of what you&apos;ll have access to.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs font-semibold text-brand-700">Launching soon</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-xl font-bold mb-4">You&apos;re almost there!</h2>
          <p className="text-gray-600 mb-6">We&apos;ve sent a verification link to your email address.</p>
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            What&apos;s coming
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group card-glow flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-5 w-5 text-brand-600" />
                </span>
                <div>
                  <p className="font-display font-bold text-slate-900">{title}</p>
                  <p className="mt-4 text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center border-t border-slate-100 bg-white py-6">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-700">← Back to search</Link>
      </div>
    </div>
  );
}
