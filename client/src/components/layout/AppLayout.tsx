import { useEffect, useRef, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { Toaster } from 'sonner';
import { useHotkeys } from '../../hooks/useHotkeys';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Logo, Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDialogElement>(null);

  useHotkeys({ n: () => navigate('/entries/new') });

  // close the mobile drawer whenever the route changes
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (menuOpen && !drawer.open) drawer.showModal();
    if (!menuOpen && drawer.open) drawer.close();
  }, [menuOpen]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Topbar theme={theme} onToggleTheme={toggle} onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-zinc-200 lg:block dark:border-zinc-800">
          <Sidebar />
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* mobile drawer */}
      <dialog
        ref={drawerRef}
        aria-label="Navigation"
        onCancel={(e) => {
          e.preventDefault();
          setMenuOpen(false);
        }}
        onClick={(e) => e.target === drawerRef.current && setMenuOpen(false)}
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-r border-zinc-200 bg-white p-0 text-zinc-900 backdrop:bg-zinc-950/50 lg:hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {menuOpen && (
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        )}
      </dialog>

      <Toaster theme={theme} position="bottom-right" richColors closeButton duration={2500} />
      <ScrollRestoration />
    </div>
  );
}
