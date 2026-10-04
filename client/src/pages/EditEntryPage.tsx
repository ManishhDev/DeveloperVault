import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import { useCategories, useEntry, useUpdateEntry } from '../api/entries';
import type { Entry, EntryCreateInput } from '@devvault/shared';
import { EntryForm } from '../components/entries/EntryForm';
import { ErrorState } from '../components/ui/States';
import { BackLink } from './EntryPage';
import { FormSkeleton } from './NewEntryPage';
import { NotFoundPage } from './NotFoundPage';

function toFormValues(entry: Entry): EntryCreateInput {
  return {
    title: entry.title,
    description: entry.description ?? '',
    content: entry.content,
    language: entry.language,
    categoryId: entry.category.id,
    tags: entry.tags,
    sourceUrl: entry.sourceUrl ?? '',
    isFavorite: entry.isFavorite,
  };
}

export function EditEntryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const entry = useEntry(id);
  const categories = useCategories();
  const update = useUpdateEntry(id);

  useEffect(() => {
    document.title = 'Edit entry · DevVault';
  }, []);

  if (entry.error instanceof ApiError && entry.error.status === 404) return <NotFoundPage what="entry" />;
  const error = entry.error ?? categories.error;

  return (
    <div>
      <BackLink to={`/entries/${id}`}>Back to entry</BackLink>
      <h1 className="mt-5 mb-6 text-xl font-semibold tracking-tight">Edit entry</h1>
      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void entry.refetch();
            void categories.refetch();
          }}
        />
      ) : !entry.data || !categories.data ? (
        <FormSkeleton />
      ) : (
        <EntryForm
          key={entry.data.id}
          categories={categories.data}
          defaultValues={toFormValues(entry.data)}
          submitLabel="Save changes"
          cancelTo={`/entries/${id}`}
          onSubmit={(values) => update.mutateAsync(values)}
          onSaved={(saved) => navigate(`/entries/${saved.id}`, { replace: true })}
        />
      )}
    </div>
  );
}
