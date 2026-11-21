export const MAX_DRAFT_CHARS = 50_000;

/**
 * Safely escapes JSON strings for embedding inside HTML <script type="application/ld+json">
 * tags so user text cannot break out via </script> or HTML entity parsing.
 */
export function safeJsonLdSerialize(payload: unknown): string {
  return JSON.stringify(payload, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Normalizes a string for safe Markdown inline output (escapes raw angle brackets).
 */
export function sanitizeMarkdownText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export interface ParsedDocument {
  normalizedLines: string[];
  headings: Array<{ level: number; text: string; line: number }>;
  paragraphs: Array<{ text: string; line: number; wordCount: number }>;
  listItemCount: number;
  hasTable: boolean;
  plainText: string;
}

/**
 * Safely parses Plain Text, Markdown, or raw HTML in browser memory via DOMParser.
 * Strips executable elements (<script>, <style>, <iframe>) and extracts structured blocks.
 */
export function parseDraftSafely(rawInput: string): ParsedDocument {
  const capped = rawInput.slice(0, MAX_DRAFT_CHARS).replace(/\r\n/g, '\n');
  const looksLikeHtml = /<\/?(?:p|h[1-6]|div|section|article|ul|ol|li|table|tr|td|th|br|strong|em)\b[^>]*>/i.test(
    capped
  );

  let workingText = capped;
  let htmlListCount = 0;
  let htmlHasTable = false;

  if (looksLikeHtml && typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(capped, 'text/html');

    // Strip any dangerous or non-content tags
    const forbidden = doc.querySelectorAll('script, style, iframe, object, embed, noscript, svg');
    forbidden.forEach((node) => node.remove());

    htmlListCount = doc.querySelectorAll('ul li, ol li').length;
    htmlHasTable = doc.querySelectorAll('table').length > 0;

    const lines: string[] = [];
    const blockSelectors = 'h1, h2, h3, h4, h5, h6, p, li, tr, blockquote';
    const blocks = doc.body.querySelectorAll(blockSelectors);

    if (blocks.length > 0) {
      blocks.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return;

        if (tag === 'h1') lines.push(`# ${text}`);
        else if (tag === 'h2') lines.push(`## ${text}`);
        else if (tag === 'h3') lines.push(`### ${text}`);
        else if (tag === 'h4' || tag === 'h5' || tag === 'h6') lines.push(`#### ${text}`);
        else if (tag === 'li') lines.push(`- ${text}`);
        else if (tag === 'tr') {
          const cells = Array.from(el.querySelectorAll('th, td')).map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').trim()
          );
          if (cells.length > 0) {
            lines.push(`| ${cells.join(' | ')} |`);
          }
        } else {
          lines.push(text);
        }
      });
      workingText = lines.join('\n');
    } else {
      workingText = (doc.body.textContent || '').trim();
    }
  }

  const normalizedLines = workingText.split('\n');
  const headings: Array<{ level: number; text: string; line: number }> = [];
  const paragraphs: Array<{ text: string; line: number; wordCount: number }> = [];
  let mdListCount = 0;
  let mdTableHeaderRows = 0;
  let mdTableDividerFound = false;

  let currentParagraphLines: string[] = [];
  let paragraphStartLine = 1;

  const flushParagraph = () => {
    if (currentParagraphLines.length === 0) return;
    const joined = currentParagraphLines.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) {
      const cleanProse = stripInlineMarkdown(joined);
      const wc = countWords(cleanProse);
      paragraphs.push({
        text: cleanProse,
        line: paragraphStartLine,
        wordCount: wc,
      });
    }
    currentParagraphLines = [];
  };

  normalizedLines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      headings.push({
        level: headingMatch[1].length,
        text: stripInlineMarkdown(headingMatch[2]),
        line: lineNum,
      });
      return;
    }

    if (/^\|.+\|$/.test(trimmed)) {
      flushParagraph();
      if (/^\|[\s:|-]+\|$/.test(trimmed)) {
        mdTableDividerFound = true;
      } else {
        mdTableHeaderRows += 1;
      }
      return;
    }

    if (/^(?:[-*+]|\d+\.)\s+/.test(trimmed)) {
      flushParagraph();
      mdListCount += 1;
      return;
    }

    if (/^```/.test(trimmed)) {
      flushParagraph();
      return;
    }

    if (currentParagraphLines.length === 0) {
      paragraphStartLine = lineNum;
    }
    currentParagraphLines.push(trimmed);
  });

  flushParagraph();

  const plainText = stripInlineMarkdown(
    normalizedLines
      .filter((l) => !/^\|[\s:|-]+\|$/.test(l.trim()))
      .map((l) => l.replace(/^#{1,6}\s+/, '').replace(/^(?:[-*+]|\d+\.)\s+/, ''))
      .join(' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

  return {
    normalizedLines,
    headings,
    paragraphs,
    listItemCount: Math.max(mdListCount, htmlListCount),
    hasTable: htmlHasTable || (mdTableHeaderRows >= 2 && mdTableDividerFound),
    plainText,
  };
}

export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^>\s?/, '')
    .trim();
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * Splits text into safe renderable segments for React brand-mention highlighting
 * without ever using dangerouslySetInnerHTML.
 */
export function splitTextByBrand(
  text: string,
  brandName: string
): Array<{ text: string; isMatch: boolean }> {
  const trimmedBrand = brandName.trim();
  if (!trimmedBrand) {
    return [{ text, isMatch: false }];
  }

  const escaped = trimmedBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === trimmedBrand.toLowerCase(),
    }));
}
