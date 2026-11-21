import { BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface HowToUseGuideProps {
  isOpen: boolean;
  onToggle: () => void;
  onLoadSample: () => void;
}

const STEPS = [
  {
    number: '01.',
    title: 'Add Brand, Topic & Draft',
    description:
      'Enter your brand name, target buyer topic, and paste plain text, Markdown, or HTML (max 50,000 chars). New here? Click Load Sample B2B Draft to try it immediately.',
  },
  {
    number: '02.',
    title: 'Run Local Audit & Fix Gaps',
    description:
      'Click Run GEO Citation Audit. Check your 0–100 score, Readability Grade, and the #1 Highest-Impact Fix—then tighten opening summaries, missing stats, or hedge words.',
  },
  {
    number: '03.',
    title: 'Copy Snippets, Schema & llms.txt',
    description:
      'Use TL;DR & FAQ Extractor to copy answer blocks for your page. Use Schema & llms.txt to copy or download JSON-LD for your <head> and llms.txt for your domain root.',
  },
  {
    number: '04.',
    title: 'Export Report & Optional Check',
    description:
      'Click Download Full Audit Report (.md) to save your full checklist. Tab 4 (BYOK Simulator) is 100% optional if you want to test live brand recall with your own temporary API key.',
  },
];

export function HowToUseGuide({
  isOpen,
  onToggle,
  onLoadSample,
}: HowToUseGuideProps) {
  return (
    <section
      aria-label="Step-by-Step How to Use Guide"
      className="mb-6 rounded-xl border border-slate-800 bg-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-100">
            How to Use This Studio
          </h2>
          <span className="hidden text-xs text-slate-400 sm:inline">
            · 4-step workflow to make any page citable by AI answer engines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isOpen && (
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>Try Sample Draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{isOpen ? 'Hide Guide' : 'Show Guide'}</span>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-800">
          <div className="grid grid-cols-1 divide-y divide-slate-800 md:grid-cols-2 md:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {STEPS.map((step) => (
              <div key={step.number} className="p-5">
                <p className="font-mono text-xs font-semibold text-cyan-400 tabular-nums">
                  {step.number}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/50 px-5 py-3 sm:px-6">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">New to GEO?</span>{' '}
              Generative Engine Optimization (GEO) structures your content with clear lead answers, verifiable numbers, FAQ markup, and <code className="font-mono text-slate-300">llms.txt</code> so ChatGPT, Gemini, Perplexity, and Claude cite your brand accurately.
            </p>
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Load Sample Draft Now</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
