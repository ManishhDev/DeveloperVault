import { useEffect, useId, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { Language } from '@devvault/shared';
import { LANGUAGE_LABELS } from '../../lib/languages';
import { cn, copyToClipboard } from '../../lib/utils';

// Shiki is big; keep it out of the main bundle until the first code block renders.
const loadHighlighter = () => import('../../lib/highlighter');

interface CodeBlockProps {
  code: string;
  language: Language;
  query?: string;
  /** Collapse blocks longer than this many lines behind a "show more" button. */
  collapseAfter?: number;
}

export function CodeBlock({ code, language, query = '', collapseAfter }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const regionId = useId();

  useEffect(() => {
    let cancelled = false;
    loadHighlighter()
      .then(({ highlight }) => highlight(code, language, query))
      .then((result) => !cancelled && setHtml(result))
      .catch(() => !cancelled && setHtml(null));
    return () => {
      cancelled = true;
    };
  }, [code, language, query]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const lineCount = code.split('\n').length;
  const collapsible = collapseAfter !== undefined && lineCount > collapseAfter;
  const collapsed = collapsible && !expanded;

  const onCopy = async () => {
    if (await copyToClipboard(code)) {
      setCopied(true);
      toast.success('Copied to clipboard');
    } else {
      toast.error('Copy failed');
    }
  };

  const codeClass = 'code-scroll overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed';

  return (
    <div className="group/code relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex items-center justify-between border-b border-zinc-200 py-1 pr-1 pl-3 dark:border-zinc-800">
        <span className="font-mono text-[11px] font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {LANGUAGE_LABELS[language]}
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          title="Copy code"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div id={regionId} className={cn('relative', collapsed && 'max-h-64 overflow-hidden')}>
        {html ? (
          <div className={cn(codeClass, '[&_pre]:outline-none')} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className={codeClass}>
            <code>{code}</code>
          </pre>
        )}
        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-50 dark:from-zinc-900" />
        )}
      </div>

      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 border-t border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3.5" aria-hidden /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" aria-hidden /> Show all {lineCount} lines
            </>
          )}
        </button>
      )}
    </div>
  );
}
