import React, { useState } from 'react';
import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShellProvider, useAppShell } from '@/lib/app-shell-context';
import { AppSidebar } from '@/components/app-sidebar';
import { TopHeader } from '@/components/top-header';
import '@/styles.css';

function MainLayoutShell() {
  const { isAuthenticated } = useAppShell();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === '/login';

  React.useEffect(() => {
    // Only redirect if unauthenticated AND trying to view an internal page
    if (!isAuthenticated && !isLoginPage) {
      navigate({ to: '/login' as any });
    }
  }, [isAuthenticated, isLoginPage, navigate]);

  // Clean full-screen view for the login page
  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Dynamic Role-Governed Sidebar */}
      <AppSidebar />

      {/* Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950">
        <TopHeader />

        <main className="flex-1 overflow-y-auto bg-slate-900/30 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: function RootLayout() {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 1000 * 60 * 5,
              refetchOnWindowFocus: false,
              retry: 1,
            },
          },
        })
    );

    return (
      <QueryClientProvider client={queryClient}>
        <AppShellProvider>
          <MainLayoutShell />
        </AppShellProvider>
      </QueryClientProvider>
    );
  },
});