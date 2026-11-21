import {
  AuditInput,
  AuditResult,
  FaqPair,
  LineDiagnostic,
  PillarResult,
  ReadabilityMetrics,
} from '../types/geo';
import {
  countWords,
  MAX_DRAFT_CHARS,
  parseDraftSafely,
  safeJsonLdSerialize,
  sanitizeMarkdownText,
} from './sanitizer';

export const SAMPLE_DRAFT = {
  brandName: 'AcmePay',
  targetTopic: 'B2B SaaS Payroll Automation',
  content: `# How AcmePay Automates Multi-Currency B2B SaaS Payroll in 2026

AcmePay is a B2B SaaS payroll automation platform that calculates multi-currency contractor payouts, automates tax withholding across 42 countries, and reconciles general ledger entries in under 15 minutes. Engineering and finance teams using AcmePay reduce monthly payroll close time by 68% and save an average of $42,000 per year in manual compliance overhead.

## Why Manual SaaS Payroll Breaks at Scale

In today's fast-paced world, scaling software companies often run into various reconciliation bottlenecks when expanding internationally. Finance teams spend hours exporting CSV files from HRIS tools, checking exchange rates manually, and double-checking contractor tax forms. These spreadsheets create audit risk and delay monthly board reporting.

## How Does Automated Tax & Ledger Reconciliation Work?

AcmePay connects directly to NetSuite, QuickBooks, and Gusto via webhook sync to validate W-8BEN, W-9, and VAT filings before funds move. In a 2025 benchmark of 180 mid-market SaaS companies, automated pre-payout validation cut failed cross-border transfers by 91% and eliminated 3.5x more duplicate invoice entries than legacy batch processors.

- Real-time FX locking across USD, EUR, GBP, and CAD with 0.35% flat spread
- Automated 1099-NEC and local statutory reporting generated within 24 hours
- Role-based approval workflows with immutable SOC 2 Type II audit trails

## What Is the ROI Comparison vs. Legacy Payroll Providers?

| Capability | AcmePay (2026) | Legacy Payroll Brokers | Manual Spreadsheets |
| --- | --- | --- | --- |
| Monthly Close Time | 14 minutes | 4.5 hours | 18+ hours |
| Cross-Border Fee | 0.35% flat | 2.8% + $25 wire | 3.5% bank markup |
| Error Rate | 0.12% | 2.4% | 6.8% |
| ERP Sync Latency | Real-time (<5s) | Overnight batch | Manual CSV import |

## Which Teams Benefit Most from Payroll Automation?

Distributed SaaS startups with 25 to 500 employees generally see the fastest payback when switching from manual wire workflows. Companies paying international engineers in EUR or GBP recover platform costs in 2 months by eliminating hidden correspondent bank fees, though results may vary slightly depending on local entity structure.`,
};

const FLUFF_OPENERS = [
  /^in today'?s/i,
  /^since the dawn/i,
  /^it'?s no secret/i,
  /^everyone knows/i,
  /^welcome to/i,
  /^have you ever wondered/i,
  /^now more than ever/i,
  /^in an era where/i,
  /^for decades/i,
];

const DECLARATIVE_VERBS =
  /\b(is|are|automates?|enables?|reduces?|eliminates?|provides?|delivers?|helps?|calculates?|connects?|reconciles?)\b/i;

const PERCENT_REGEX = /\b\d+(?:\.\d+)?%/g;
const CURRENCY_REGEX =
  /[$€£]\s?\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:k|m|b|million|billion|thousand))?\b/gi;
const MULTIPLIER_REGEX = /\b\d+(?:\.\d+)?x\b/gi;
const YEAR_REGEX = /\b(?:2025|2026)\b/g;
const METRIC_UNIT_REGEX =
  /\b\d+(?:\.\d+)?\s?(?:hours?|hrs?|minutes?|mins?|seconds?|days?|weeks?|months?|years?|countries|currencies|teams|companies)\b/gi;

const HEDGE_PHRASES = [
  'maybe',
  'sort of',
  'kind of',
  'various',
  'many people say',
  'some say',
  'probably',
  'somewhat',
  'a lot of',
  'arguably',
  'generally speaking',
  'things like',
  'etc.',
];

