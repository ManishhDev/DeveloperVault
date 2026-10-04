import { useCallback, useMemo } from 'react';
import { useMatch, useSearchParams } from 'react-router';
import { normalizeTag, SORTS, type Sort } from '@devvault/shared';
import type { EntryFilters } from '../api/entries';

/**
 * The live URL, not the params from the last render: navigations run in a transition,
 * so a click right after one could otherwise build on stale params.
 */
export const currentParams = () => new URLSearchParams(window.location.search);

type FilterPatch = Partial<Omit<EntryFilters, 'favorite'>>;

/** Search, filters, sort and page all live in the URL, so back/refresh/bookmarks just work. */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const favorite = useMatch('/favorites') !== null;

  const filters = useMemo<EntryFilters>(() => {
    const sort = params.get('sort') as Sort | null;
    const page = Number.parseInt(params.get('page') ?? '1', 10);
    return {
      q: params.get('q')?.trim() ?? '',
      category: params.get('category') ?? '',
      tags: [...new Set((params.get('tags') ?? '').split(',').map(normalizeTag).filter(Boolean))],
      favorite,
      sort: sort && SORTS.includes(sort) ? sort : 'updated',
      page: Number.isFinite(page) && page > 0 ? page : 1,
    };
  }, [params, favorite]);

  /** Changing anything but the page sends you back to page 1. */
  const update = useCallback(
    (patch: FilterPatch, { replace = false } = {}) => {
      setParams(
        () => {
          const next = currentParams();
          for (const [key, value] of Object.entries(patch)) {
            const str = Array.isArray(value) ? value.join(',') : String(value ?? '');
            const isDefault =
              !str || (key === 'sort' && str === 'updated') || (key === 'page' && str === '1');
            if (isDefault) next.delete(key);
            else next.set(key, str);
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const current = (currentParams().get('tags') ?? '').split(',').filter(Boolean);
      const tags = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      update({ tags });
    },
    [update],
  );

  const clear = useCallback(() => setParams({}), [setParams]);

  const hasFilters = Boolean(filters.q || filters.category || filters.tags.length);

  return { filters, update, toggleTag, clear, hasFilters };
}
