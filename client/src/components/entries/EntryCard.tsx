import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import type { Entry } from '@devvault/shared';
import { CodeBlock } from './CodeBlock';
import { DeleteButton, EditButton, FavoriteButton } from './EntryActions';
import { TagChip } from './TagChip';
import { Highlight } from '../ui/Highlight';
import { formatDate, hostname, timeAgo } from '../../lib/utils';

interface EntryCardProps {
  entry: Entry;
  query?: string;
  activeTags?: string[];
  onTagClick?: (tag: string) => void;
}

export function EntryCard({ entry, query, activeTags = [], onTagClick }: EntryCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-snug font-semibold">
            <Link
              to={`/entries/${entry.id}`}
              className="rounded hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Highlight text={entry.title} query={query} />
            </Link>
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Link
              to={`/?category=${entry.category.slug}`}
              className="inline-flex items-center gap-1 font-medium text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
            >
              <span aria-hidden>{entry.category.icon}</span>
              {entry.category.name}
            </Link>
            {entry.tags.length > 0 && <span aria-hidden>·</span>}
            {entry.tags.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                query={query}
                active={activeTags.includes(tag)}
                onClick={onTagClick}
              />
            ))}
            <span className="whitespace-nowrap">
              <span aria-hidden className="mr-2">
                ·
              </span>
              <time dateTime={entry.updatedAt} title={`Updated ${formatDate(entry.updatedAt)}`}>
                {timeAgo(entry.updatedAt)}
              </time>
            </span>
          </div>
        </div>
        <FavoriteButton entry={entry} className="-mt-1 -mr-1" />
      </header>

      {entry.description && (
        <p className="mt-2.5 text-sm text-zinc-600 dark:text-zinc-400">
          <Highlight text={entry.description} query={query} />
        </p>
      )}

      <div className="mt-3">
        <CodeBlock code={entry.content} language={entry.language} query={query} collapseAfter={12} />
      </div>

      <footer className="mt-3 flex items-center gap-2">
        {entry.sourceUrl ? (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{hostname(entry.sourceUrl)}</span>
          </a>
        ) : (
          <span />
        )}
        <div className="ml-auto flex items-center">
          <EditButton id={entry.id} />
          <DeleteButton entry={entry} />
        </div>
      </footer>
    </article>
  );
}
