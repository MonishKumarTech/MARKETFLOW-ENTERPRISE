import React, { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { 
  marketFlowClient, 
  StaffMemberRecord, 
  CustomFieldDefinition, 
  MasterRoleRecord 
} from '@/lib/marketflow-client';
import { useAppShell, ENTERPRISE_PERSONAS } from '@/lib/app-shell-context';
import { DynamicPermissionGrid } from '@/components/dynamic-permission-grid';
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  Sliders, 
  Lock, 
  Trash2, 
  X, 
  Mail, 
  Phone, 
  Calendar,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Settings
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/master-admin',
  component: MasterAdminView,
});

function MasterAdminView() {
  const { user, role, canManageWorkforce, isDemoModeEnabled, toggleDemoMode } = useAppShell();
  const [staffList, setStaffList] = useState<StaffMemberRecord[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [roles, setRoles] = useState<MasterRoleRecord[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'workforce' | 'matrix' | 'schema' | 'settings'>('workforce');

  // Staff Ingestion Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    dob: '1995-06-15',
    role_key: 'content_creator' as StaffMemberRecord['role_key'],
    status: 'active' as StaffMemberRecord['status'],
    custom_attributes: {} as Record<string, any>,
  });

  // Custom Field Studio Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState<boolean>(false);
  const [fieldForm, setFieldForm] = useState({
    entity_type: 'staff' as CustomFieldDefinition['entity_type'],
    field_key: '',
    field_label: '',
    field_type: 'text' as CustomFieldDefinition['field_type'],
    is_required: false,
    options_raw: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staff, fields, rolesData] = await Promise.all([
        marketFlowClient.getStaff(),
        marketFlowClient.getCustomFields(),
        marketFlowClient.getRoles(),
      ]);
      setStaffList(staff);
      setCustomFields(fields);
      setRoles(rolesData);
    } catch (e) {
      console.error('Error fetching admin master records:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.full_name.trim() || !staffForm.email.trim()) return;

    const matchedRole = roles.find(r => r.role_key === staffForm.role_key) || roles[0];

    await marketFlowClient.createStaff({
      full_name: staffForm.full_name,
      email: staffForm.email,
      phone_number: staffForm.phone_number || undefined,
      dob: staffForm.dob || undefined,
      role_id: matchedRole ? matchedRole.id : 'a0000000-0000-0000-0000-000000000004',
      role_key: staffForm.role_key,
      status: staffForm.status,
      custom_attributes: staffForm.custom_attributes,
    });

    setIsStaffModalOpen(false);
    setStaffForm({
      full_name: '',
      email: '',
      phone_number: '',
      dob: '1995-06-15',
      role_key: 'content_creator',
      status: 'active',
      custom_attributes: {},
    });
    await loadData();
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.field_key.trim() || !fieldForm.field_label.trim()) return;

    const parsedOptions = fieldForm.options_raw
      ? fieldForm.options_raw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    await marketFlowClient.addCustomField({
      entity_type: fieldForm.entity_type,
      field_key: fieldForm.field_key.toLowerCase().replace(/\s+/g, '_'),
      field_label: fieldForm.field_label,
      field_type: fieldForm.field_type,
      is_required: fieldForm.is_required,
      options: parsedOptions,
    });

    setIsFieldModalOpen(false);
    setFieldForm({
      entity_type: 'staff',
      field_key: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      options_raw: '',
    });
    await loadData();
  };

  const handleDeleteStaff = async (id: string) => {
    if (!canManageWorkforce) return;
    if (confirm('Soft-delete this staff member and revoke system access?')) {
      await marketFlowClient.deleteRecord('staff_master', id);
      await loadData();
    }
  };

  if (!canManageWorkforce && role !== 'admin') {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <Lock className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Restricted Master Administration Area</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Access to workforce provisioning, master role matrix manipulation, and schema modification is strictly restricted to Workspace Administrators.
        </p>
        <p className="text-xs text-indigo-400 font-semibold">
          Current Persona: <span className="capitalize text-white">{role.replace('_', ' ')}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Master Administration & Schema Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Workforce lifecycle, dynamic data schema modeling, and institutional RBAC checkbox security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('workforce')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'workforce'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Staff Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Privilege Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Custom Fields</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>System Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORKFORCE DIRECTORY */}
      {activeTab === 'workforce' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Workforce & Security Personnel</h2>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.filter(s => !s.deleted_at).map((staff) => (
              <div
                key={staff.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {staff.role_key.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {staff.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{staff.full_name}</h3>

                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{staff.email}</span>
                    </p>
                    {staff.phone_number && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{staff.phone_number}</span>
                      </p>
                    )}
                    {staff.dob && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>DOB: {staff.dob}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>ID: {staff.id.slice(-8)}</span>
                  {staff.email !== user.email && (
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="p-1 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition"
                      title="Soft delete user"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRIVILEGE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <DynamicPermissionGrid />
        </div>
      )}

      {/* TAB 3: CUSTOM SCHEMA STUDIO */}
      {activeTab === 'schema' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Dynamic Field Modeling Studio</h2>
              <p className="text-xs text-slate-400">Extend database schemas dynamically for campaigns, staff, and leads.</p>
            </div>
            <button
              onClick={() => setIsFieldModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <Sliders className="h-4 w-4" />
              <span>Define New Field</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-3">Field Key</th>
                  <th className="py-3.5 px-3">UI Label</th>
                  <th className="py-3.5 px-3">Data Type</th>
                  <th className="py-3.5 px-4">Options / Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                        {field.entity_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      {field.field_key}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      {field.field_label}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                        {field.field_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {field.options && field.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {field.options.map(opt => (
                            <span key={opt} className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 border border-slate-800">
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600">None (Scalar)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM SETTINGS & DEMO MODE CONTROL */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">System Feature Flags & Security Options</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control global application behaviors and public login page display elements.</p>
            </div>

            {/* Fast-Login Feature Flag Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Login Page: 1-Click Demo Fast-Login Tiles</span>
                </div>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  When enabled, shows the 1-click persona fast-switch buttons on the login screen for interviewer evaluation. Toggle off for strict production credential login.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleDemoMode(!isDemoModeEnabled)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shrink-0 ${
                  isDemoModeEnabled
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                {isDemoModeEnabled ? (
                  <>
                    <ToggleRight className="h-4 w-4" />
                    <span>Demo Mode ACTIVE</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4" />
                    <span>Demo Mode DISABLED</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Ingest Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Register Staff Personnel</h3>
                <p className="text-xs text-slate-400">Add team members and assign security roles</p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={staffForm.full_name}
                  onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. mvance@marketflow.io"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1-555-0199"
                    value={staffForm.phone_number}
                    onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Assigned Master Role</label>
                  <select
                    value={staffForm.role_key}
                    onChange={(e) => setStaffForm({ ...staffForm, role_key: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 capitalize cursor-pointer"
                  >
                    {ENTERPRISE_PERSONAS.map(p => (
                      <option key={p.role} value={p.role}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={staffForm.dob}
                    onChange={(e) => setStaffForm({ ...staffForm, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  Create Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Define Custom Field Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Define Dynamic Custom Field</h3>
                <p className="text-xs text-slate-400">Dynamically attach metadata to entities</p>
              </div>
              <button
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomField} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Target Entity</label>
                  <select
                    value={fieldForm.entity_type}
                    onChange={(e) => setFieldForm({ ...fieldForm, entity_type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="staff">Staff Personnel</option>
                    <option value="campaign">Marketing Campaign</option>
                    <option value="content_post">Content Calendar Post</option>
                    <option value="lead">Attribution Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Data Type</label>
                  <select
                    value={fieldForm.field_type}
                    onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Numeric Value</option>
                    <option value="date">Date Picker</option>
                    <option value="dropdown">Select Dropdown</option>
                    <option value="boolean">Yes/No Boolean</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Field Key (Snake Case)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. area_allotment or pan_number"
                  value={fieldForm.field_key}
                  onChange={(e) => setFieldForm({ ...fieldForm, field_key: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Field UI Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing Area Allotment & Distribution"
                  value={fieldForm.field_label}
                  onChange={(e) => setFieldForm({ ...fieldForm, field_label: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {fieldForm.field_type === 'dropdown' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Dropdown Options (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Chennai Metro, Bangalore Urban, Overseas"
                    value={fieldForm.options_raw}
                    onChange={(e) => setFieldForm({ ...fieldForm, options_raw: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  Save Dynamic Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}