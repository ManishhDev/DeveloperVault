import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, FolderOpen, Plus, SearchX, Star, X } from 'lucide-react';
import type { Sort } from '@devvault/shared';
import { useCategories, useEntries, useStats, useTags } from '../api/entries';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { EntryCard } from '../components/entries/EntryCard';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { cn, pluralize } from '../lib/utils';

const SORT_LABELS: Record<Sort, string> = {
  updated: 'Recently updated',
  created: 'Recently created',
  title: 'Title (A–Z)',
};

const selectClass =
  'h-8 rounded-md border border-zinc-200 bg-white pr-7 pl-2 text-sm text-zinc-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200';

export function VaultPage() {
  const { filters, update, toggleTag, clear, hasFilters } = useUrlFilters();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useEntries(filters);
  const { data: categories } = useCategories();
  const { data: stats } = useStats();
  const { data: allTags = [] } = useTags();

  const category = categories?.find((c) => c.slug === filters.category);
  const meta = data?.meta;

  // e.g. the last entry on the last page was deleted
  useEffect(() => {
    if (meta && filters.page > meta.totalPages) update({ page: meta.totalPages }, { replace: true });
  }, [meta, filters.page, update]);

  const heading = filters.favorite
    ? 'Favorites'
    : category
      ? category.name
      : !filters.category
        ? 'All entries'
        : categories
          ? 'Unknown category'
          : null; // still loading

  useEffect(() => {
    document.title = `${filters.q ? `“${filters.q}” · ` : ''}${heading ?? 'Vault'} · DevVault`;
  }, [heading, filters.q]);

  const availableTags = allTags.filter((t) => !filters.tags.includes(t.name));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            {filters.favorite && <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />}
            {category && <span aria-hidden>{category.icon}</span>}
            {heading ?? <Skeleton className="h-6 w-36" />}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {meta ? (
              <>
                {pluralize(meta.total, 'entry', 'entries')}
                {filters.q && (
                  <>
                    {' '}
                    matching{' '}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">“{filters.q}”</span>
                  </>
                )}
              </>
            ) : (
              ' '
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          Sort
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as Sort })}
            className={selectClass}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* tag filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Tags:</span>
        {filters.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            aria-label={`Remove tag filter ${tag}`}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 py-0.5 pr-1.5 pl-2 text-xs font-medium text-white hover:bg-indigo-500"
          >
            #{tag}
            <X className="size-3" aria-hidden />
          </button>
        ))}
        {availableTags.length > 0 && (
          <select
            aria-label="Add a tag filter"
            value=""
            onChange={(e) => e.target.value && toggleTag(e.target.value)}
            className={cn(selectClass, 'h-7 text-xs')}
          >
            <option value="">+ filter</option>
            {availableTags.map((t) => (
              <option key={t.name} value={t.name}>
                #{t.name} ({t.count})
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear} className="ml-auto h-7 text-xs">
            Clear filters
          </Button>
        )}
      </div>

      <section className="mt-5" aria-label="Entries" aria-busy={isPending || isPlaceholderData}>
        {isPending ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data.data.length === 0 ? (
          <Empty
            vaultEmpty={stats?.total === 0}
            favorites={filters.favorite}
            filtered={hasFilters}
            onClear={clear}
            categorySlug={filters.category}
          />
        ) : (
          <div className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
            {data.data.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                query={filters.q}
                activeTags={filters.tags}
                onTagClick={toggleTag}
              />
            ))}
          </div>
        )}
      </section>

      {meta && meta.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
          <Button size="sm" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })}>
            <ChevronLeft className="size-4" aria-hidden /> Previous
          </Button>
          <span className="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
            Page {filters.page} of {meta.totalPages}
          </span>
          <Button
            size="sm"
            disabled={filters.page >= meta.totalPages}
            onClick={() => update({ page: filters.page + 1 })}
          >
            Next <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}

function Empty({
  vaultEmpty,
  favorites,
  filtered,
  onClear,
  categorySlug,
}: {
  vaultEmpty: boolean;
  favorites: boolean;
  filtered: boolean;
  onClear: () => void;
  categorySlug: string;
}) {
  if (vaultEmpty) {
    return (
      <EmptyState
        icon={<FolderOpen className="size-6" />}
        title="Your vault is empty"
        action={
          <ButtonLink to="/entries/new" variant="primary">
            <Plus className="size-4" aria-hidden /> Add your first entry
          </ButtonLink>
        }
      >
        Save a command, snippet or fix you just figured out, so future you can find it in seconds.
      </EmptyState>
    );
  }
  if (favorites && !filtered) {
    return (
      <EmptyState icon={<Star className="size-6" />} title="No favorites yet">
        Star the entries you reach for most and they’ll show up here.
      </EmptyState>
    );
  }
  if (categorySlug && !filtered) {
    return (
      <EmptyState
        icon={<FolderOpen className="size-6" />}
        title="Nothing in this category yet"
        action={
          <ButtonLink to={`/entries/new?category=${categorySlug}`} variant="primary">
            <Plus className="size-4" aria-hidden /> New entry here
          </ButtonLink>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={<SearchX className="size-6" />}
      title="No matching entries"
      action={<Button onClick={onClear}>Clear filters</Button>}
    >
      Try a different search term or remove some filters.
    </EmptyState>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="mt-2.5 h-3 w-1/3" />
          <Skeleton className="mt-4 h-3 w-3/4" />
          <Skeleton className="mt-4 h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
