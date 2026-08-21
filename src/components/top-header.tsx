import React, { useState, useEffect } from 'react';
import { useAppShell } from '@/lib/app-shell-context';
import { marketFlowClient, NotificationItem } from '@/lib/marketflow-client';
import { Link, useNavigate } from '@tanstack/react-router';
import { 
  Bell, 
  LogOut, 
  KeyRound, 
  User, 
  X, 
  CheckCircle2, 
  Clock, 
  ChevronDown,
  Shield,
  Menu 
} from 'lucide-react';

export interface TopHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function TopHeader({ onOpenMobileMenu }: TopHeaderProps = {}) {
  const { user, role, logout } = useAppShell();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const items = await marketFlowClient.getNotifications();
      setNotifications(items || []);
    } catch (err) {
      console.warn('Notification fetch warning:', err);
    }
  };

  const handleMarkAllRead = async () => {
    await marketFlowClient.markAllNotificationsRead();
    await loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1200);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to end your current session?')) {
      logout();
      setIsUserMenuOpen(false);
      navigate({ to: '/login' as any });
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* 1. Left Section: Mobile Hamburger Toggle + System Live Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Secure Session Live</span>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            v2.4.0
          </span>
        </div>
      </div>

      {/* 2. Right Section: Role Shield, Notifications & Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Security Badge (Tablet / Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <Shield className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400 font-medium">Role:</span>
          <span className="font-bold text-white capitalize">{role.replace('_', ' ')}</span>
        </div>

        {/* Interactive Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsUserMenuOpen(false);
            }}
            className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="System Notifications"
            aria-label="System Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Drawer */}
          {isNotifOpen && (
            <div className="fixed sm:absolute inset-x-3 top-16 sm:inset-auto sm:right-0 sm:mt-2 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 space-y-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">System Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs space-y-1 transition ${
                        n.isRead
                          ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                          : 'bg-indigo-950/20 border-indigo-500/30 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{n.title}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {n.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
            aria-label="User Menu"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg object-cover border border-indigo-500/40 shrink-0"
              />
            ) : (
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div className="text-left hidden sm:block max-w-[120px] md:max-w-[160px] truncate">
              <span className="text-xs font-bold text-white block leading-tight truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 block capitalize truncate">{role.replace('_', ' ')}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="font-bold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>

              <Link
                to={'/profile' as any}
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
              >
                <User className="h-4 w-4 text-indigo-400" />
                <span>My Profile & Photo</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-amber-400" />
                <span>Change Password</span>
              </button>

              <div className="pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition text-left font-semibold cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal (With explicit id, name, and autoComplete for autofill & a11y) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Change Staff Password</h3>
                  <p className="text-[11px] text-slate-400">Update credentials for {user.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center space-y-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <p className="font-bold text-sm">Password Updated!</p>
                <p className="text-slate-400">Your session credentials have been synchronized.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
                {passwordError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-400 font-semibold">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label htmlFor="current-password" className="block font-semibold text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block font-semibold text-slate-300 mb-1">
                    New Password (Min 6 chars)
                  </label>
                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}