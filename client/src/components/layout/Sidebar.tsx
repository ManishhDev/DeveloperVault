import type { ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { Inbox, Star } from 'lucide-react';
import { useCategories, useStats, useTags } from '../../api/entries';
import { Skeleton } from '../ui/States';
import { cn } from '../../lib/utils';

function NavItem({
  to,
  active,
  icon,
  label,
  count,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70',
      )}
    >
      <span className="flex w-5 justify-center" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-xs tabular-nums',
            active ? 'text-indigo-600 dark:text-indigo-300' : 'text-zinc-400 dark:text-zinc-500',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
      {children}
    </h2>
  );
}

export function Sidebar() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { data: stats } = useStats();
  const { data: categories, isPending: categoriesLoading } = useCategories();
  const { data: tags = [] } = useTags();

  const onList = pathname === '/';
  const activeCategory = onList ? params.get('category') : null;
  const activeTags = onList ? (params.get('tags') ?? '').split(',').filter(Boolean) : [];

  const tagHref = (tag: string) => {
    const next = new URLSearchParams(onList ? params : undefined);
    const set = new Set(activeTags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    if (set.size) next.set('tags', [...set].join(','));
    else next.delete('tags');
    next.delete('page');
    const qs = next.toString();
    return qs ? `/?${qs}` : '/';
  };

  return (
    <nav aria-label="Vault" className="flex flex-col gap-6 p-3">
      <div className="space-y-0.5">
        <NavItem
          to="/"
          active={onList && !activeCategory && !activeTags.length && !params.get('q')}
          icon={<Inbox className="size-4" />}
          label="All entries"
          count={stats?.total}
        />
        <NavItem
          to="/favorites"
          active={pathname === '/favorites'}
          icon={<Star className="size-4" />}
          label="Favorites"
          count={stats?.favorites}
        />
      </div>

      <div>
        <SectionTitle>Categories</SectionTitle>
        <div className="space-y-0.5">
          {categoriesLoading
            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="mx-2.5 my-2 h-4" />)
            : categories?.map((c) => (
                <NavItem
                  key={c.id}
                  to={`/?category=${c.slug}`}
                  active={activeCategory === c.slug}
                  icon={<span className="text-[15px] leading-none">{c.icon}</span>}
                  label={c.name}
                  count={c.count}
                />
              ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div>
          <SectionTitle>Top tags</SectionTitle>
          <div className="flex flex-wrap gap-1.5 px-2.5">
            {tags.slice(0, 15).map((t) => {
              const active = activeTags.includes(t.name);
              return (
                <Link
                  key={t.name}
                  to={tagHref(t.name)}
                  aria-pressed={active}
                  title={`${t.count} ${t.count === 1 ? 'entry' : 'entries'}`}
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors',
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100',
                  )}
                >
                  #{t.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
