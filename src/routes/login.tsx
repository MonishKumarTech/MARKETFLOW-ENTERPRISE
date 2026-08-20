import React, { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useAppShell, ENTERPRISE_PERSONAS } from '@/lib/app-shell-context';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Check
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginView,
});

function LoginView() {
  const { login, loginAsPersona, isAuthenticated, isDemoModeEnabled } = useAppShell();
  const navigate = useNavigate();

  // Initialized empty for standard clean login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' as any });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate({ to: '/' as any });
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickPersonaLogin = (persona: typeof ENTERPRISE_PERSONAS[0]) => {
    loginAsPersona(persona);
    navigate({ to: '/' as any });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand & System Overview */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Enterprise Marketing & Operations ERP</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
              Market<span className="text-indigo-500">Flow</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md">
              Synchronized media buying, budget PO gating, content approval state machines, and real-time UTM multi-touch attribution.
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Dual Persistence (Supabase PostgreSQL + Instant Local Failover)</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Dynamic RBAC Privilege Matrix with 6 Pre-Seeded Institutional Roles</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="h-6 w-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Automated Mathematical Telemetry (ROAS, CAC, CPL, Budget Pacing)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Staff Authentication</h2>
            <p className="text-xs text-slate-400">Sign in to access your role-governed operational workstation.</p>
          </div>

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Empty Standard Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Work Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@marketflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Admin Toggleable Fast-Login Tiles */}
          {isDemoModeEnabled ? (
            <div className="space-y-2.5 pt-4 border-t border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  1-Click Interview Persona Demo
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold">Demo Mode ON</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENTERPRISE_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handleQuickPersonaLogin(persona)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition group space-y-1 cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-white group-hover:text-indigo-400 truncate">
                      {persona.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize truncate">
                      {persona.role.replace('_', ' ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500">
                🔒 Production Security Active. Fast-login tiles disabled by Administrator.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}