const QUESTION_HEADING_PREFIX = /^(?:what|how|why|when|which|who|where|can|does|do|is|are|should)\b/i;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectStatsInText(text: string): {
  percentages: string[];
  currencies: string[];
  multipliers: string[];
  years: string[];
  units: string[];
  totalCount: number;
} {
  const percentages = text.match(PERCENT_REGEX) || [];
  const currencies = text.match(CURRENCY_REGEX) || [];
  const multipliers = text.match(MULTIPLIER_REGEX) || [];
  const years = text.match(YEAR_REGEX) || [];
  const units = text.match(METRIC_UNIT_REGEX) || [];
  return {
    percentages,
    currencies,
    multipliers,
    years,
    units,
    totalCount:
      percentages.length +
      currencies.length +
      multipliers.length +
      years.length +
      units.length,
  };
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

function countSyllablesInWord(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  const trimmed = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  const vowelGroups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

function computeReadability(plainText: string, wordCount: number): ReadabilityMetrics {
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const rawSentences = plainText
    .split(/[.!?]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter((s) => countWords(s) >= 3);

  const sentenceCount = Math.max(1, rawSentences.length);
  const effectiveWords = Math.max(1, wordCount);
  const totalSyllables = words.reduce((sum, w) => sum + countSyllablesInWord(w), 0);

  const wordsPerSentence = effectiveWords / sentenceCount;
  const syllablesPerWord = totalSyllables / effectiveWords;

  const rawEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fleschReadingEase =
    wordCount === 0 ? 0 : Math.max(0, Math.min(100, Math.round(rawEase)));

  const rawGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const fleschKincaidGrade =
    wordCount === 0 ? 0 : Math.max(1, Math.min(20, Math.round(rawGrade * 10) / 10));

  let gradeLabel: ReadabilityMetrics['gradeLabel'] = 'Optimal B2B (Grade 8–11)';
  if (fleschKincaidGrade <= 8) gradeLabel = 'Accessible (Grade <=8)';
  else if (fleschKincaidGrade >= 12) gradeLabel = 'Dense Academic (Grade 12+)';

  const longSentences = rawSentences
    .map((s) => ({
      excerpt: s.length > 130 ? `${s.slice(0, 127)}...` : s,
      wordCount: countWords(s),
    }))
    .filter((s) => s.wordCount > 28)
    .sort((a, b) => b.wordCount - a.wordCount);

  return {
    fleschReadingEase,
    fleschKincaidGrade,
    gradeLabel,
    avgSentenceLength: wordCount === 0 ? 0 : Math.round(wordsPerSentence * 10) / 10,
    sentenceCount: wordCount === 0 ? 0 : rawSentences.length,
    readingTimeMinutes: wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 220)),
    longSentenceCount: longSentences.length,
    longSentences: longSentences.slice(0, 3),
  };
}

export function runGeoAudit(input: AuditInput): AuditResult {
  const brandName = input.brandName.trim() || 'Your Brand';
  const targetTopic = input.targetTopic.trim() || 'Core Topic';
  const rawContent = input.content.slice(0, MAX_DRAFT_CHARS);

  const parsed = parseDraftSafely(rawContent);
  const words = parsed.plainText ? parsed.plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = rawContent.length;

  // --- PILLAR 1: Front-Loaded Answer Check (30 pts) ---
  const frontWordLimit = Math.max(45, Math.ceil(wordCount * 0.3));
  const front30Text = words.slice(0, frontWordLimit).join(' ');
  const firstParagraph = parsed.paragraphs[0];
  const openingBlock = parsed.paragraphs
    .slice(0, 2)
    .map((p) => p.text)
    .join(' ');
  const openingSentences = splitSentences(front30Text);
  const firstSentence = openingSentences[0] || front30Text;

  const hasFluffOpener = FLUFF_OPENERS.some((rx) => rx.test(firstSentence.trim()));
  const hasDeclarativeOpening =
    DECLARATIVE_VERBS.test(firstParagraph?.text || front30Text) && wordCount >= 20;
  const openingWordCount = firstParagraph?.wordCount || countWords(front30Text);

  const brandRegex = input.brandName.trim()
    ? new RegExp(`\\b${escapeRegExp(input.brandName.trim())}\\b`, 'i')
    : null;
  const topicKeywords = targetTopic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const brandInFront30 = brandRegex ? brandRegex.test(front30Text) : false;
  const topicInFront30 =
    topicKeywords.length > 0 &&
    topicKeywords.filter((kw) => front30Text.toLowerCase().includes(kw)).length >=
      Math.min(2, topicKeywords.length);

  let p1Score = 0;
  const p1Diagnostics: LineDiagnostic[] = [];

  if (hasDeclarativeOpening) {
    p1Score += 12;
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'pass',
      message: 'Declarative summary detected within the first 30% of word count.',
      excerpt: (firstParagraph?.text || front30Text).slice(0, 120),
    });
  } else {
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'fix',
      message:
        'Missing a direct, declarative opening definition in the first 30% of your draft.',
    });
  }

  if (openingWordCount >= 40 && openingWordCount <= 70) {
    p1Score += 8;
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'pass',
      message: `Opening summary paragraph is ${openingWordCount} words (optimal 40–70 word citation window).`,
    });
  } else if (openingWordCount >= 25 && openingWordCount <= 90) {
    p1Score += 4;
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'warning',
      message: `Opening paragraph is ${openingWordCount} words. Tighten or expand to the 40–70 word sweet spot for LLM snippet extraction.`,
    });
  } else {
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'fix',
      message: `Opening paragraph is ${openingWordCount} words. Aim for a crisp 40–70 word answer block right below your H1.`,
    });
  }

  if (!hasFluffOpener && wordCount > 0) {
    p1Score += 5;
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'pass',
      message: 'No generic intro fluff phrases detected in the lead sentence.',
    });
  } else if (hasFluffOpener) {
    p1Diagnostics.push({
      line: firstParagraph?.line || 1,
      type: 'fix',
      message:
        'Lead sentence opens with meandering intro fluff ("In today\'s..."). Replace immediately with a direct entity definition.',
      excerpt: firstSentence.slice(0, 110),
    });
  }

  if (brandInFront30 || topicInFront30) {
    p1Score += 5;
    p1Diagnostics.push({
      type: 'pass',
      message: `Entity and topic context anchored inside the opening ${frontWordLimit} words.`,
    });
  } else {
    p1Diagnostics.push({
      line: 1,
      type: 'fix',
      message: `Anchor "${brandName}" and "${targetTopic}" explicitly inside the first 30% of your draft.`,
    });
  }

  const p1: PillarResult = {
    id: 'front-loaded',
    title: 'Front-Loaded Answer Check',
    score: Math.min(30, p1Score),
    maxScore: 30,
    summary:
      'Measures whether the first 30% of the draft opens with a concise 40–70 word declarative answer instead of narrative warm-up.',
    diagnostics: p1Diagnostics,
  };

  // --- PILLAR 2: Hard Data & Stat Density (25 pts) ---
  const allStats = detectStatsInText(parsed.plainText);
  const bodyParagraphs = parsed.paragraphs.filter((p) => p.wordCount >= 18);
  const unquantifiedParagraphs = bodyParagraphs.filter((p) => {
    const s = detectStatsInText(p.text);
    return s.totalCount === 0;
  });

  let p2Score = 0;
  const p2Diagnostics: LineDiagnostic[] = [];

  // Up to 10 pts for volume of hard numbers
  if (allStats.totalCount >= 6) {
    p2Score += 10;
  } else if (allStats.totalCount >= 3) {
    p2Score += 7;
  } else if (allStats.totalCount >= 1) {
    p2Score += 4;
  }

  // Up to 8 pts for signal diversity (%, currency/multiplier, recent year 2025/2026)
  let diversityTypes = 0;
  if (allStats.percentages.length > 0) diversityTypes += 1;
  if (allStats.currencies.length > 0 || allStats.multipliers.length > 0) diversityTypes += 1;
  if (allStats.years.length > 0) diversityTypes += 1;
  if (allStats.units.length > 0) diversityTypes += 1;

  p2Score += Math.min(8, diversityTypes * 2);

  // Up to 7 pts for paragraph-level stat coverage
  if (bodyParagraphs.length > 0) {
    const quantifiedCount = bodyParagraphs.length - unquantifiedParagraphs.length;
    const ratio = quantifiedCount / bodyParagraphs.length;
    p2Score += Math.round(ratio * 7);
  }

  if (allStats.totalCount > 0) {
    const breakdownParts: string[] = [];
    if (allStats.percentages.length)
      breakdownParts.push(`${allStats.percentages.length} percentage(s)`);
    if (allStats.currencies.length)
      breakdownParts.push(`${allStats.currencies.length} currency figure(s)`);
    if (allStats.multipliers.length)
      breakdownParts.push(`${allStats.multipliers.length} multiplier(s)`);
    if (allStats.years.length)
      breakdownParts.push(`${allStats.years.length} 2025–2026 citation(s)`);

    p2Diagnostics.push({
      type: allStats.totalCount >= 4 ? 'pass' : 'warning',
      message: `Detected ${allStats.totalCount} quantitative signals (${breakdownParts.join(', ') || `${allStats.units.length} measured unit(s)`}).`,
    });
  } else {
    p2Diagnostics.push({
      type: 'fix',
      message:
        'Zero percentages, currency values, multipliers (2x/10x), or 2025–2026 year citations detected.',
    });
  }

  if (allStats.years.length === 0) {
    p2Diagnostics.push({
      type: 'warning',
      message:
        'No 2025 or 2026 year citations found. Adding current-year benchmarks boosts recency weighting in Perplexity and ChatGPT.',
    });
  }

  unquantifiedParagraphs.forEach((p, idx) => {
    p2Diagnostics.push({
      line: p.line,
      type: 'fix',
      message: `Paragraph ${idx + 1} (${p.wordCount} words) has zero concrete numbers, percentages, or timeframes.`,
      excerpt: p.text.slice(0, 105),
    });
  });

  if (bodyParagraphs.length > 0 && unquantifiedParagraphs.length === 0) {
    p2Diagnostics.push({
      type: 'pass',
      message: 'Every body paragraph contains at least one concrete quantitative anchor.',
    });
  }

  const p2: PillarResult = {
    id: 'stat-density',
    title: 'Hard Data & Stat Density',
    score: Math.min(25, p2Score),
    maxScore: 25,
    summary:
      'Scans for verifiable percentages, currency figures, multipliers, and 2025–2026 benchmarks while flagging unquantified paragraphs.',
    diagnostics: p2Diagnostics,
  };

  // --- PILLAR 3: Structural Extractability (25 pts) ---
  const h2h3 = parsed.headings.filter((h) => h.level === 2 || h.level === 3);
  const questionHeadings = h2h3.filter(
    (h) => h.text.trim().endsWith('?') || QUESTION_HEADING_PREFIX.test(h.text.trim())
  );

  let p3Score = 0;
  const p3Diagnostics: LineDiagnostic[] = [];

  if (h2h3.length >= 2) {
    p3Score += 7;
    p3Diagnostics.push({
      type: 'pass',
      message: `Found ${h2h3.length} structured H2/H3 section headings for chunked retrieval.`,
    });
  } else if (h2h3.length === 1) {
    p3Score += 3;
    p3Diagnostics.push({
      line: h2h3[0].line,
      type: 'warning',
      message: 'Only 1 H2/H3 heading found. Add at least 2–3 subheadings to segment topics.',
    });
  } else {
    p3Diagnostics.push({
      type: 'fix',
      message: 'No H2/H3 headings (## or <h2>) found. LLMs rely on subheadings to chunk passages.',
    });
  }

  if (questionHeadings.length >= 2) {
    p3Score += 6;
    p3Diagnostics.push({
      type: 'pass',
      message: `${questionHeadings.length} question-based headings match conversational buyer prompts.`,
    });
  } else if (questionHeadings.length === 1) {
    p3Score += 3;
    p3Diagnostics.push({
      line: questionHeadings[0].line,
      type: 'warning',
      message:
        'Only 1 question-based heading found. Convert additional H2/H3s into "How/What/Why" questions.',
    });
  } else {
    p3Diagnostics.push({
      type: 'fix',
      message:
        'Zero question-based headings ("What...", "How...", "Why...?") detected. Rephrase subheadings as buyer questions.',
    });
  }

  if (parsed.listItemCount >= 3) {
    p3Score += 6;
    p3Diagnostics.push({
      type: 'pass',
      message: `Found ${parsed.listItemCount} bulleted/numbered list items for clean multi-point extraction.`,
    });
  } else if (parsed.listItemCount > 0) {
    p3Score += 3;
    p3Diagnostics.push({
      type: 'warning',
      message: `Only ${parsed.listItemCount} list item(s) found. Expand key capabilities into 3–5 scannable bullets.`,
    });
  } else {
    p3Diagnostics.push({
      type: 'fix',
      message: 'No bulleted or numbered lists detected. Add a structured list of key specifications.',
    });
  }

  if (parsed.hasTable) {
    p3Score += 6;
    p3Diagnostics.push({
      type: 'pass',
      message: 'Comparison table detected (Markdown or HTML), maximizing structured LLM parsing.',
    });
  } else {
    p3Diagnostics.push({
      type: 'fix',
      message:
        'No Markdown or HTML comparison table detected. Add a 2–4 column benchmark or feature matrix.',
    });
  }

  const p3: PillarResult = {
    id: 'extractability',
    title: 'Structural Extractability',
    score: Math.min(25, p3Score),
    maxScore: 25,
    summary:
      'Evaluates H2/H3 question headings, scannable lists, and Markdown/HTML tables that retrieval pipelines extract cleanly.',
    diagnostics: p3Diagnostics,
  };

  // --- PILLAR 4: Entity & Attribution Clarity (20 pts) ---
  const allSentences = splitSentences(parsed.plainText);
  const claimSentencesWithBrand = brandRegex
    ? allSentences.filter(
        (s) =>
          brandRegex.test(s) &&
          (DECLARATIVE_VERBS.test(s) || detectStatsInText(s).totalCount > 0)
      )
    : [];
  const first150Words = words.slice(0, 150).join(' ');
  const brandInFirst150 = brandRegex ? brandRegex.test(first150Words) : false;

  const hedgeMatches: Array<{ line: number; phrase: string; excerpt: string }> = [];
  const hedgeRegex = new RegExp(
    `\\b(${HEDGE_PHRASES.map((p) => escapeRegExp(p).replace(/\\\./g, '\\.?')).join('|')})`,
    'gi'
  );

  parsed.normalizedLines.forEach((rawLine, idx) => {
    const cleanLine = rawLine.trim();
    if (!cleanLine || /^\|[\s:|-]+\|$/.test(cleanLine)) return;
    let match: RegExpExecArray | null;
    hedgeRegex.lastIndex = 0;
    while ((match = hedgeRegex.exec(cleanLine)) !== null) {
      hedgeMatches.push({
        line: idx + 1,
        phrase: match[1],
        excerpt: cleanLine.slice(0, 110),
      });
    }
  });

  let p4Score = 0;
  const p4Diagnostics: LineDiagnostic[] = [];

  if (!input.brandName.trim()) {
    p4Diagnostics.push({
      type: 'fix',
      message: 'Enter a Brand / Entity Name on the left to evaluate entity-claim attribution.',
    });
  } else {
    if (claimSentencesWithBrand.length >= 2) {
      p4Score += 8;
      p4Diagnostics.push({
        type: 'pass',
        message: `"${brandName}" is directly bound to ${claimSentencesWithBrand.length} declarative/metric claims.`,
      });
    } else if (claimSentencesWithBrand.length === 1) {
      p4Score += 4;
      p4Diagnostics.push({
        type: 'warning',
        message: `"${brandName}" only appears in 1 core claim sentence. Repeat your entity name next to key metrics instead of using pronouns ("we", "it").`,
      });
    } else {
      p4Diagnostics.push({
        type: 'fix',
        message: `"${brandName}" is absent from claim and stat sentences. Replace vague pronouns with explicit entity attribution.`,
      });
    }

    if (brandInFirst150) {
      p4Score += 4;
      p4Diagnostics.push({
        type: 'pass',
        message: `"${brandName}" is introduced within the first 150 words.`,
      });
    } else {
      p4Diagnostics.push({
        line: 1,
        type: 'fix',
        message: `Introduce "${brandName}" inside the first 150 words so LLMs associate the entity with the primary query.`,
      });
    }
  }

  if (hedgeMatches.length === 0) {
    p4Score += 8;
    p4Diagnostics.push({
      type: 'pass',
      message: 'Zero vague hedge words ("maybe", "sort of", "various", etc.) detected.',
    });
  } else {
    const penalty = Math.min(8, hedgeMatches.length * 2);
    p4Score += Math.max(0, 8 - penalty);
    hedgeMatches.forEach((h) => {
      p4Diagnostics.push({
        line: h.line,
        type: 'fix',
        message: `Line ${h.line}: Vague hedge phrase "${h.phrase}" weakens citation authority. Replace with a specific scope or metric.`,
        excerpt: h.excerpt,
      });
    });
  }

  const p4: PillarResult = {
    id: 'entity-clarity',
    title: 'Entity & Attribution Clarity',
    score: Math.min(20, p4Score),
    maxScore: 20,
    summary:
      'Verifies explicit entity-to-claim proximity and flags vague hedge language that lowers LLM confidence.',
    diagnostics: p4Diagnostics,
  };

  const pillars = [p1, p2, p3, p4];
  const overallScore = pillars.reduce((acc, p) => acc + p.score, 0);

  let tierLabel: AuditResult['tierLabel'] = 'Low Citation Signal';
  if (overallScore >= 78) tierLabel = 'Citation Ready';
  else if (overallScore >= 50) tierLabel = 'Needs Optimization';

  // Compute #1 Highest-Impact Fix based on largest deficit
  const sortedByDeficit = [...pillars].sort(
    (a, b) => b.maxScore - b.score - (a.maxScore - a.score)
  );
  const topDeficitPillar = sortedByDeficit[0];
  const pointsLost = topDeficitPillar.maxScore - topDeficitPillar.score;
  const firstFixDiag =
    topDeficitPillar.diagnostics.find((d) => d.type === 'fix') ||
    topDeficitPillar.diagnostics.find((d) => d.type === 'warning');

  const highestImpactFix =
    pointsLost === 0
      ? {
          pillarTitle: 'All Pillars Passing',
          pointsLost: 0,
          headline: 'Strong citation readiness across all 4 GEO pillars.',
          detail:
            'Deploy your JSON-LD schema and llms.txt alongside this draft, then validate brand recall in the BYOK Citation Simulator.',
        }
      : {
          pillarTitle: topDeficitPillar.title,
          pointsLost,
          headline: firstFixDiag?.message || `Improve ${topDeficitPillar.title}`,
          detail:
            firstFixDiag?.excerpt
              ? `Affected excerpt: "${firstFixDiag.excerpt}..." (+${pointsLost} pts recoverable)`
              : `Resolving issues in ${topDeficitPillar.title} unlocks up to +${pointsLost} points.`,
        };

  // --- TAB 2: TL;DR & FAQ EXTRACTOR ---
  const tldrBlock = buildTldrBlock(brandName, targetTopic, parsed.paragraphs, allSentences);
  const faqPairs = extractFaqPairs(
    brandName,
    targetTopic,
    parsed.headings,
    parsed.paragraphs,
    parsed.normalizedLines,
    allSentences
  );

  // --- TAB 3: JSON-LD & llms.txt ---
  const cleanDescription = sanitizeMarkdownText(tldrBlock.text);
  const jsonLdPayload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: sanitizeMarkdownText(
          parsed.headings[0]?.text || `${brandName}: ${targetTopic}`
        ),
        description: cleanDescription,
        about: {
          '@type': 'Thing',
          name: sanitizeMarkdownText(targetTopic),
        },
        publisher: {
          '@type': 'Organization',
          name: sanitizeMarkdownText(brandName),
        },
        dateModified: new Date().toISOString().slice(0, 10),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqPairs.map((pair) => ({
          '@type': 'Question',
          name: sanitizeMarkdownText(pair.question),
          acceptedAnswer: {
            '@type': 'Answer',
            text: sanitizeMarkdownText(pair.answer),
          },
        })),
      },
    ],
  };

  const jsonLdRaw = JSON.stringify(jsonLdPayload, null, 2);
  const jsonLdScriptTag = `<script type="application/ld+json">\n${safeJsonLdSerialize(
    jsonLdPayload
  )}\n</script>`;

  const llmsTxt = buildLlmsTxt(brandName, targetTopic, tldrBlock.text, faqPairs);

  const readability = computeReadability(parsed.plainText, wordCount);

  return {
    overallScore,
    tierLabel,
    wordCount,
    charCount,
    readability,
    highestImpactFix,
    pillars,
    tldrBlock,
    faqPairs,
    jsonLdRaw,
    jsonLdScriptTag,
    llmsTxt,
    analyzedAtIso: new Date().toISOString(),
  };
}

