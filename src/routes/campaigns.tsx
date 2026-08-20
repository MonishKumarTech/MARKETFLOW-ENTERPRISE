import React, { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { 
  marketFlowClient, 
  CampaignRecord, 
  CustomFieldDefinition 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { DynamicFormField } from '@/components/dynamic-form-field';
import { 
  Plus, 
  Layers, 
  X, 
  Trash2, 
  Check, 
  Globe,
  Edit3,
  Lock
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns',
  component: CampaignsView,
});

function CampaignsView() {
  const { user, canCreate, canEdit, canDelete, canApprove } = useAppShell();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [, setLoading] = useState<boolean>(true);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'facebook' | 'google' | 'linkedin' | 'instagram' | 'youtube'>('all');

  // Form State for Creating
  const [formData, setFormData] = useState({
    name: '',
    channel: 'facebook' as CampaignRecord['channel'],
    total_budget: 5000,
    daily_budget: 200,
    target_cpl: 30,
    status: 'active' as CampaignRecord['status'],
    approval_status: 'draft' as CampaignRecord['approval_status'],
    custom_attributes: {} as Record<string, any>,
  });

  // Edit State
  const [editingCamp, setEditingCamp] = useState<CampaignRecord | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedCamps, fields] = await Promise.all([
        marketFlowClient.getCampaigns(),
        marketFlowClient.getCustomFields('campaign'),
      ]);
      setCampaigns(fetchedCamps);
      setCustomFields(fields);
    } catch (e) {
      console.error('Error fetching campaigns:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFieldChange = (key: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      custom_attributes: {
        ...prev.custom_attributes,
        [key]: val,
      },
    }));
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate('campaigns')) {
      alert('Security Protection: Your active role does not have permission to create campaigns.');
      return;
    }
    if (!formData.name.trim()) return;

    const initialApproval = canApprove('campaigns') ? 'approved' : 'pending_review';

    await marketFlowClient.createCampaign({
      name: formData.name,
      channel: formData.channel,
      total_budget: Number(formData.total_budget),
      daily_budget: Number(formData.daily_budget),
      target_cpl: Number(formData.target_cpl),
      status: formData.status,
      approval_status: initialApproval,
      created_by: user.id,
      approved_by: canApprove('campaigns') ? user.id : null,
      custom_attributes: formData.custom_attributes,
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: '',
      channel: 'facebook',
      total_budget: 5000,
      daily_budget: 200,
      target_cpl: 30,
      status: 'active',
      approval_status: 'draft',
      custom_attributes: {},
    });
    await loadData();
  };

  // Security Guard on Opening Edit
  const openEditModal = (camp: CampaignRecord) => {
    if (!canEdit('campaigns')) {
      alert('Security Protection: Your active role does not have permission to edit campaigns or log spend.');
      return;
    }
    setEditingCamp(camp);
    setIsEditModalOpen(true);
  };

  // Security Guard on Submitting Edit
  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit('campaigns')) {
      alert('Access Denied: Edit permission is unchecked for your role.');
      return;
    }
    if (!editingCamp) return;

    const updated = campaigns.map(c => c.id === editingCamp.id ? editingCamp : c);
    setCampaigns(updated);
    localStorage.setItem('mf_campaigns', JSON.stringify(updated));

    setIsEditModalOpen(false);
    setEditingCamp(null);
  };

  const handleApproveBudget = async (campId: string) => {
    if (!canApprove('campaigns')) {
      alert('Security Protection: Only authorized approvers can sign-off budget release.');
      return;
    }
    const updated = campaigns.map(c => 
      c.id === campId 
        ? { ...c, approval_status: 'approved' as const, approved_by: user.id } 
        : c
    );
    setCampaigns(updated);
    localStorage.setItem('mf_campaigns', JSON.stringify(updated));
  };

  const handleDelete = async (id: string) => {
    if (!canDelete('campaigns')) {
      alert('Security Protection: Your role is restricted from deleting campaign records.');
      return;
    }
    if (confirm('Move this campaign to the soft-delete audit recycle bin?')) {
      await marketFlowClient.deleteRecord('campaign_master', id);
      await loadData();
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (c.deleted_at) return false;
    if (activeFilter === 'all') return true;
    return c.channel === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Paid Campaigns & Budget Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Media buying operations, pacing caps, target CPL benchmarks, and financial PO approval queues.
          </p>
        </div>

        {canCreate('campaigns') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Launch Campaign</span>
          </button>
        )}
      </div>

      {/* 2. Channel Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'facebook', 'google', 'linkedin', 'instagram', 'youtube'] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveFilter(ch)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
              activeFilter === ch
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {ch === 'all' ? 'All Channels' : ch}
          </button>
        ))}
      </div>

      {/* 3. Campaigns Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCampaigns.map((camp) => {
          const spend = Number(camp.actual_spend || 0);
          const totalBudget = Number(camp.total_budget || 0);
          const pacingPercent = totalBudget > 0 ? Math.min(100, Math.round((spend / totalBudget) * 100)) : 0;
          const isPending = camp.approval_status === 'pending_review';

          return (
            <div
              key={camp.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg shadow-black/20"
            >
              <div className="space-y-3">
                {/* Channel & Status Bar */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-950 text-indigo-400 border border-slate-800 tracking-wider">
                    {camp.channel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        camp.approval_status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {camp.approval_status}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        camp.status === 'active'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                </div>

                {/* Title & Territory */}
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{camp.name}</h3>
                  {camp.custom_attributes?.area_allotment && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Globe className="h-3 w-3 text-indigo-400" />
                      <span>Territory: <strong className="text-slate-300">{camp.custom_attributes.area_allotment}</strong></span>
                    </p>
                  )}
                </div>

                {/* Spend & Budget Breakdown */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Actual Spend</span>
                    <span className="font-extrabold text-amber-400">${spend.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target CPL</span>
                    <span className="font-extrabold text-emerald-400">${camp.target_cpl}</span>
                  </div>
                </div>

                {/* Budget Pacing Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-slate-400">Budget Cap Pacing</span>
                    <span className="text-slate-200 font-bold">{pacingPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pacingPercent > 90
                          ? 'bg-rose-500'
                          : pacingPercent > 70
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pacingPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    Total Cap: ${totalBudget.toLocaleString()} (${camp.daily_budget}/day)
                  </div>
                </div>
              </div>

              {/* Action Buttons: Strict RBAC Checked */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {canEdit('campaigns') ? (
                  <button
                    onClick={() => openEditModal(camp)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Edit Campaign & Log Spend"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Edit / Log Spend</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-slate-600" />
                    <span>Read-Only Metrics</span>
                  </div>
                )}

                {isPending && canApprove('campaigns') && (
                  <button
                    onClick={() => handleApproveBudget(camp.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                )}

                {canDelete('campaigns') && (
                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 transition cursor-pointer"
                    title="Soft delete campaign"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Edit Campaign & Log Spend Modal (Guarded) */}
      {isEditModalOpen && editingCamp && canEdit('campaigns') && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Edit Campaign & Log Spend</h3>
                <p className="text-xs text-slate-400">Authorized spend and budget parameter modification</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={editingCamp.name}
                  onChange={(e) => setEditingCamp({ ...editingCamp, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Actual Spend to Date ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingCamp.actual_spend || 0}
                    onChange={(e) => setEditingCamp({ ...editingCamp, actual_spend: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Total Budget Cap ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingCamp.total_budget}
                    onChange={(e) => setEditingCamp({ ...editingCamp, total_budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Daily Budget ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingCamp.daily_budget}
                    onChange={(e) => setEditingCamp({ ...editingCamp, daily_budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Target CPL ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingCamp.target_cpl}
                    onChange={(e) => setEditingCamp({ ...editingCamp, target_cpl: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Operational Status</label>
                  <select
                    value={editingCamp.status}
                    onChange={(e) => setEditingCamp({ ...editingCamp, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="active">Active (Running)</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">PO Approval State</label>
                  <select
                    value={editingCamp.approval_status}
                    onChange={(e) => setEditingCamp({ ...editingCamp, approval_status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Save Campaign Spend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Launch Campaign Modal */}
      {isCreateModalOpen && canCreate('campaigns') && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Create & Launch Campaign</h3>
                <p className="text-xs text-slate-400">Configure parameters, budget caps, and marketing area allotment</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 High Intent Search Retargeting"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Ad Platform</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="facebook">Meta (Facebook/Instagram)</option>
                    <option value="google">Google Ads / YouTube</option>
                    <option value="linkedin">LinkedIn B2B</option>
                    <option value="instagram">Instagram Direct</option>
                    <option value="youtube">YouTube Video</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Target CPL ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.target_cpl}
                    onChange={(e) => setFormData({ ...formData, target_cpl: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Total Budget Cap ($)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Daily Budget ($)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={formData.daily_budget}
                    onChange={(e) => setFormData({ ...formData, daily_budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Custom Fields Section */}
              {customFields.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <p className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">
                    Extended Master Attributes
                  </p>
                  {customFields.map((field) => (
                    <DynamicFormField
                      key={field.id}
                      field={field}
                      value={formData.custom_attributes[field.field_key]}
                      onChange={handleCustomFieldChange}
                    />
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Submit Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}