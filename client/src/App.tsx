import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { VaultPage } from './pages/VaultPage';
import { EntryPage } from './pages/EntryPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: false },
  },
});

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <VaultPage /> },
      { path: '/favorites', element: <VaultPage /> },
      // the form pages pull in react-hook-form + zod, so they load on demand
      {
        path: '/entries/new',
        lazy: () => import('./pages/NewEntryPage').then((m) => ({ Component: m.NewEntryPage })),
      },
      { path: '/entries/:id', element: <EntryPage /> },
      {
        path: '/entries/:id/edit',
        lazy: () => import('./pages/EditEntryPage').then((m) => ({ Component: m.EditEntryPage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
