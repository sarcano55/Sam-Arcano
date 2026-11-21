import { ChangeEvent, useRef, useState } from 'react';
import { FileText, Play, RotateCcw, Upload } from 'lucide-react';
import { countWords, MAX_DRAFT_CHARS } from '../utils/sanitizer';

interface InputWorkspaceProps {
  brandName: string;
  targetTopic: string;
  content: string;
  hasDirtyChanges: boolean;
  onBrandNameChange: (val: string) => void;
  onTargetTopicChange: (val: string) => void;
  onContentChange: (val: string) => void;
  onClear: () => void;
  onLoadSample: () => void;
  onRunAudit: () => void;
}

const MAX_UPLOAD_BYTES = 512 * 1024; // 512 KB client-side guardrail
const ALLOWED_EXT_REGEX = /\.(?:md|markdown|txt|html|htm)$/i;

export function InputWorkspace({
  brandName,
  targetTopic,
  content,
  hasDirtyChanges,
  onBrandNameChange,
  onTargetTopicChange,
  onContentChange,
  onClear,
  onLoadSample,
  onRunAudit,
}: InputWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadNotice, setUploadNotice] = useState<{
    type: 'info' | 'warning';
    text: string;
  } | null>(null);

  const charCount = content.length;
  const wordCount = countWords(content);
  const isAtLimit = charCount >= MAX_DRAFT_CHARS;

  const handleTextChange = (raw: string) => {
    setUploadNotice(null);
    onContentChange(raw.slice(0, MAX_DRAFT_CHARS));
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_EXT_REGEX.test(file.name)) {
      setUploadNotice({
        type: 'warning',
        text: `Unsupported file "${file.name}". Please upload a .md, .txt, or .html file.`,
      });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadNotice({
        type: 'warning',
        text: `"${file.name}" exceeds 512 KB. Only the first 50,000 characters can be audited locally.`,
      });
    }

    try {
      const text = await file.text();
      const wasTruncated = text.length > MAX_DRAFT_CHARS;
      onContentChange(text.slice(0, MAX_DRAFT_CHARS));
      setUploadNotice({
        type: wasTruncated ? 'warning' : 'info',
        text: wasTruncated
          ? `Loaded "${file.name}" (truncated to 50,000 characters). Click Run GEO Citation Audit.`
          : `Loaded "${file.name}" (${text.length.toLocaleString()} chars) locally in browser memory.`,
      });
    } catch {
      setUploadNotice({
        type: 'warning',
        text: `Could not read "${file.name}". Ensure it is a UTF-8 text, Markdown, or HTML file.`,
      });
    }
  };

  const handleClearClick = () => {
    setUploadNotice(null);
    onClear();
  };

  const handleSampleClick = () => {
    setUploadNotice(null);
    onLoadSample();
  };

  return (
    <section
      aria-label="Draft Input and Entity Context"
      className="flex flex-col gap-5 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Content & Entity Context
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Supports Plain Text, Markdown, or raw HTML (processed strictly in memory).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.html,.htm,text/plain,text/markdown,text/html"
            onChange={handleFileSelected}
            className="hidden"
            aria-label="Upload local draft file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>Upload Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSampleClick}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>Load Sample B2B Draft</span>
          </button>

          <button
            type="button"
            onClick={handleClearClick}
            disabled={!brandName && !targetTopic && !content}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {uploadNotice && (
        <div
          className={`rounded-lg border px-3.5 py-2.5 text-xs ${
            uploadNotice.type === 'warning'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          }`}
        >
          {uploadNotice.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="brand-entity-input"
            className="mb-1.5 block text-xs font-medium text-slate-300"
          >
            Brand / Entity Name
          </label>
          <input
            id="brand-entity-input"
            type="text"
            maxLength={120}
            value={brandName}
            onChange={(e) => onBrandNameChange(e.target.value)}
            placeholder="e.g., AcmePay"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="target-topic-input"
            className="mb-1.5 block text-xs font-medium text-slate-300"
          >
            Target Topic / Buyer Query Context
          </label>
          <input
            id="target-topic-input"
            type="text"
            maxLength={160}
            value={targetTopic}
            onChange={(e) => onTargetTopicChange(e.target.value)}
            placeholder="e.g., B2B SaaS Payroll Automation"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor="content-draft-editor"
            className="text-xs font-medium text-slate-300"
          >
            Content Draft Editor
          </label>
          <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
            <span className="text-slate-400">{wordCount.toLocaleString()} words</span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className={isAtLimit ? 'font-medium text-rose-400' : 'text-slate-400'}>
              {charCount.toLocaleString()} / {MAX_DRAFT_CHARS.toLocaleString()} chars
            </span>
          </div>
        </div>

        <textarea
          id="content-draft-editor"
          value={content}
          onChange={(e) => handleTextChange(e.target.value)}
          maxLength={MAX_DRAFT_CHARS}
          rows={18}
          spellCheck={false}
          placeholder="Paste your article, product documentation, or HTML draft here (up to 50,000 characters), upload a .md/.txt/.html file, or click Load Sample B2B Draft above..."
          className="min-h-[360px] w-full flex-1 resize-y rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        {isAtLimit && (
          <p className="mt-2 text-xs text-rose-400">
            Maximum input size reached (50,000 characters) to ensure fast in-browser parsing.
          </p>
        )}
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={onRunAudit}
          disabled={!content.trim()}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          <span>
            {hasDirtyChanges ? 'Run GEO Citation Audit (Refresh)' : 'Run GEO Citation Audit'}
          </span>
        </button>
      </div>
    </section>
  );
}
