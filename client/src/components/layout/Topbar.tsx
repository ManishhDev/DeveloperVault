import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Menu, Moon, Plus, Search, Sun, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useHotkeys } from '../../hooks/useHotkeys';
import { currentParams } from '../../hooks/useUrlFilters';
import type { Theme } from '../../hooks/useTheme';
import { Button, ButtonLink } from '../ui/Button';
import { Kbd } from '../ui/Kbd';

interface TopbarProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight">
      <span
        className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm"
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="size-4">
          <path
            d="M16 4 28 16 16 28 4 16Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="3.5" fill="currentColor" />
        </svg>
      </span>
      DevVault
    </Link>
  );
}

function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const urlQuery = params.get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  const debounced = useDebounce(value, 300);

  // Latest URL state, read when the debounced value settles (not a trigger itself).
  const latest = useRef({ urlQuery, pathname });
  latest.current = { urlQuery, pathname };

  // URL -> input: back/forward, clicking a sidebar link, etc.
  useEffect(() => setValue(urlQuery), [urlQuery]);

  // input -> URL, after the user stops typing
  useEffect(() => commit(debounced), [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  function commit(raw: string) {
    const q = raw.trim();
    const { urlQuery, pathname } = latest.current;
    if (q === urlQuery.trim()) return;
    if (pathname !== '/' && pathname !== '/favorites') {
      if (q) navigate(`/?q=${encodeURIComponent(q)}`);
      return;
    }
    setParams(
      () => {
        const next = currentParams();
        if (q) next.set('q', q);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }

  useHotkeys({
    '/': () => inputRef.current?.focus(),
    'mod+k': () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  });

  return (
    <form
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        commit(value);
      }}
    >
      <label htmlFor="global-search" className="sr-only">
        Search entries
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            if (value) {
              setValue('');
              commit('');
            } else {
              inputRef.current?.blur();
            }
          }
        }}
        placeholder="Search commands, code, tags…"
        className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-100/70 pr-16 pl-9 text-sm transition-colors placeholder:text-zinc-500 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('');
              commit('');
              inputRef.current?.focus();
            }}
            className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <Kbd className="hidden sm:inline">{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
        )}
      </div>
    </form>
  );
}

export function Topbar({ theme, onToggleTheme, onOpenMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="flex h-14 items-center gap-2 px-4 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={onOpenMenu}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="hidden w-56 shrink-0 sm:block lg:w-[13.25rem]">
          <Logo />
        </div>
        <SearchBox />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="size-4.5" aria-hidden />
          ) : (
            <Moon className="size-4.5" aria-hidden />
          )}
        </Button>
        <ButtonLink
          to="/entries/new"
          variant="primary"
          title="New entry (N)"
          aria-label="New entry"
          className="max-sm:w-9 max-sm:px-0"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">New</span>
        </ButtonLink>
      </div>
    </header>
  );
}
