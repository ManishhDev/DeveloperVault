import { useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Entry } from '@devvault/shared';
import { useDeleteEntry, useToggleFavorite } from '../../api/entries';
import { Button, ButtonLink } from '../ui/Button';
import { ConfirmDialog } from '../ui/Modal';
import { cn } from '../../lib/utils';

export function FavoriteButton({
  entry,
  className,
}: {
  entry: Pick<Entry, 'id' | 'title' | 'isFavorite'>;
  className?: string;
}) {
  const toggle = useToggleFavorite();
  const on = entry.isFavorite;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={on ? `Remove "${entry.title}" from favorites` : `Add "${entry.title}" to favorites`}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => toggle.mutate({ id: entry.id, isFavorite: !on })}
      className={className}
    >
      <Star
        className={cn('size-4.5 transition-transform active:scale-90', on && 'fill-amber-400 text-amber-400')}
        aria-hidden
      />
    </Button>
  );
}

export function EditButton({ id, label = false }: { id: string; label?: boolean }) {
  return (
    <ButtonLink
      to={`/entries/${id}/edit`}
      variant={label ? 'secondary' : 'ghost'}
      size={label ? 'md' : 'icon'}
      aria-label="Edit entry"
      title="Edit"
    >
      <Pencil className="size-4" aria-hidden />
      {label && 'Edit'}
    </ButtonLink>
  );
}

export function DeleteButton({
  entry,
  label = false,
  onDeleted,
}: {
  entry: Pick<Entry, 'id' | 'title'>;
  label?: boolean;
  onDeleted?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteEntry();

  const onConfirm = () =>
    del.mutate(entry.id, {
      onSuccess: () => {
        setConfirming(false);
        toast.success('Entry deleted');
        onDeleted?.();
      },
      onError: (error) => toast.error(`Couldn't delete: ${error.message}`),
    });

  return (
    <>
      <Button
        variant={label ? 'secondary' : 'ghost'}
        size={label ? 'md' : 'icon'}
        aria-label="Delete entry"
        title="Delete"
        onClick={() => setConfirming(true)}
        className="hover:text-red-600 dark:hover:text-red-400"
      >
        <Trash2 className="size-4" aria-hidden />
        {label && 'Delete'}
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Delete this entry?"
        confirmLabel="Delete"
        danger
        busy={del.isPending}
        onConfirm={onConfirm}
        onCancel={() => setConfirming(false)}
      >
        <strong className="font-medium text-zinc-900 dark:text-zinc-100">“{entry.title}”</strong> will be
        removed from your vault. This can’t be undone.
      </ConfirmDialog>
    </>
  );
}
