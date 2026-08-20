import React from 'react';
import ReactDOM from 'react-dom/client';
import { 
  RouterProvider, 
  createRouter, 
  NotFoundRoute,
  Navigate
} from '@tanstack/react-router';

// Root Route & Shell
import { Route as rootRoute } from './routes/__root';

// Page Routes
import { Route as indexRoute } from './routes/index';
import { Route as loginRoute } from './routes/login';
import { Route as campaignsRoute } from './routes/campaigns';
import { Route as calendarRoute } from './routes/calendar';
import { Route as tasksRoute } from './routes/tasks';
import { Route as leadsRoute } from './routes/leads';
import { Route as approvalsRoute } from './routes/approvals';
import { Route as masterAdminRoute } from './routes/master-admin';
import { Route as profileRoute } from './routes/profile';

// Global 404 handler
const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: () => <Navigate to="/login" replace />,
});

// Construct Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  campaignsRoute,
  calendarRoute,
  tasksRoute,
  leadsRoute,
  approvalsRoute,
  masterAdminRoute,
  profileRoute,
]);

export const router = createRouter({
  routeTree,
  notFoundRoute,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);