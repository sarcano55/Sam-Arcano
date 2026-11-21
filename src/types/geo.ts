export type TabId = 'score' | 'snippets' | 'schema' | 'simulator';

export type PillarId =
  | 'front-loaded'
  | 'stat-density'
  | 'extractability'
  | 'entity-clarity';

export interface LineDiagnostic {
  line?: number;
  type: 'pass' | 'warning' | 'fix';
  message: string;
  excerpt?: string;
}

export interface PillarResult {
  id: PillarId;
  title: string;
  score: number;
  maxScore: number;
  summary: string;
  diagnostics: LineDiagnostic[];
}

export interface FaqPair {
  question: string;
  answer: string;
  sourceHint: string;
}

export interface AuditInput {
  brandName: string;
  targetTopic: string;
  content: string;
}

export interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gradeLabel: 'Accessible (Grade <=8)' | 'Optimal B2B (Grade 8–11)' | 'Dense Academic (Grade 12+)';
  avgSentenceLength: number;
  sentenceCount: number;
  readingTimeMinutes: number;
  longSentenceCount: number;
  longSentences: Array<{ excerpt: string; wordCount: number }>;
}

export interface AuditResult {
  overallScore: number;
  tierLabel: 'Citation Ready' | 'Needs Optimization' | 'Low Citation Signal';
  wordCount: number;
  charCount: number;
  readability: ReadabilityMetrics;
  highestImpactFix: {
    pillarTitle: string;
    pointsLost: number;
    headline: string;
    detail: string;
  };
  pillars: PillarResult[];
  tldrBlock: {
    text: string;
    wordCount: number;
  };
  faqPairs: FaqPair[];
  jsonLdRaw: string;
  jsonLdScriptTag: string;
  llmsTxt: string;
  analyzedAtIso: string;
}

export type SimulatorProvider = 'openai' | 'perplexity';

export interface SimulatorPromptResult {
  prompt: string;
  responseText: string;
  brandMentionCount: number;
  citations: string[];
  model: string;
  error?: string;
}
