import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, ModuleCode, marketFlowClient, RolePermission } from './marketflow-client';

export interface EnterprisePersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  label: string;
  department: string;
  avatarUrl?: string;
  address?: string;
  phone?: string;
}

export const ENTERPRISE_PERSONAS: EnterprisePersona[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', name: 'Alex Rivera', email: 'alex.rivera@marketflow.io', role: 'admin', label: 'Workspace Administrator', department: 'Executive Management', address: '448 Montgomery St, San Francisco, CA', phone: '+1-555-0101' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Sarah Jenkins', email: 'sarah.j@marketflow.io', role: 'manager', label: 'Campaign Manager', department: 'Marketing Operations', address: '120 Market St, San Francisco, CA', phone: '+1-555-0102' },
  { id: 'b0000000-0000-0000-0000-000000000003', name: 'Elena Rostova', email: 'elena.r@marketflow.io', role: 'accountant', label: 'Corporate Accountant', department: 'Finance & PO Approvals', address: '890 Broadway Ave, New York, NY', phone: '+1-555-0103' },
  { id: 'b0000000-0000-0000-0000-000000000004', name: 'Maya Lin', email: 'maya.lin@marketflow.io', role: 'content_creator', label: 'Content Creator', department: 'Creative Studio', address: '304 2nd St, Austin, TX', phone: '+1-555-0104' },
  { id: 'b0000000-0000-0000-0000-000000000005', name: 'Marcus Vance', email: 'marcus.v@marketflow.io', role: 'media_buyer', label: 'Media Buyer', department: 'Paid Media Operations', address: '772 Pine St, Seattle, WA', phone: '+1-555-0105' },
  { id: 'b0000000-0000-0000-0000-000000000006', name: 'Dr. Aris Thorne', email: 'aris.thorne@marketflow.io', role: 'executive', label: 'Executive CMO', department: 'C-Suite', address: '100 Federal St, Boston, MA', phone: '+1-555-0106' },
];

interface AppShellContextType {
  user: EnterprisePersona;
  role: UserRole;
  isAuthenticated: boolean;
  isDemoModeEnabled: boolean;
  permissions: RolePermission[];
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsPersona: (persona: EnterprisePersona) => void;
  logout: () => void;
  toggleDemoMode: (enabled: boolean) => void;
  updateCurrentUserProfile: (updates: Partial<EnterprisePersona>) => void;
  refreshPermissions: () => Promise<void>;
  canView: (module: ModuleCode) => boolean;
  canCreate: (module: ModuleCode) => boolean;
  canEdit: (module: ModuleCode) => boolean;
  canDelete: (module: ModuleCode) => boolean;
  canApprove: (module: ModuleCode) => boolean;
  canDirectSchedule: boolean;
  canManageWorkforce: boolean;
}

const AppShellContext = createContext<AppShellContextType | undefined>(undefined);

export const AppShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Stable initial hydration from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mf_auth_token') === 'true';
    }
    return true; // Default fallback to allow direct session mounting
  });

  const [currentUser, setCurrentUser] = useState<EnterprisePersona>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mf_active_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    return ENTERPRISE_PERSONAS[0];
  });

  const [isDemoModeEnabled, setIsDemoModeEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mf_demo_mode_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [permissions, setPermissions] = useState<RolePermission[]>([]);

  const loadPermissions = async (userRole: UserRole) => {
    const perms = await marketFlowClient.getRolePermissions(userRole);
    setPermissions(perms);
  };

  useEffect(() => {
    loadPermissions(currentUser.role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mf_active_user', JSON.stringify(currentUser));
      localStorage.setItem('mf_auth_token', isAuthenticated ? 'true' : 'false');
      localStorage.setItem('mf_demo_mode_enabled', isDemoModeEnabled ? 'true' : 'false');
    }
  }, [currentUser, isAuthenticated, isDemoModeEnabled]);

  const toggleDemoMode = (enabled: boolean) => {
    setIsDemoModeEnabled(enabled);
    localStorage.setItem('mf_demo_mode_enabled', enabled ? 'true' : 'false');
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const matched = ENTERPRISE_PERSONAS.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
    if (!matched) {
      return { success: false, error: 'Unrecognized organization email address.' };
    }
    if (pass.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    setCurrentUser(matched);
    setIsAuthenticated(true);
    localStorage.setItem('mf_auth_token', 'true');
    localStorage.setItem('mf_active_user', JSON.stringify(matched));
    await loadPermissions(matched.role);
    return { success: true };
  };

  const loginAsPersona = (persona: EnterprisePersona) => {
    setCurrentUser(persona);
    setIsAuthenticated(true);
    localStorage.setItem('mf_auth_token', 'true');
    localStorage.setItem('mf_active_user', JSON.stringify(persona));
    loadPermissions(persona.role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('mf_auth_token', 'false');
  };

  const updateCurrentUserProfile = (updates: Partial<EnterprisePersona>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      marketFlowClient.updateStaffProfile(prev.id, {
        full_name: updated.name,
        phone_number: updated.phone,
        address: updated.address,
        avatar_url: updated.avatarUrl,
      });
      return updated;
    });
  };

  const refreshPermissions = async () => {
    await loadPermissions(currentUser.role);
  };

  const getModulePerm = (module: ModuleCode) => {
    return permissions.find(p => p.module_code === module) || {
      module_code: module,
      can_view: currentUser.role === 'admin',
      can_create: currentUser.role === 'admin',
      can_edit: currentUser.role === 'admin',
      can_delete: currentUser.role === 'admin',
      can_approve: currentUser.role === 'admin',
    };
  };

  const canView = (module: ModuleCode) => Boolean(getModulePerm(module).can_view);
  const canCreate = (module: ModuleCode) => Boolean(getModulePerm(module).can_create);
  const canEdit = (module: ModuleCode) => Boolean(getModulePerm(module).can_edit);
  const canDelete = (module: ModuleCode) => Boolean(getModulePerm(module).can_delete);
  const canApprove = (module: ModuleCode) => Boolean(getModulePerm(module).can_approve);

  const canDirectSchedule = Boolean(getModulePerm('content_calendar').can_approve);
  const canManageWorkforce = currentUser.role === 'admin';

  return (
    <AppShellContext.Provider
      value={{
        user: currentUser,
        role: currentUser.role,
        isAuthenticated,
        isDemoModeEnabled,
        permissions,
        login,
        loginAsPersona,
        logout,
        toggleDemoMode,
        updateCurrentUserProfile,
        refreshPermissions,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canApprove,
        canDirectSchedule,
        canManageWorkforce,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
};

export const useAppShell = () => {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider');
  }
  return context;
};