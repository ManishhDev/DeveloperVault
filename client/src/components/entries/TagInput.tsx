import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { LIMITS, normalizeTag } from '@devvault/shared';
import { cn } from '../../lib/utils';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  suggestions?: string[];
  invalid?: boolean;
  describedBy?: string;
}

/** Enter or comma adds a tag, Backspace on an empty field removes the last one. */
export function TagInput({
  id,
  value,
  onChange,
  onBlur,
  suggestions = [],
  invalid,
  describedBy,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const full = value.length >= LIMITS.tags;

  const matches = useMemo(() => {
    const needle = normalizeTag(draft);
    if (!needle) return [];
    return suggestions.filter((s) => s.includes(needle) && !value.includes(s)).slice(0, 6);
  }, [draft, suggestions, value]);

  const showList = open && matches.length > 0;

  const add = (raw: string) => {
    const tag = normalizeTag(raw).slice(0, LIMITS.tag);
    if (tag && !value.includes(tag) && !full) onChange([...value, tag]);
    setDraft('');
    setActive(0);
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showList && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + delta + matches.length) % matches.length);
    } else if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && draft.trim())) {
      if (!draft.trim()) return;
      e.preventDefault();
      add(showList ? (matches[active] ?? draft) : draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      remove(value[value.length - 1]!);
    } else if (e.key === 'Escape' && showList) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-sm transition-colors',
          'focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:bg-zinc-900',
          invalid ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 py-0.5 pr-1 pl-2 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          >
            #{tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove tag ${tag}`}
              className="rounded p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/25"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={full}
          onChange={(e) => {
            const next = e.target.value;
            // pasting "a, b, c" adds all of them
            if (next.includes(',')) {
              const parts = next.split(',');
              const last = parts.pop() ?? '';
              const added = parts.map(normalizeTag).filter((t) => t && !value.includes(t));
              onChange([...new Set([...value, ...added])].slice(0, LIMITS.tags));
              setDraft(last);
            } else {
              setDraft(next);
            }
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (draft.trim()) add(draft);
            setOpen(false);
            onBlur?.();
          }}
          placeholder={full ? `Max ${LIMITS.tags} tags` : value.length ? 'Add another…' : 'e.g. docker, ssh'}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed dark:placeholder:text-zinc-500"
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {matches.map((tag, i) => (
            <li
              key={tag}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus in the input
                add(tag);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'cursor-pointer px-3 py-1.5',
                i === active && 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
              )}
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
