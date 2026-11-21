import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { AuditResult } from '../types/geo';
import { copyTextToClipboard } from '../utils/exportHelpers';

interface SnippetsTabProps {
  audit: AuditResult;
}

export function SnippetsTab({ audit }: SnippetsTabProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, markdown: string) => {
    const ok = await copyTextToClipboard(markdown);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  const tldrMarkdown = `> **TL;DR:** ${audit.tldrBlock.text}`;
  const allFaqsMarkdown = audit.faqPairs
    .map((faq) => `### ${faq.question}\n\n${faq.answer}`)
    .join('\n\n');

  return (
    <div className="flex flex-col gap-6">
      {/* Front-Loaded Answer Block */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Front-Loaded Answer Block (Top-of-Page TL;DR)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Place directly beneath your H1 so retrieval engines extract a crisp summary.{' '}
              <span className="font-mono text-cyan-400 tabular-nums">
                {audit.tldrBlock.wordCount} words
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('tldr', tldrMarkdown)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === 'tldr' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm leading-relaxed text-slate-200">
            {audit.tldrBlock.text}
          </p>
        </div>
      </section>

      {/* Extracted Q&A Pairs */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Extracted LLM-Ready Q&A Pairs
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              3 structured question-and-answer blocks built from your headings and key claims.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('all-faqs', allFaqsMarkdown)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === 'all-faqs' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-800">
          {audit.faqPairs.map((pair, idx) => {
            const pairKey = `faq-${idx}`;
            const pairMarkdown = `### ${pair.question}\n\n${pair.answer}`;
            return (
              <article key={pairKey} className="py-4 first:pt-1 last:pb-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">
                      Q{idx + 1} · {pair.sourceHint}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-cyan-300">
                      {pair.question}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(pairKey, pairMarkdown)}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === pairKey ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {pair.answer}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
