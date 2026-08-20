import React, { useState, useEffect } from 'react';
import { 
  MasterRoleRecord, 
  RolePermission, 
  ModuleCode, 
  marketFlowClient, 
  UserRole 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { Shield, Check, Lock } from 'lucide-react';

const MODULES_LIST: { code: ModuleCode; label: string; description: string }[] = [
  { code: 'dashboard', label: 'Executive Dashboard', description: 'Telemetry, ROAS, CAC and strategic revenue analytics' },
  { code: 'campaigns', label: 'Campaigns & Budgets', description: 'Paid ad sets, target CPLs, spend pacing & budget PO requests' },
  { code: 'content_calendar', label: 'Content Calendar & Pipeline', description: 'Cross-platform post drafting, asset staging & direct scheduling' },
  { code: 'tasks', label: 'Production Tasks & Queue', description: 'Creative task allocation, delegation & workflow pipeline' },
  { code: 'leads', label: 'Leads & Attribution Funnel', description: 'CRM pipeline stages, deal values & multi-touch UTM tracking' },
  { code: 'master_admin', label: 'Master Administration & MDM', description: 'Dynamic schema studio, department MDM & workforce security' },
];

export const DynamicPermissionGrid: React.FC = () => {
  const { refreshPermissions } = useAppShell();
  const [roles, setRoles] = useState<MasterRoleRecord[]>([]);
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>('accountant');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadRolesAndMatrix();
  }, []);

  useEffect(() => {
    if (selectedRoleKey) {
      loadPermissionsForRole(selectedRoleKey);
    }
  }, [selectedRoleKey]);

  const loadRolesAndMatrix = async () => {
    try {
      const fetchedRoles = await marketFlowClient.getRoles();
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0) {
        await loadPermissionsForRole(selectedRoleKey);
      }
    } catch (e) {
      console.error('Failed to load matrix roles:', e);
    }
  };

  const loadPermissionsForRole = async (roleKey: UserRole) => {
    try {
      const perms = await marketFlowClient.getRolePermissions(roleKey);
      // Guarantee each of the 6 modules has its seeded checked status
      const fullPerms = MODULES_LIST.map((m) => {
        const found = perms.find((p) => p.module_code === m.code);
        return (
          found || {
            module_code: m.code,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_approve: false,
          }
        );
      });
      setPermissions(fullPerms);
    } catch (e) {
      console.error('Error fetching role perms:', e);
    }
  };

  const handleToggle = async (moduleCode: ModuleCode, field: keyof RolePermission) => {
    const updated = permissions.map((p) => {
      if (p.module_code === moduleCode) {
        const currentVal = Boolean(p[field]);
        const newVal = !currentVal;
        return { ...p, [field]: newVal };
      }
      return p;
    });

    setPermissions(updated);

    const targetRow = updated.find((p) => p.module_code === moduleCode);
    if (targetRow) {
      await marketFlowClient.updateRolePermission(
        selectedRoleKey,
        moduleCode,
        field,
        Boolean(targetRow[field])
      );
      await refreshPermissions();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  const selectedRole = roles.find((r) => r.role_key === selectedRoleKey);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Header & Role Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Dynamic Role & Privilege Matrix</h3>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md animate-fade-in">
                <Check className="h-3 w-3" /> Synced Live
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Check or uncheck boxes to immediately grant or revoke privileges for any role or staff member.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoleKey(r.role_key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedRoleKey === r.role_key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {r.is_system_locked && <Lock className="h-3 w-3 text-slate-400" />}
              <span>{r.role_name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Role Meta Banner */}
      {selectedRole && (
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-200">{selectedRole.role_name}</span>
            <span className="text-slate-400 ml-2">— {selectedRole.description}</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            Selected: <strong className="capitalize text-white">{selectedRole.role_key.replace('_', ' ')}</strong>
          </span>
        </div>
      )}

      {/* Checkbox Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4 min-w-[220px]">System Module</th>
              <th className="py-3 px-3 text-center">View (Read)</th>
              <th className="py-3 px-3 text-center">Create (Add)</th>
              <th className="py-3 px-3 text-center">Edit (Update)</th>
              <th className="py-3 px-3 text-center">Delete</th>
              <th className="py-3 px-4 text-center bg-indigo-950/30 text-indigo-300 font-bold border-l border-slate-800">
                Approve / Sign-off ⭐
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
            {MODULES_LIST.map((mod) => {
              const perm = permissions.find((p) => p.module_code === mod.code) || {
                module_code: mod.code,
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false,
                can_approve: false,
              };

              return (
                <tr key={mod.code} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-200">{mod.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{mod.description}</p>
                  </td>

                  {/* View */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(perm.can_view)}
                      onChange={() => handleToggle(mod.code, 'can_view')}
                      className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Create */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(perm.can_create)}
                      onChange={() => handleToggle(mod.code, 'can_create')}
                      className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Edit */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(perm.can_edit)}
                      onChange={() => handleToggle(mod.code, 'can_edit')}
                      className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Delete */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(perm.can_delete)}
                      onChange={() => handleToggle(mod.code, 'can_delete')}
                      className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>

                  {/* Approve / Sign-off */}
                  <td className="py-3.5 px-4 text-center bg-indigo-950/20 border-l border-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(perm.can_approve)}
                      onChange={() => handleToggle(mod.code, 'can_approve')}
                      className="h-4 w-4 rounded bg-slate-950 border-indigo-500/50 text-indigo-500 focus:ring-indigo-400 cursor-pointer"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};