/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Activity,
  Code2,
  Download,
  FileText,
  FlaskConical,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { HowToUseGuide } from './components/HowToUseGuide';
import { InputWorkspace } from './components/InputWorkspace';
import { LegalDocType, LegalModal } from './components/LegalModal';
import { SchemaLlmsTab } from './components/SchemaLlmsTab';
import { ScoreTab } from './components/ScoreTab';
import { SimulatorTab } from './components/SimulatorTab';
import { SnippetsTab } from './components/SnippetsTab';
import { TopTrustHeader } from './components/TopTrustHeader';
import { AuditResult, TabId } from './types/geo';
import { downloadTextFile } from './utils/exportHelpers';
import {
  compileFullAuditMarkdown,
  runGeoAudit,
  SAMPLE_DRAFT,
} from './utils/geoAnalyzer';

const TABS: Array<{ id: TabId; label: string; icon: typeof Activity }> = [
  { id: 'score', label: 'Citation Readiness Score', icon: Activity },
  { id: 'snippets', label: 'TL;DR & FAQ Extractor', icon: ListChecks },
  { id: 'schema', label: 'Schema & llms.txt', icon: Code2 },
  { id: 'simulator', label: 'BYOK Simulator', icon: FlaskConical },
];

export default function App() {
  const [brandName, setBrandName] = useState('');
  const [targetTopic, setTargetTopic] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('score');
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [previousAudit, setPreviousAudit] = useState<AuditResult | null>(null);
  const [hasDirtyChanges, setHasDirtyChanges] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  const handleRunAudit = () => {
    if (!content.trim()) return;
    const result = runGeoAudit({ brandName, targetTopic, content });
    if (audit) {
      setPreviousAudit(audit);
    }
    setAudit(result);
    setHasDirtyChanges(false);
  };

  const handleLoadSample = () => {
    setBrandName(SAMPLE_DRAFT.brandName);
    setTargetTopic(SAMPLE_DRAFT.targetTopic);
    setContent(SAMPLE_DRAFT.content);
    const result = runGeoAudit({
      brandName: SAMPLE_DRAFT.brandName,
      targetTopic: SAMPLE_DRAFT.targetTopic,
      content: SAMPLE_DRAFT.content,
    });
    setPreviousAudit(null);
    setAudit(result);
    setHasDirtyChanges(false);
  };

  const handleClear = () => {
    setBrandName('');
    setTargetTopic('');
    setContent('');
    setPreviousAudit(null);
    setAudit(null);
    setHasDirtyChanges(false);
  };

  const handleBrandChange = (val: string) => {
    setBrandName(val);
    if (audit) setHasDirtyChanges(true);
  };

  const handleTopicChange = (val: string) => {
    setTargetTopic(val);
    if (audit) setHasDirtyChanges(true);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (audit) setHasDirtyChanges(true);
  };

  const handleDownloadFullReport = () => {
    if (!audit) return;
    const markdown = compileFullAuditMarkdown(
      { brandName, targetTopic, content },
      audit
    );
    const slug =
      (brandName.trim() || 'geo-citation')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'geo-citation';
    downloadTextFile(`${slug}-geo-audit-report.md`, markdown, 'text/markdown;charset=utf-8');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopTrustHeader />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <HowToUseGuide
          isOpen={showGuide}
          onToggle={() => setShowGuide((prev) => !prev)}
          onLoadSample={handleLoadSample}
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Input & Context */}
          <div className="lg:col-span-5">
            <InputWorkspace
              brandName={brandName}
              targetTopic={targetTopic}
              content={content}
              hasDirtyChanges={hasDirtyChanges}
              onBrandNameChange={handleBrandChange}
              onTargetTopicChange={handleTopicChange}
              onContentChange={handleContentChange}
              onClear={handleClear}
              onLoadSample={handleLoadSample}
              onRunAudit={handleRunAudit}
            />
          </div>

          {/* Right Column: Tabbed Diagnostic & Generator Suite */}
          <section
            aria-label="Diagnostic and Generator Suite"
            className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 lg:col-span-7"
          >
            {/* Diagnostic Panel Header with Report Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Diagnostic & Generator Suite
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {audit
                    ? `Last local audit: ${audit.overallScore}/100 · ${audit.tierLabel}`
                    : 'Run a local audit to compute citation readiness and generate structured assets.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadFullReport}
                disabled={!audit}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950/50 disabled:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Full Audit Report (.md)</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              role="tablist"
              aria-label="Diagnostic Views"
              className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/40 px-4 py-2 sm:px-6"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                      isActive
                        ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                        : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                    {tab.id === 'score' && audit && (
                      <span className="font-mono text-[11px] font-semibold text-cyan-400 tabular-nums">
                        {audit.overallScore}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Panel Body */}
            <div className="p-5 sm:p-6">
              {activeTab === 'simulator' ? (
                <SimulatorTab brandName={brandName} targetTopic={targetTopic} />
              ) : !audit ? (
                <EmptyAuditState onLoadSample={handleLoadSample} onRunAudit={handleRunAudit} hasContent={Boolean(content.trim())} />
              ) : activeTab === 'score' ? (
                <ScoreTab audit={audit} previousAudit={previousAudit} />
              ) : activeTab === 'snippets' ? (
                <SnippetsTab audit={audit} />
              ) : (
                <SchemaLlmsTab audit={audit} />
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
          <p>GEO Citation Readiness Studio · 100% Client-Side Diagnostic Workbench</p>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="text-slate-400 transition-colors hover:text-cyan-400 hover:underline whitespace-nowrap cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="text-slate-400 transition-colors hover:text-cyan-400 hover:underline whitespace-nowrap cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      <LegalModal
        activeDoc={legalDoc}
        onSelectDoc={setLegalDoc}
        onClose={() => setLegalDoc(null)}
      />
    </div>
  );
}

interface EmptyAuditStateProps {
  hasContent: boolean;
  onLoadSample: () => void;
  onRunAudit: () => void;
}

function EmptyAuditState({
  hasContent,
  onLoadSample,
  onRunAudit,
}: EmptyAuditStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-100">
        Ready for Local GEO Citation Analysis
      </h3>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
        Paste your article, landing page copy, or HTML draft on the left and click{' '}
        <span className="font-medium text-slate-200">Run GEO Citation Audit</span> to compute your 0–100 score, extract TL;DR & FAQ blocks, and generate valid JSON-LD +{' '}
        <code className="font-mono text-slate-300">llms.txt</code>.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {hasContent ? (
          <button
            type="button"
            onClick={onRunAudit}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer"
          >
            <span>Run GEO Citation Audit Now</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Load Sample B2B Draft & Run Audit</span>
          </button>
        )}
      </div>
    </div>
  );
}
