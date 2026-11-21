import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { AuditResult } from '../types/geo';

interface ScoreTabProps {
  audit: AuditResult;
  previousAudit: AuditResult | null;
}

export function ScoreTab({ audit, previousAudit }: ScoreTabProps) {
  const overallDelta = previousAudit
    ? audit.overallScore - previousAudit.overallScore
    : null;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, audit.overallScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const tierTone =
    audit.overallScore >= 78
      ? 'text-cyan-400'
      : audit.overallScore >= 50
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <div className="flex flex-col gap-6">
      {/* Score Gauge + #1 Highest-Impact Fix */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
        <div className="flex items-center gap-5 rounded-xl border border-slate-800 bg-slate-950/60 p-5 lg:col-span-5">
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 124 124" aria-hidden="true">
              <circle
                cx="62"
                cy="62"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
              />
              <circle
                cx="62"
                cy="62"
                r={radius}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-300 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-cyan-400 tabular-nums">
                {audit.overallScore}
              </span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                / 100
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">Readiness Tier</p>
            <p className={`mt-1 text-lg font-semibold ${tierTone}`}>
              {audit.tierLabel}
            </p>
            {overallDelta !== null && (
              <p
                className={`mt-1 font-mono text-xs font-semibold tabular-nums ${
                  overallDelta > 0
                    ? 'text-cyan-400'
                    : overallDelta < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                }`}
              >
                {overallDelta > 0
                  ? `+${overallDelta} pts vs. previous audit`
                  : overallDelta < 0
                    ? `${overallDelta} pts vs. previous audit`
                    : '0 pts change vs. previous audit'}
              </p>
            )}
            <p className="mt-1.5 font-mono text-xs text-slate-400 tabular-nums">
              {audit.wordCount.toLocaleString()} words · {audit.charCount.toLocaleString()} chars
            </p>
          </div>
        </div>

        {/* #1 Highest-Impact Fix Callout */}
        <div
          className={`flex h-full flex-col justify-center rounded-xl border p-5 lg:col-span-7 ${
            audit.highestImpactFix.pointsLost > 0
              ? 'border-rose-500/30 bg-rose-500/10'
              : 'border-cyan-500/30 bg-cyan-500/10'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {audit.highestImpactFix.pointsLost > 0 ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
              )}
              <span
                className={`text-xs font-semibold ${
                  audit.highestImpactFix.pointsLost > 0
                    ? 'text-rose-400'
                    : 'text-cyan-400'
                }`}
              >
                #1 Highest-Impact Fix · {audit.highestImpactFix.pillarTitle}
              </span>
            </div>
            {audit.highestImpactFix.pointsLost > 0 && (
              <span className="font-mono text-xs font-semibold text-rose-400 tabular-nums whitespace-nowrap">
                -{audit.highestImpactFix.pointsLost} pts
              </span>
            )}
          </div>

          <p className="mt-2.5 text-sm font-semibold text-slate-100">
            {audit.highestImpactFix.headline}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
            {audit.highestImpactFix.detail}
          </p>
        </div>
      </div>

      {/* Readability & Scannability Metrics (100% Local Math) */}
      <section
        aria-label="Readability and Scannability Metrics"
        className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Readability &amp; Scannability
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Computed locally via Flesch-Kincaid heuristics. Grade 8–11 prose improves LLM chunk extraction.
            </p>
          </div>
          <span
            className={`font-mono text-xs font-semibold whitespace-nowrap ${
              audit.readability.fleschKincaidGrade >= 12
                ? 'text-rose-400'
                : 'text-cyan-400'
            }`}
          >
            {audit.readability.gradeLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-r border-slate-800/80 pr-3 last:border-r-0">
            <p className="text-[11px] font-medium text-slate-400">FK Grade Level</p>
            <p className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {audit.readability.fleschKincaidGrade}
            </p>
          </div>

          <div className="sm:border-r sm:border-slate-800/80 sm:pr-3">
            <p className="text-[11px] font-medium text-slate-400">Reading Ease</p>
            <p className="mt-1 font-mono text-xl font-semibold text-cyan-400 tabular-nums">
              {audit.readability.fleschReadingEase}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </p>
          </div>

          <div className="border-r border-slate-800/80 pr-3">
            <p className="text-[11px] font-medium text-slate-400">Avg Sentence</p>
            <p className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {audit.readability.avgSentenceLength}
              <span className="text-xs font-normal text-slate-500"> words</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-slate-400">Est. Read Time</p>
            <p className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              ~{audit.readability.readingTimeMinutes}
              <span className="text-xs font-normal text-slate-500"> min</span>
            </p>
          </div>
        </div>

        {audit.readability.longSentenceCount > 0 ? (
          <div className="mt-4 border-t border-slate-800/80 pt-3.5">
            <p className="text-xs font-medium text-amber-300">
              {audit.readability.longSentenceCount} dense sentence(s) exceed 28 words — split them for cleaner AI citation extraction:
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {audit.readability.longSentences.map((item, idx) => (
                <li
                  key={`long-sent-${idx}`}
                  className="flex items-start justify-between gap-3 rounded border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-300"
                >
                  <span className="font-mono text-[11px] leading-relaxed text-slate-400">
                    “{item.excerpt}”
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-amber-400 tabular-nums whitespace-nowrap shrink-0">
                    {item.wordCount}w
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-cyan-300">
            All sentences are concise (&le; 28 words) for clean passage retrieval.
          </p>
        )}
      </section>

      {/* 4 Pillar Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4">
        {audit.pillars.map((pillar) => {
          const pct = Math.round((pillar.score / pillar.maxScore) * 100);
          const prevPillar = previousAudit?.pillars.find((p) => p.id === pillar.id);
          const pillarDelta = prevPillar ? pillar.score - prevPillar.score : null;
          return (
            <article
              key={pillar.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {pillar.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">{pillar.summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {pillarDelta !== null && pillarDelta !== 0 && (
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${
                        pillarDelta > 0 ? 'text-cyan-400' : 'text-rose-400'
                      }`}
                    >
                      {pillarDelta > 0 ? `+${pillarDelta}` : pillarDelta}
                    </span>
                  )}
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-semibold text-cyan-400 tabular-nums whitespace-nowrap">
                    {pillar.score} / {pillar.maxScore}
                  </span>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-slate-800/80 border-t border-slate-800/80">
                {pillar.diagnostics.map((diag, idx) => (
                  <li
                    key={`${pillar.id}-diag-${idx}`}
                    className="flex items-start gap-2.5 py-2.5 text-xs leading-relaxed"
                  >
                    {diag.type === 'pass' ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                        aria-hidden="true"
                      />
                    ) : diag.type === 'warning' ? (
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                        aria-hidden="true"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          diag.type === 'pass'
                            ? 'text-slate-200'
                            : diag.type === 'warning'
                              ? 'text-amber-200'
                              : 'text-rose-200'
                        }
                      >
                        {diag.line ? (
                          <span className="mr-1.5 font-mono text-[11px] font-medium text-slate-400 tabular-nums">
                            [Line {diag.line}]
                          </span>
                        ) : null}
                        {diag.message}
                      </p>
                      {diag.excerpt && (
                        <p className="mt-1 truncate rounded border border-slate-800 bg-slate-900/90 px-2.5 py-1 font-mono text-[11px] text-slate-400">
                          “{diag.excerpt}”
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