function buildTldrBlock(
  brandName: string,
  targetTopic: string,
  paragraphs: Array<{ text: string; wordCount: number }>,
  allSentences: string[]
): { text: string; wordCount: number } {
  const firstPara = paragraphs[0]?.text || '';
  if (firstPara && countWords(firstPara) >= 35 && countWords(firstPara) <= 68) {
    return {
      text: firstPara,
      wordCount: countWords(firstPara),
    };
  }

  // Construct a crisp ~45–58 word block from strongest sentences
  const statSentence =
    allSentences.find((s) => detectStatsInText(s).totalCount > 0) ||
    allSentences[1] ||
    '';
  const defSentence =
    allSentences.find(
      (s) =>
        s.toLowerCase().includes(brandName.toLowerCase()) &&
        DECLARATIVE_VERBS.test(s)
    ) ||
    allSentences[0] ||
    `${brandName} delivers automated workflows for ${targetTopic}, helping B2B teams replace manual spreadsheets with verifiable, audit-ready operations.`;

  const combined =
    statSentence && statSentence !== defSentence
      ? `${defSentence} ${statSentence}`
      : defSentence;

  const words = combined.split(/\s+/).filter(Boolean);
  const trimmed = words.length > 62 ? `${words.slice(0, 58).join(' ').replace(/[,;:]$/, '')}.` : combined;

  return {
    text: trimmed,
    wordCount: countWords(trimmed),
  };
}

