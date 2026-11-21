import { ShieldCheck } from 'lucide-react';

export function TopTrustHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            GEO Citation Readiness Studio
          </h1>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap self-start sm:self-auto"
          role="status"
        >
          <span>🔒 100% Local Browser Processing • Zero Servers • Zero Data Retention</span>
        </div>
      </div>
    </header>
  );
}
