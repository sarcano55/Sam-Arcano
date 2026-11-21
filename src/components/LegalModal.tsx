import { useEffect } from 'react';
import { Lock, Scale, X } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms';

interface LegalModalProps {
  activeDoc: LegalDocType | null;
  onSelectDoc: (doc: LegalDocType) => void;
  onClose: () => void;
}

export function LegalModal({
  activeDoc,
  onSelectDoc,
  onClose,
}: LegalModalProps) {
  useEffect(() => {
    if (!activeDoc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc, onClose]);

  if (!activeDoc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectDoc('privacy')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeDoc === 'privacy'
                  ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                  : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectDoc('terms')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeDoc === 'terms'
                  ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                  : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Terms of Service</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-5 py-5 text-xs leading-relaxed text-slate-300 sm:px-6">
          {activeDoc === 'privacy' ? (
            <div className="space-y-4">
              <div>
                <h2
                  id="legal-modal-title"
                  className="text-base font-semibold text-slate-100"
                >
                  Privacy Policy — GEO Citation Readiness Studio
                </h2>
                <p className="mt-1 text-slate-400">
                  Effective Date: November 2026 · 100% Client-Side Architecture
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  1. Zero Server Processing &amp; Zero Data Collection
                </h3>
                <p className="mt-1 text-slate-300">
                  GEO Citation Readiness Studio executes all content parsing, citation readiness scoring, readability math, TL;DR/FAQ extraction, JSON-LD formatting, and <code className="font-mono text-slate-200">llms.txt</code> generation exclusively inside your web browser&apos;s memory. We do not operate a backend database, do not transmit your drafts to our servers, and do not log, store, or sell any text you enter.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  2. Cookies &amp; Analytics
                </h3>
                <p className="mt-1 text-slate-300">
                  This application does not use advertising cookies, behavioral tracking pixels, or third-party analytics scripts.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  3. Ephemeral Storage for Optional BYOK Simulator
                </h3>
                <p className="mt-1 text-slate-300">
                  If you choose to use the optional <strong>BYOK Simulator</strong> tab, any OpenAI or Perplexity API key you enter is stored strictly in your browser&apos;s <code className="font-mono text-emerald-400">sessionStorage</code> (never <code className="font-mono text-slate-200">localStorage</code>) so it clears automatically when you close the browser tab. You can also erase it immediately at any time using the <strong>Clear Key Now</strong> button. Prompts submitted in that tab travel directly from your browser to your selected provider (<code className="font-mono text-slate-200">api.openai.com</code> or <code className="font-mono text-slate-200">api.perplexity.ai</code>) under that provider&apos;s own privacy policy.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  4. Static Hosting &amp; Web Fonts
                </h3>
                <p className="mt-1 text-slate-300">
                  When loading the static application and typography assets (Google Fonts), standard web infrastructure logs (such as IP address and browser user-agent) may be processed momentarily by the CDN or font host strictly to deliver the page.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2
                  id="legal-modal-title"
                  className="text-base font-semibold text-slate-100"
                >
                  Terms of Service — GEO Citation Readiness Studio
                </h2>
                <p className="mt-1 text-slate-400">
                  Effective Date: November 2026 · Static Client-Side Tool
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  1. Informational Diagnostic Tool
                </h3>
                <p className="mt-1 text-slate-300">
                  GEO Citation Readiness Studio is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. All readiness scores (0–100), readability grades, extracted snippets, JSON-LD markup, and <code className="font-mono text-slate-200">llms.txt</code> templates are heuristic recommendations designed to assist content structuring. We do not guarantee citations, rankings, or traffic outcomes in ChatGPT, Gemini, Perplexity, Claude, or any search engine.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  2. User Responsibility for Published Outputs
                </h3>
                <p className="mt-1 text-slate-300">
                  You are solely responsible for reviewing and validating any exported JSON-LD, <code className="font-mono text-slate-200">llms.txt</code> files, or edited copy before publishing them to a live website. Never place private, internal, staging, or authenticated URLs or confidential data inside publicly crawlable files such as <code className="font-mono text-slate-200">/llms.txt</code>.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  3. Optional BYOK API Usage &amp; Costs
                </h3>
                <p className="mt-1 text-slate-300">
                  Using the optional BYOK Simulator requires your own third-party API key. You are solely responsible for all usage fees, rate limits, spending caps (we recommend setting a $5 cap), and compliance with OpenAI or Perplexity terms of service.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  4. Acceptable Use &amp; Guardrails
                </h3>
                <p className="mt-1 text-slate-300">
                  To protect browser stability, the editor enforces a 50,000-character limit and the optional BYOK simulator enforces a 3-prompt batch limit with a 5-second cooldown. You agree not to use this tool to process unlawful content or attempt to circumvent provider rate limits.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-800 bg-slate-950/50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[36px] items-center rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