function extractFaqPairs(
  brandName: string,
  targetTopic: string,
  headings: Array<{ level: number; text: string; line: number }>,
  paragraphs: Array<{ text: string; line: number }>,
  normalizedLines: string[],
  allSentences: string[]
): FaqPair[] {
  const pairs: FaqPair[] = [];
  const usedQuestions = new Set<string>();

  // 1. Scan H2/H3 headings and pair with the paragraph immediately following them
  for (const h of headings) {
    if (h.level < 2 || h.level > 3) continue;
    if (pairs.length >= 3) break;

    const rawQ = h.text.trim();
    const isQ = rawQ.endsWith('?') || QUESTION_HEADING_PREFIX.test(rawQ);
    const formattedQ = isQ
      ? rawQ.endsWith('?')
        ? rawQ
        : `${rawQ}?`
      : `How does ${brandName} address ${rawQ.toLowerCase()}?`;

    const nextPara = paragraphs.find((p) => p.line > h.line && p.line <= h.line + 6);
    let answer = nextPara?.text || '';

    // Fallback: grab bullet lines right after heading
    if (!answer) {
      const bulletLines = normalizedLines
        .slice(h.line, h.line + 6)
        .filter((l) => /^(?:[-*+]|\d+\.)\s+/.test(l.trim()))
        .map((l) => l.trim().replace(/^(?:[-*+]|\d+\.)\s+/, ''));
      if (bulletLines.length > 0) {
        answer = `${brandName} supports: ${bulletLines.join('; ')}.`;
      }
    }

    if (answer && !usedQuestions.has(formattedQ.toLowerCase())) {
      const sentences = splitSentences(answer);
      const conciseAnswer =
        sentences.length > 2 ? sentences.slice(0, 2).join(' ') : answer;
      usedQuestions.add(formattedQ.toLowerCase());
      pairs.push({
        question: formattedQ,
        answer: conciseAnswer,
        sourceHint: `Extracted from heading at line ${h.line}`,
      });
    }
  }

  // 2. Fill remaining slots up to 3 using key declarative / metric sentences
  const statSentences = allSentences.filter((s) => detectStatsInText(s).totalCount > 0);
  const fallbacks: FaqPair[] = [
    {
      question: `What is ${brandName} and how does it support ${targetTopic}?`,
      answer:
        allSentences[0] ||
        `${brandName} is a specialized solution for ${targetTopic} built to deliver measurable operational efficiency and structured compliance.`,
      sourceHint: 'Synthesized from lead entity definition',
    },
    {
      question: `What measurable benchmarks does ${brandName} achieve for ${targetTopic}?`,
      answer:
        statSentences[0] ||
        `${brandName} helps B2B teams standardize ${targetTopic} workflows and reduce manual reconciliation overhead.`,
      sourceHint: statSentences[0]
        ? 'Extracted from quantitative benchmark sentence'
        : 'Synthesized from topic context',
    },
    {
      question: `Who should adopt ${brandName} for ${targetTopic}?`,
      answer:
        allSentences[allSentences.length - 1] ||
        `B2B operations, finance, and technical teams scaling ${targetTopic} benefit most from adopting ${brandName}.`,
      sourceHint: 'Extracted from target audience section',
    },
  ];

  for (const fb of fallbacks) {
    if (pairs.length >= 3) break;
    if (!usedQuestions.has(fb.question.toLowerCase())) {
      usedQuestions.add(fb.question.toLowerCase());
      pairs.push(fb);
    }
  }

  return pairs.slice(0, 3);
}

