import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useCategories, useCreateEntry } from '../api/entries';
import { EntryForm } from '../components/entries/EntryForm';
import { ErrorState, Skeleton } from '../components/ui/States';
import { BackLink } from './EntryPage';

export function NewEntryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: categories, isPending, isError, error, refetch } = useCategories();
  const create = useCreateEntry();

  useEffect(() => {
    document.title = 'New entry · DevVault';
  }, []);

  // coming from a category view pre-selects that category
  const preselected = categories?.find((c) => c.slug === params.get('category'))?.id ?? '';

  return (
    <div>
      <BackLink />
      <h1 className="mt-5 mb-6 text-xl font-semibold tracking-tight">New entry</h1>
      {isPending ? (
        <FormSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <EntryForm
          categories={categories}
          defaultValues={{ title: '', content: '', categoryId: preselected }}
          submitLabel="Save entry"
          cancelTo="/"
          onSubmit={(values) => create.mutateAsync(values)}
          onSaved={(entry) => navigate(`/entries/${entry.id}`, { replace: true })}
        />
      )}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      {[10, 10, 10, 48].map((h, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={i === 3 ? 'h-48 w-full' : 'h-10 w-full'} />
        </div>
      ))}
    </div>
  );
}
