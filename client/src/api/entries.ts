import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CategoryWithCount,
  Entry,
  EntryCreateInput,
  Paginated,
  Sort,
  Stats,
  TagWithCount,
} from '@devvault/shared';
import { api, ApiError } from './client';

export interface EntryFilters {
  q: string;
  category: string;
  tags: string[];
  favorite: boolean;
  sort: Sort;
  page: number;
}

export const queryKeys = {
  entries: ['entries'] as const,
  list: (filters: EntryFilters) => ['entries', 'list', filters] as const,
  entry: (id: string) => ['entries', 'detail', id] as const,
  categories: ['categories'] as const,
  tags: ['tags'] as const,
  stats: ['stats'] as const,
};

function toSearchParams(f: EntryFilters) {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.category) params.set('category', f.category);
  if (f.tags.length) params.set('tags', f.tags.join(','));
  if (f.favorite) params.set('favorite', 'true');
  if (f.sort !== 'updated') params.set('sort', f.sort);
  if (f.page > 1) params.set('page', String(f.page));
  return params.toString();
}

/* ---------- queries ---------- */

export const useEntries = (filters: EntryFilters) =>
  useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: () => api<Paginated<Entry>>(`/entries?${toSearchParams(filters)}`),
    placeholderData: keepPreviousData,
  });

export const useEntry = (id: string) =>
  useQuery({
    queryKey: queryKeys.entry(id),
    queryFn: () => api<Entry>(`/entries/${encodeURIComponent(id)}`),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api<CategoryWithCount[]>('/categories'),
    staleTime: 60_000,
  });

export const useTags = () =>
  useQuery({ queryKey: queryKeys.tags, queryFn: () => api<TagWithCount[]>('/tags') });

export const useStats = () => useQuery({ queryKey: queryKeys.stats, queryFn: () => api<Stats>('/stats') });

/* ---------- mutations ---------- */

/** Anything that adds, removes or edits an entry can change every list and count. */
function invalidateVault(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.entries }),
    qc.invalidateQueries({ queryKey: queryKeys.categories }),
    qc.invalidateQueries({ queryKey: queryKeys.tags }),
    qc.invalidateQueries({ queryKey: queryKeys.stats }),
  ]);
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EntryCreateInput) => api<Entry>('/entries', { method: 'POST', json: body }),
    onSuccess: (entry) => {
      qc.setQueryData(queryKeys.entry(entry.id), entry);
      return invalidateVault(qc);
    },
  });
}

export function useUpdateEntry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EntryCreateInput>) =>
      api<Entry>(`/entries/${encodeURIComponent(id)}`, { method: 'PATCH', json: body }),
    onSuccess: (entry) => {
      qc.setQueryData(queryKeys.entry(entry.id), entry);
      return invalidateVault(qc);
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.entry(id) });
      return invalidateVault(qc);
    },
  });
}

/** Flips the star immediately and rolls back if the server says no. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      api<Entry>(`/entries/${encodeURIComponent(id)}/favorite`, { method: 'PATCH', json: { isFavorite } }),

    onMutate: async ({ id, isFavorite }) => {
      await qc.cancelQueries({ queryKey: queryKeys.entries });
      await qc.cancelQueries({ queryKey: queryKeys.stats });
      const entries = qc.getQueriesData({ queryKey: queryKeys.entries });
      const stats = qc.getQueryData<Stats>(queryKeys.stats);

      const flip = (e: Entry) => (e.id === id ? { ...e, isFavorite } : e);
      qc.setQueriesData<Paginated<Entry> | Entry>({ queryKey: queryKeys.entries }, (old) => {
        if (!old) return old;
        return 'data' in old ? { ...old, data: old.data.map(flip) } : flip(old);
      });
      if (stats) {
        qc.setQueryData<Stats>(queryKeys.stats, {
          ...stats,
          favorites: Math.max(0, stats.favorites + (isFavorite ? 1 : -1)),
        });
      }
      return { entries, stats };
    },

    onError: (error, _vars, ctx) => {
      ctx?.entries.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.stats) qc.setQueryData(queryKeys.stats, ctx.stats);
      toast.error(`Couldn't update favorite: ${error.message}`);
    },

    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.entries }),
        qc.invalidateQueries({ queryKey: queryKeys.stats }),
      ]),
  });
}
