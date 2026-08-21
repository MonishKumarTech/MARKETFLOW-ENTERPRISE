import React, { useState, useEffect } from 'react';
import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShellProvider, useAppShell } from '@/lib/app-shell-context';
import { AppSidebar } from '@/components/app-sidebar';
import { TopHeader } from '@/components/top-header';
import { X } from 'lucide-react';
import '@/styles.css';

function MainLayoutShell() {
  const { isAuthenticated } = useAppShell();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    // Only redirect if unauthenticated AND trying to view an internal page
    if (!isAuthenticated && !isLoginPage) {
      navigate({ to: '/login' as any });
    }
  }, [isAuthenticated, isLoginPage, navigate]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

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
      {/* 1. Desktop Persistent Sidebar (hidden on mobile) */}
      <div className="hidden md:flex shrink-0 h-full">
        <AppSidebar />
      </div>

      {/* 2. Mobile Slide-out Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* 3. Mobile Slide-out Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Navigation Menu</span>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" onClick={() => setIsMobileDrawerOpen(false)}>
          <AppSidebar />
        </div>
      </div>

      {/* 4. Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950">
        <TopHeader onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-slate-900/30 p-3 sm:p-6 lg:p-8">
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