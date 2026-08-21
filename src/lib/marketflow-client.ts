import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'accountant' | 'content_creator' | 'media_buyer' | 'executive';
export type ModuleCode = 'dashboard' | 'campaigns' | 'content_calendar' | 'tasks' | 'leads' | 'master_admin';

export interface MasterRoleRecord {
  id: string;
  role_key: UserRole;
  role_name: string;
  description: string;
  is_system_locked: boolean;
}

export interface RolePermission {
  module_code: ModuleCode;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

export interface StaffMemberRecord {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  dob?: string;
  address?: string;
  avatar_url?: string;
  role_id: string;
  role_key: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  custom_attributes: Record<string, any>;
  created_at?: string;
  deleted_at?: string | null;
}

export interface CustomFieldDefinition {
  id: string;
  entity_type: 'campaign' | 'staff' | 'content_post' | 'lead';
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'dropdown' | 'boolean';
  is_required: boolean;
  options?: string[];
}

export interface CampaignRecord {
  id: string;
  name: string;
  channel: 'facebook' | 'google' | 'linkedin' | 'instagram' | 'youtube';
  total_budget: number;
  daily_budget: number;
  actual_spend?: number;
  target_cpl: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  approval_status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  created_by?: string | null;
  approved_by?: string | null;
  custom_attributes: Record<string, any>;
  deleted_at?: string | null;
}

export interface ContentPostRecord {
  id: string;
  campaign_id?: string | null;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'youtube';
  title: string;
  copy_body?: string;
  media_type?: 'single_image' | 'carousel' | 'video_reel' | 'article';
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'rejected';
  scheduled_at?: string | null;
  author_id?: string | null;
  approved_by?: string | null;
  custom_attributes?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string | null;
  related_campaign_id?: string | null;
  related_post_id?: string | null;
  status: 'backlog' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LeadRecord {
  id: string;
  full_name: string;
  email: string;
  company?: string;
  source_platform: string;
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  pipeline_stage: 'new' | 'contacted' | 'qualified' | 'mql' | 'sql' | 'proposal' | 'negotiation' | 'customer_won' | 'converted' | 'lost';
  deal_value: number;
  custom_attributes: Record<string, any>;
  created_at: string;
  deleted_at?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'approval' | 'budget' | 'lead' | 'task';
}

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

class MarketFlowClient {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      } catch (e) {
        console.error('Supabase initialization failed:', e);
      }
    }
  }

  // --- Campaign Operations ---
  async getCampaigns(): Promise<CampaignRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('campaign_master')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          localStorage.setItem('mf_campaigns', JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.error('Supabase getCampaigns error:', e);
      }
    }
    const raw = localStorage.getItem('mf_campaigns');
    return raw ? JSON.parse(raw) : [];
  }

  async createCampaign(record: Omit<CampaignRecord, 'id'>): Promise<CampaignRecord> {
    if (this.supabase) {
      try {
        const payload = {
          name: record.name,
          channel: record.channel,
          total_budget: Number(record.total_budget || 0),
          daily_budget: Number(record.daily_budget || 0),
          actual_spend: Number(record.actual_spend || 0),
          target_cpl: Number(record.target_cpl || 0),
          status: record.status || 'active',
          approval_status: record.approval_status || 'draft',
          created_by: isValidUUID(record.created_by) ? record.created_by : null,
          approved_by: isValidUUID(record.approved_by) ? record.approved_by : null,
          custom_attributes: record.custom_attributes || {},
        };

        const { data, error } = await this.supabase
          .from('campaign_master')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return data;
        } else if (error) {
          console.error('Supabase insert campaign error:', error);
        }
      } catch (e) {
        console.error('Supabase createCampaign exception:', e);
      }
    }

    // Local fallback
    const camps = await this.getCampaigns();
    const created: CampaignRecord = {
      ...record,
      id: `c0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`,
      actual_spend: record.actual_spend || 0,
    };
    camps.unshift(created);
    localStorage.setItem('mf_campaigns', JSON.stringify(camps));
    return created;
  }

  async updateCampaignSpend(campId: string, updates: Partial<CampaignRecord>): Promise<void> {
    if (this.supabase && isValidUUID(campId)) {
      try {
        const payload: any = { ...updates };
        if (payload.created_by !== undefined && !isValidUUID(payload.created_by)) payload.created_by = null;
        if (payload.approved_by !== undefined && !isValidUUID(payload.approved_by)) payload.approved_by = null;

        await this.supabase.from('campaign_master').update(payload).eq('id', campId);
      } catch (e) {
        console.error('Supabase updateCampaignSpend error:', e);
      }
    }

    const camps = await this.getCampaigns();
    const updated = camps.map(c => (c.id === campId ? { ...c, ...updates } : c));
    localStorage.setItem('mf_campaigns', JSON.stringify(updated));
  }

  // --- Staff Operations ---
  async getStaff(): Promise<StaffMemberRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('staff_master')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (!error && data) {
          localStorage.setItem('mf_staff', JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_staff');
    return raw ? JSON.parse(raw) : [];
  }

  async updateStaffProfile(staffId: string, updates: Partial<StaffMemberRecord>): Promise<StaffMemberRecord> {
    if (this.supabase && isValidUUID(staffId)) {
      try {
        await this.supabase.from('staff_master').update(updates).eq('id', staffId);
      } catch (e) {
        console.error(e);
      }
    }
    const staff = await this.getStaff();
    const updated = staff.map(s => (s.id === staffId ? { ...s, ...updates } : s));
    localStorage.setItem('mf_staff', JSON.stringify(updated));
    return updated.find(s => s.id === staffId)!;
  }

  async createStaff(record: Omit<StaffMemberRecord, 'id'>): Promise<StaffMemberRecord> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('staff_master')
          .insert([record])
          .select()
          .single();

        if (!error && data) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const staff = await this.getStaff();
    const newStaff: StaffMemberRecord = {
      ...record,
      id: `b0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
    };
    staff.push(newStaff);
    localStorage.setItem('mf_staff', JSON.stringify(staff));
    return newStaff;
  }

  // --- Dynamic Permissions Matrix ---
  async getRoles(): Promise<MasterRoleRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('master_roles')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_roles');
    return raw ? JSON.parse(raw) : [];
  }

  async getRolePermissions(roleIdOrKey: string): Promise<RolePermission[]> {
    if (this.supabase) {
      try {
        const roles = await this.getRoles();
        const matched = roles.find(r => r.id === roleIdOrKey || r.role_key === roleIdOrKey);
        if (matched) {
          const { data, error } = await this.supabase
            .from('role_permissions')
            .select('*')
            .eq('role_id', matched.id);

          if (!error && data && data.length > 0) return data;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_perms');
    return raw ? JSON.parse(raw)[roleIdOrKey] || [] : [];
  }

  async updateRolePermission(
    roleIdOrKey: string,
    moduleCode: ModuleCode,
    field: keyof RolePermission,
    value: boolean
  ): Promise<void> {
    const roles = await this.getRoles();
    const matchedRole = roles.find(r => r.id === roleIdOrKey || r.role_key === roleIdOrKey);

    if (this.supabase && matchedRole) {
      try {
        await this.supabase.from('role_permissions').upsert({
          role_id: matchedRole.id,
          module_code: moduleCode,
          [field]: value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'role_id,module_code' });
      } catch (e) {
        console.error(e);
      }
    }
  }

  // --- Content Posts Operations ---
  async getContentPosts(): Promise<ContentPostRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('content_posts')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_posts');
    return raw ? JSON.parse(raw) : [];
  }

  async createContentPost(record: Omit<ContentPostRecord, 'id'>): Promise<ContentPostRecord> {
    const payload = {
      ...record,
      campaign_id: isValidUUID(record.campaign_id) ? record.campaign_id : null,
      author_id: isValidUUID(record.author_id) ? record.author_id : null,
      approved_by: isValidUUID(record.approved_by) ? record.approved_by : null,
      custom_attributes: record.custom_attributes || {},
    };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('content_posts')
          .insert([payload])
          .select()
          .single();

        if (!error && data) return data;
      } catch (e) {
        console.error('Supabase createContentPost exception:', e);
      }
    }

    // Local storage fallback
    const posts = await this.getContentPosts();
    const newPost: ContentPostRecord = {
      ...record,
      id: `p0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    posts.unshift(newPost);
    localStorage.setItem('mf_posts', JSON.stringify(posts));
    return newPost;
  }

  async updatePostStatus(postId: string, status: ContentPostRecord['status'], approvedBy?: string): Promise<void> {
    if (this.supabase && isValidUUID(postId)) {
      try {
        await this.supabase
          .from('content_posts')
          .update({ 
            status, 
            approved_by: isValidUUID(approvedBy) ? approvedBy : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', postId);
      } catch (e) {
        console.error(e);
      }
    }
    const posts = await this.getContentPosts();
    const updated = posts.map(p => (p.id === postId ? { ...p, status } : p));
    localStorage.setItem('mf_posts', JSON.stringify(updated));
  }

  // --- Tasks Operations ---
  async getTasks(): Promise<TaskRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('task_queue')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_tasks');
    return raw ? JSON.parse(raw) : [];
  }

  async createTask(record: Omit<TaskRecord, 'id'>): Promise<TaskRecord> {
    const payload = {
      ...record,
      assigned_to: isValidUUID(record.assigned_to) ? record.assigned_to : null,
      related_campaign_id: isValidUUID(record.related_campaign_id) ? record.related_campaign_id : null,
      related_post_id: isValidUUID(record.related_post_id) ? record.related_post_id : null,
    };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('task_queue')
          .insert([payload])
          .select()
          .single();

        if (!error && data) return data;
      } catch (e) {
        console.error('Supabase createTask exception:', e);
      }
    }

    // Local storage fallback
    const tasks = await this.getTasks();
    const newTask: TaskRecord = {
      ...record,
      id: `t0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    localStorage.setItem('mf_tasks', JSON.stringify(tasks));
    return newTask;
  }

  // --- Leads Operations ---
  async getLeads(): Promise<LeadRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('leads_attribution')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_leads');
    return raw ? JSON.parse(raw) : [];
  }

  // --- Custom Fields Engine ---
  async getCustomFields(entityType?: string): Promise<CustomFieldDefinition[]> {
    if (this.supabase) {
      try {
        let q = this.supabase.from('custom_field_definitions').select('*');
        if (entityType) q = q.eq('entity_type', entityType);
        const { data, error } = await q;
        if (!error && data) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const raw = localStorage.getItem('mf_custom_fields');
    return raw ? JSON.parse(raw) : [];
  }

  async addCustomField(field: Omit<CustomFieldDefinition, 'id'>): Promise<CustomFieldDefinition> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('custom_field_definitions')
          .insert([field])
          .select()
          .single();

        if (!error && data) return data;
      } catch (e) {
        console.error(e);
      }
    }
    const fields = await this.getCustomFields();
    const created: CustomFieldDefinition = { ...field, id: `cf-${Date.now()}` };
    fields.push(created);
    localStorage.setItem('mf_custom_fields', JSON.stringify(fields));
    return created;
  }

  // --- Notifications Operations ---
  async getNotifications(): Promise<NotificationItem[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('system_notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            message: d.message,
            timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: d.is_read,
            type: d.notification_type || 'approval',
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    const local = localStorage.getItem('mf_notifications');
    return local ? JSON.parse(local) : [];
  }

  async markAllNotificationsRead(): Promise<void> {
    if (this.supabase) {
      try {
        await this.supabase.from('system_notifications').update({ is_read: true }).neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.error(e);
      }
    }
    const items = await this.getNotifications();
    const updated = items.map(n => ({ ...n, isRead: true }));
    localStorage.setItem('mf_notifications', JSON.stringify(updated));
  }

  async deleteRecord(table: string, id: string): Promise<void> {
    if (this.supabase && isValidUUID(id)) {
      try {
        await this.supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // --- Calculations & Formulas ---
  calculateAttributionMetrics(campaigns: CampaignRecord[], leads: LeadRecord[]) {
    const activeCamps = campaigns.filter(c => !c.deleted_at);
    const activeLeads = leads.filter(l => !l.deleted_at);

    const totalSpend = activeCamps.reduce((sum, c) => sum + (Number(c.actual_spend) || 0), 0);
    const totalBudget = activeCamps.reduce((sum, c) => sum + (Number(c.total_budget) || 0), 0);
    const totalLeadsCount = activeLeads.length;

    const wonLeads = activeLeads.filter(l => l.pipeline_stage === 'customer_won' || l.pipeline_stage === 'converted');
    const totalConversions = wonLeads.length;
    const totalPipelineRevenue = wonLeads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    const blendedCPL = totalLeadsCount > 0 ? (totalSpend / totalLeadsCount).toFixed(2) : '0.00';
    const blendedCAC = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0.00';
    const roas = totalSpend > 0 ? (totalPipelineRevenue / totalSpend).toFixed(2) : '0.00';
    const budgetPacing = totalBudget > 0 ? ((totalSpend / totalBudget) * 100).toFixed(1) : '0.0';

    return {
      totalSpend,
      totalBudget,
      totalLeadsCount,
      totalConversions,
      totalPipelineRevenue,
      blendedCPL,
      blendedCAC,
      roas,
      budgetPacing,
    };
  }
}

export const marketFlowClient = new MarketFlowClient();