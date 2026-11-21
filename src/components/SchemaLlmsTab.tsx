import { useState } from 'react';
import { AlertTriangle, Check, Copy, Download } from 'lucide-react';
import { AuditResult } from '../types/geo';
import { copyTextToClipboard, downloadTextFile } from '../utils/exportHelpers';

interface SchemaLlmsTabProps {
  audit: AuditResult;
}

export function SchemaLlmsTab({ audit }: SchemaLlmsTabProps) {
  const [copiedKey, setCopiedKey] = useState<'jsonld' | 'llms' | null>(null);

  const handleCopy = async (key: 'jsonld' | 'llms', text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* JSON-LD Structured Data */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              JSON-LD Schema (Article + FAQPage)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Escaped for safe &lt;head&gt; embedding with zero unescaped angle brackets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy('jsonld', audit.jsonLdScriptTag)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'jsonld' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                downloadTextFile('schema.json', audit.jsonLdRaw, 'application/ld+json')
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
          <code>{audit.jsonLdScriptTag}</code>
        </pre>
      </section>

      {/* llms.txt Generator */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              llms.txt Specification File
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Formatted to llmstxt.org standards with H1 entity title, blockquote summary, and H2 links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy('llms', audit.llmsTxt)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'llms' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                downloadTextFile('llms.txt', audit.llmsTxt, 'text/plain;charset=utf-8')
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Rose Security Warning Note */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          <p>
            <span className="font-semibold text-rose-200">Security Reminder:</span>{' '}
            Your <code className="font-mono text-rose-200">/llms.txt</code> file is publicly crawlable. Never include private dashboards, admin URLs, staging endpoints, or internal API keys in this file.
          </p>
        </div>

        <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
          <code>{audit.llmsTxt}</code>
        </pre>
      </section>
    </div>
  );
}
