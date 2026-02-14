import type { BundledLanguage } from 'shiki';

import { codeToTokens } from 'shiki';

/**
 * LRU cache entry for highlighted line tokens.
 */
interface CacheEntry {
  html: string;
  key: string;
}

/**
 * Simple LRU cache for syntax-highlighted line HTML.
 */
class LRUCache {
  private readonly capacity: number;
  private readonly map = new Map<string, CacheEntry>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: string): string | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.html;
  }

  set(key: string, html: string): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Delete the least recently used (first entry)
      const firstKey = this.map.keys().next().value as string;
      this.map.delete(firstKey);
    }
    this.map.set(key, { html, key });
  }
}

/**
 * Extension to Shiki language mapping.
 */
const EXTENSION_MAP: Record<string, BundledLanguage> = {
  cjs: 'javascript',
  cts: 'typescript',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  md: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  scss: 'scss',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'vue',
  yaml: 'yaml',
  yml: 'yaml',
};

/**
 * Detect language from file path extension.
 */
export function detectLanguage(filePath: string): BundledLanguage | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_MAP[ext] ?? (ext as BundledLanguage);
}

const highlightCache = new LRUCache(500);

/**
 * Token color for a given theme.
 */
interface TokenSpan {
  color: string | undefined;
  content: string;
}

/**
 * Highlight a single line of code, returning HTML with inline color spans.
 * Uses the LRU cache to avoid redundant highlighting.
 */
export async function highlightLine(
  content: string,
  language: BundledLanguage,
  theme: 'one-dark-pro' | 'one-light'
): Promise<string> {
  const cacheKey = `${theme}:${language}:${content}`;
  const cached = highlightCache.get(cacheKey);
  if (cached) return cached;

  try {
    const result = await codeToTokens(content, {
      lang: language,
      theme,
    });

    const firstLine = result.tokens[0];
    if (!firstLine) {
      highlightCache.set(cacheKey, content);
      return content;
    }

    const spans: Array<TokenSpan> = firstLine.map((token) => ({
      color: token.color,
      content: token.content,
    }));

    const html = spans
      .map((span) => {
        const escaped = escapeHtml(span.content);
        if (span.color) {
          return `<span style="color:${span.color}">${escaped}</span>`;
        }
        return escaped;
      })
      .join('');

    highlightCache.set(cacheKey, html);
    return html;
  } catch {
    // If highlighting fails, return plain content
    highlightCache.set(cacheKey, content);
    return content;
  }
}

/**
 * Highlight multiple lines of code in batch for performance.
 * Returns a Map from line content to highlighted HTML.
 */
export async function highlightLines(
  lines: Array<string>,
  language: BundledLanguage,
  theme: 'one-dark-pro' | 'one-light'
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const uncached: Array<string> = [];

  for (const line of lines) {
    const cacheKey = `${theme}:${language}:${line}`;
    const cached = highlightCache.get(cacheKey);
    if (cached) {
      results.set(line, cached);
    } else {
      uncached.push(line);
    }
  }

  // Highlight uncached lines in parallel
  await Promise.all(
    uncached.map(async (line) => {
      const html = await highlightLine(line, language, theme);
      results.set(line, html);
    })
  );

  return results;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
