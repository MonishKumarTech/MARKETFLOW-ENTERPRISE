import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAppShell } from '@/lib/app-shell-context';
import { ModuleCode } from '@/lib/marketflow-client';
import { 
  LayoutDashboard, 
  Layers, 
  CalendarDays, 
  CheckSquare, 
  Users, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  UserCircle 
} from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ElementType;
  module: ModuleCode;
}

const NAV_ITEMS: NavigationItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' },
  { name: 'Campaigns & Budgets', path: '/campaigns', icon: Layers, module: 'campaigns' },
  { name: 'Content Calendar', path: '/calendar', icon: CalendarDays, module: 'content_calendar' },
  { name: 'Tasks & Pipeline', path: '/tasks', icon: CheckSquare, module: 'tasks' },
  { name: 'Leads & Revenue', path: '/leads', icon: Users, module: 'leads' },
  { name: 'Approvals Hub', path: '/approvals', icon: CheckCircle2, module: 'dashboard' },
  { name: 'Master Administration', path: '/master-admin', icon: ShieldCheck, module: 'master_admin' },
];

export function AppSidebar() {
  const { role, canView } = useAppShell();
  const location = useLocation();

  const permittedNav = NAV_ITEMS.filter((item) => canView(item.module));

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
            M
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              MarketFlow
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">Enterprise ERP</span>
          </div>
        </div>

        {/* Dynamic Nav List */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Operational Modules
          </div>
          {permittedNav.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path as any}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mt-4 mb-2">
            Identity & Account
          </div>
          <Link
            to={'/profile' as any}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
              location.pathname === '/profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
          >
            <UserCircle className={`h-4 w-4 shrink-0 ${location.pathname === '/profile' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>My Profile</span>
          </Link>
        </nav>
      </div>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-200 truncate capitalize">{role.replace('_', ' ')}</p>
            <p className="text-[10px] text-slate-500 truncate">ACL Matrix Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}