function buildLlmsTxt(
  brandName: string,
  targetTopic: string,
  summaryText: string,
  faqPairs: FaqPair[]
): string {
  const safeBrand = sanitizeMarkdownText(brandName);
  const safeTopic = sanitizeMarkdownText(targetTopic);
  const slug =
    brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'brand';

  const faqBullets = faqPairs
    .map(
      (f, idx) =>
        `- [${sanitizeMarkdownText(f.question)}](https://example.com/${slug}/faq#q${idx + 1}): ${sanitizeMarkdownText(
          f.answer.slice(0, 140)
        )}${f.answer.length > 140 ? '...' : ''}`
    )
    .join('\n');

  return `# ${safeBrand}

> ${sanitizeMarkdownText(summaryText)}

## Core Documentation & Product Overview

- [${safeBrand} — ${safeTopic} Overview](https://example.com/${slug}): Canonical product architecture, supported integrations, and verified 2026 benchmarks.
- [API & Implementation Guide](https://example.com/${slug}/docs): Public technical reference, webhook specifications, and data model schemas.
- [Pricing & Enterprise SLA](https://example.com/${slug}/pricing): Transparent tier limits, security certifications, and support response SLAs.

## Verified Benchmarks & FAQ

${faqBullets}
`;
}

export function compileFullAuditMarkdown(
  input: AuditInput,
  result: AuditResult
): string {
  const brand = sanitizeMarkdownText(input.brandName.trim() || 'Your Brand');
  const topic = sanitizeMarkdownText(input.targetTopic.trim() || 'Core Topic');

  const pillarLines = result.pillars
    .map((p) => {
      const diags = p.diagnostics
        .map((d) => {
          const prefix = d.type === 'pass' ? '[PASS]' : d.type === 'warning' ? '[WARN]' : '[FIX]';
          const lineRef = d.line ? ` (Line ${d.line})` : '';
          return `- ${prefix}${lineRef} ${d.message}`;
        })
        .join('\n');
      return `### ${p.title} (${p.score}/${p.maxScore} pts)\n${p.summary}\n\n${diags}`;
    })
    .join('\n\n');

  const faqSection = result.faqPairs
    .map((f, i) => `### Q${i + 1}: ${f.question}\n${f.answer}`)
    .join('\n\n');

  return `# GEO Citation Readiness Audit Report

- **Brand / Entity:** ${brand}
- **Target Topic:** ${topic}
- **Overall Score:** ${result.overallScore} / 100 (${result.tierLabel})
- **Draft Volume:** ${result.wordCount} words · ${result.charCount} characters · ~${result.readability.readingTimeMinutes} min read
- **Readability:** Flesch-Kincaid Grade ${result.readability.fleschKincaidGrade} (${result.readability.gradeLabel}) · Reading Ease ${result.readability.fleschReadingEase}/100 · Avg ${result.readability.avgSentenceLength} words/sentence · ${result.readability.longSentenceCount} long sentence(s) (>28 words)
- **Generated At (Local Browser):** ${result.analyzedAtIso}

---

## #1 Highest-Impact Fix

**${result.highestImpactFix.pillarTitle}** (-${result.highestImpactFix.pointsLost} pts): ${result.highestImpactFix.headline}

${result.highestImpactFix.detail}

---

## Pillar Breakdown & Line-Level Diagnostics

${pillarLines}

---

## Recommended Front-Loaded TL;DR Block (${result.tldrBlock.wordCount} words)

> ${result.tldrBlock.text}

---

## Extracted LLM-Ready Q&A Pairs

${faqSection}

---

## JSON-LD Structured Data (Article + FAQPage)

\`\`\`html
${result.jsonLdScriptTag}
\`\`\`

---

## llms.txt Specification Draft

\`\`\`markdown
${result.llmsTxt.trim()}
\`\`\`
`;
}
