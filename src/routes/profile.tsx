import React, { useState, useEffect, useRef } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { 
  marketFlowClient, 
  StaffMemberRecord, 
  UserRole 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { 
  User, 
  Upload, 
  Check, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfileView,
});

function ProfileView() {
  const { user, role, updateCurrentUserProfile, canManageWorkforce } = useAppShell();
  const [allStaff, setAllStaff] = useState<StaffMemberRecord[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(user.id);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: user.name,
    email: user.email,
    phoneNumber: user.phone || '+1-555-0101',
    address: user.address || '448 Montgomery St, San Francisco, CA',
    dob: '1990-01-01',
    roleKey: user.role as UserRole,
    avatarUrl: user.avatarUrl || '',
    department: user.department,
  });

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    const staff = await marketFlowClient.getStaff();
    setAllStaff(staff);
    const current = staff.find(s => s.id === selectedStaffId || s.email === user.email);
    if (current) {
      setFormData({
        fullName: current.full_name,
        email: current.email,
        phoneNumber: current.phone_number || '',
        address: current.address || '',
        dob: current.dob || '1990-01-01',
        roleKey: current.role_key,
        avatarUrl: current.avatar_url || '',
        department: current.role_key.replace('_', ' ').toUpperCase(),
      });
    }
  };

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    const target = allStaff.find(s => s.id === staffId);
    if (target) {
      setFormData({
        fullName: target.full_name,
        email: target.email,
        phoneNumber: target.phone_number || '',
        address: target.address || '',
        dob: target.dob || '1990-01-01',
        roleKey: target.role_key,
        avatarUrl: target.avatar_url || '',
        department: target.role_key.replace('_', ' ').toUpperCase(),
      });
    }
  };

  // 50KB - 100KB Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > 150) {
      setPhotoError(`Photo size is ${fileSizeKB.toFixed(1)}KB. Recommended target is 50KB - 100KB for high performance.`);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    await marketFlowClient.updateStaffProfile(selectedStaffId, {
      full_name: formData.fullName,
      phone_number: formData.phoneNumber,
      address: formData.address,
      dob: formData.dob,
      role_key: formData.roleKey,
      avatar_url: formData.avatarUrl,
    });

    if (selectedStaffId === user.id || formData.email === user.email) {
      updateCurrentUserProfile({
        name: formData.fullName,
        phone: formData.phoneNumber,
        address: formData.address,
        avatarUrl: formData.avatarUrl,
      });
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    await loadStaffMembers();
  };

  const isAdmin = canManageWorkforce || role === 'admin';
  const isEditingSelf = selectedStaffId === user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <User className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Staff Profile & Identity Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain your official contact information, address, and profile photo (50KB–100KB verified).
          </p>
        </div>

        {/* Admin Staff Selector */}
        {isAdmin && allStaff.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold ml-2">Edit Staff Member:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => handleSelectStaff(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {allStaff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role_key})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Profile Photo & Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col items-center text-center">
          <div className="relative group">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt={formData.fullName}
                className="h-32 w-32 rounded-3xl object-cover border-2 border-indigo-500/50 shadow-xl shadow-indigo-600/20"
              />
            ) : (
              <div className="h-32 w-32 rounded-3xl bg-indigo-600/20 border-2 border-dashed border-indigo-500/40 text-indigo-400 font-extrabold text-3xl flex items-center justify-center">
                {formData.fullName.split(' ').map(n => n[0]).join('')}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-950/70 rounded-3xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white gap-1"
            >
              <Upload className="h-5 w-5 text-indigo-400" />
              <span className="text-[10px] font-bold">Upload Photo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{formData.fullName}</h3>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
              {formData.roleKey.replace('_', ' ')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{formData.email}</p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4 text-indigo-400" />
            <span>Select Photo (50KB–100KB)</span>
          </button>

          {photoError && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5 text-left">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{photoError}</span>
            </p>
          )}

          <div className="w-full pt-4 border-t border-slate-800/80 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Security Clearance:</span>
              <span className="font-semibold text-emerald-400">Active Node</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Access Mode:</span>
              <span className="font-semibold text-slate-200">
                {isAdmin ? 'Super Admin Mode' : 'Staff Self-Service'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Editable Identity Form */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Staff Information & Credentials</h2>
              <p className="text-xs text-slate-400">
                {isAdmin ? 'Admin mode: All fields editable.' : 'Staff mode: Address, phone number, and photo are editable.'}
              </p>
            </div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                <CheckCircle2 className="h-4 w-4" /> Profile Updated
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Work Email Address</label>
                <input
                  type="email"
                  required
                  disabled={!isAdmin}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Contact Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+1-555-0199"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  disabled={!isAdmin}
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Current Residential Address</label>
              <textarea
                rows={2}
                required
                placeholder="Street address, city, state, postal code..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Assigned System Role</label>
                <select
                  disabled={!isAdmin}
                  value={formData.roleKey}
                  onChange={(e) => setFormData({ ...formData, roleKey: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed capitalize cursor-pointer"
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Campaign Manager</option>
                  <option value="accountant">Corporate Accountant</option>
                  <option value="content_creator">Content Creator</option>
                  <option value="media_buyer">Media Buyer</option>
                  <option value="executive">Executive CMO</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Department Unit</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}