import { Link } from 'react-router';
import { Highlight } from '../ui/Highlight';
import { cn } from '../../lib/utils';

const chipClass = (active?: boolean) =>
  cn(
    'rounded px-1 font-medium transition-colors',
    active
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
      : 'text-indigo-600/90 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400/90 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300',
  );

/** A #tag that filters the list when clicked (or links to the filtered list from other pages). */
export function TagChip({
  tag,
  query,
  active,
  onClick,
}: {
  tag: string;
  query?: string;
  active?: boolean;
  onClick?: (tag: string) => void;
}) {
  const label = (
    <>
      #<Highlight text={tag} query={query} />
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(tag)}
        aria-pressed={active}
        title={active ? `Remove #${tag} filter` : `Filter by #${tag}`}
        className={chipClass(active)}
      >
        {label}
      </button>
    );
  }
  return (
    <Link to={`/?tags=${encodeURIComponent(tag)}`} className={chipClass(active)}>
      {label}
    </Link>
  );
}
