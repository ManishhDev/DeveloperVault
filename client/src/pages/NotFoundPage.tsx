import { useEffect } from 'react';
import { FileQuestion } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/States';

export function NotFoundPage({ what = 'page' }: { what?: string }) {
  useEffect(() => {
    document.title = 'Not found · DevVault';
  }, []);

  return (
    <EmptyState
      icon={<FileQuestion className="size-6" />}
      title={`This ${what} doesn’t exist`}
      action={
        <ButtonLink to="/" variant="primary">
          Go to your vault
        </ButtonLink>
      }
    >
      It may have been deleted, or the link is wrong.
    </EmptyState>
  );
}
