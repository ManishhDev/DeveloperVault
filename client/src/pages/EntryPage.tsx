import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useEntry } from '../api/entries';
import { ApiError } from '../api/client';
import { CodeBlock } from '../components/entries/CodeBlock';
import { DeleteButton, EditButton, FavoriteButton } from '../components/entries/EntryActions';
import { TagChip } from '../components/entries/TagChip';
import { ErrorState, Skeleton } from '../components/ui/States';
import { formatDate, timeAgo } from '../lib/utils';
import { NotFoundPage } from './NotFoundPage';

export function BackLink({ to = '/', children = 'Back to vault' }: { to?: string; children?: string }) {
  const navigate = useNavigate();
  return (
    <Link
      to={to}
      onClick={(e) => {
        // prefer real history so filters/scroll are restored
        if (window.history.state?.idx > 0) {
          e.preventDefault();
          navigate(-1);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowLeft className="size-4" aria-hidden /> {children}
    </Link>
  );
}

export function EntryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: entry, isPending, isError, error, refetch } = useEntry(id);

  useEffect(() => {
    if (entry) document.title = `${entry.title} · DevVault`;
  }, [entry]);

  if (isError && error instanceof ApiError && error.status === 404) return <NotFoundPage what="entry" />;

  return (
    <div>
      <BackLink />
      {isPending ? (
        <div className="mt-6 space-y-3" aria-busy>
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-6 h-48 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <div className="mt-6">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : (
        <article className="mt-5">
          <header className="flex items-start gap-3">
            <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight break-words">
              {entry.title}
            </h1>
            <FavoriteButton entry={entry} />
          </header>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              to={`/?category=${entry.category.slug}`}
              className="inline-flex items-center gap-1 font-medium text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
            >
              <span aria-hidden>{entry.category.icon}</span> {entry.category.name}
            </Link>
            {entry.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>

          {entry.description && (
            <p className="mt-4 text-[15px] text-zinc-700 dark:text-zinc-300">{entry.description}</p>
          )}

          <div className="mt-5">
            <CodeBlock code={entry.content} language={entry.language} />
          </div>

          {entry.sourceUrl && (
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex max-w-full items-center gap-1.5 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{entry.sourceUrl}</span>
            </a>
          )}

          <footer className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex gap-1">
                <dt>Created</dt>
                <dd>
                  <time dateTime={entry.createdAt} title={formatDate(entry.createdAt)}>
                    {timeAgo(entry.createdAt)}
                  </time>
                </dd>
              </div>
              <div className="flex gap-1">
                <dt>Updated</dt>
                <dd>
                  <time dateTime={entry.updatedAt} title={formatDate(entry.updatedAt)}>
                    {timeAgo(entry.updatedAt)}
                  </time>
                </dd>
              </div>
            </dl>
            <div className="ml-auto flex gap-2">
              <EditButton id={entry.id} label />
              <DeleteButton entry={entry} label onDeleted={() => navigate('/', { replace: true })} />
            </div>
          </footer>
        </article>
      )}
    </div>
  );
}
