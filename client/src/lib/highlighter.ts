import { createHighlighterCore, type DecorationItem, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import type { Language } from '@devvault/shared';

// Each grammar is its own chunk, fetched the first time a block in that language renders.
const GRAMMARS: Record<Exclude<Language, 'text'>, () => Promise<unknown>> = {
  bash: () => import('@shikijs/langs/bash'),
  powershell: () => import('@shikijs/langs/powershell'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  json: () => import('@shikijs/langs/json'),
  python: () => import('@shikijs/langs/python'),
  sql: () => import('@shikijs/langs/sql'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  java: () => import('@shikijs/langs/java'),
  c: () => import('@shikijs/langs/c'),
  cpp: () => import('@shikijs/langs/cpp'),
  csharp: () => import('@shikijs/langs/csharp'),
  php: () => import('@shikijs/langs/php'),
  ruby: () => import('@shikijs/langs/ruby'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  yaml: () => import('@shikijs/langs/yaml'),
  toml: () => import('@shikijs/langs/toml'),
  ini: () => import('@shikijs/langs/ini'),
  dockerfile: () => import('@shikijs/langs/dockerfile'),
  nginx: () => import('@shikijs/langs/nginx'),
  graphql: () => import('@shikijs/langs/graphql'),
  markdown: () => import('@shikijs/langs/markdown'),
  diff: () => import('@shikijs/langs/diff'),
};

let highlighter: Promise<HighlighterCore> | null = null;
const loading = new Map<string, Promise<void>>();

function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark')],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

async function ensureLanguage(hl: HighlighterCore, lang: Language) {
  if (lang === 'text' || hl.getLoadedLanguages().includes(lang)) return;
  if (!loading.has(lang)) {
    const load = GRAMMARS[lang]().then((mod) => hl.loadLanguage((mod as { default: never }).default));
    loading.set(lang, load);
  }
  await loading.get(lang);
}

function searchDecorations(code: string, query: string): DecorationItem[] {
  if (!query) return [];
  const haystack = code.toLowerCase();
  const needle = query.toLowerCase();
  const items: DecorationItem[] = [];
  for (
    let i = haystack.indexOf(needle);
    i !== -1 && items.length < 200;
    i = haystack.indexOf(needle, i + needle.length)
  ) {
    items.push({ start: i, end: i + needle.length, properties: { class: 'search-hit' } });
  }
  return items;
}

const cache = new Map<string, string>();

/** Returns highlighted HTML with both light and dark colors as CSS variables. */
export async function highlight(code: string, lang: Language, query = ''): Promise<string> {
  const key = `${lang}\u0000${query}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const hl = await getHighlighter();
  await ensureLanguage(hl, lang);
  const options = {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  } as const;

  let html: string;
  try {
    html = hl.codeToHtml(code, { ...options, decorations: searchDecorations(code, query) });
  } catch {
    // decorations can't cross line breaks; fall back to plain highlighting
    html = hl.codeToHtml(code, options);
  }

  if (cache.size > 300) cache.clear();
  cache.set(key, html);
  return html;
}
