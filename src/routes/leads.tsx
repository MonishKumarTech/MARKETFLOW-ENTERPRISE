import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  marketFlowClient, 
  LeadRecord, 
  CampaignRecord 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { 
  Users, 
  Plus, 
  DollarSign, 
  Target, 
  TrendingUp, 
  X, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  XCircle,
  Building,
  Mail,
  Tag
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leads',
  component: LeadsView,
});

const PIPELINE_STAGES: { key: LeadRecord['pipeline_stage']; label: string; badgeColor: string }[] = [
  { key: 'new', label: 'New Inbound', badgeColor: 'bg-slate-800 text-slate-300' },
  { key: 'contacted', label: 'Contacted', badgeColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  { key: 'qualified', label: 'Qualified', badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  { key: 'mql', label: 'MQL (Marketing)', badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  { key: 'sql', label: 'SQL (Sales)', badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  { key: 'proposal', label: 'Proposal Sent', badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  { key: 'negotiation', label: 'In Negotiation', badgeColor: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  { key: 'customer_won', label: 'Customer Won 🎉', badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' },
  { key: 'lost', label: 'Lost / Disqualified', badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
];

function LeadsView() {
  const { user, canCreate, canEdit, canDelete } = useAppShell();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State for Ingesting a Lead
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    source_platform: 'google',
    campaign_id: '',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'enterprise_search',
    pipeline_stage: 'new' as LeadRecord['pipeline_stage'],
    deal_value: 5000,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedLeads, fetchedCamps] = await Promise.all([
        marketFlowClient.getLeads(),
        marketFlowClient.getCampaigns(),
      ]);
      setLeads(fetchedLeads);
      setCampaigns(fetchedCamps);
      if (fetchedCamps.length > 0 && !formData.campaign_id) {
        setFormData(prev => ({ ...prev, campaign_id: fetchedCamps[0].id }));
      }
    } catch (e) {
      console.error('Error fetching CRM leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) return;

    const newLead: LeadRecord = {
      id: `f0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`,
      full_name: formData.full_name,
      email: formData.email,
      company: formData.company || undefined,
      source_platform: formData.source_platform,
      campaign_id: formData.campaign_id || undefined,
      utm_source: formData.utm_source,
      utm_medium: formData.utm_medium,
      utm_campaign: formData.utm_campaign,
      pipeline_stage: formData.pipeline_stage,
      deal_value: Number(formData.deal_value),
      custom_attributes: {},
      created_at: new Date().toISOString(),
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    setIsModalOpen(false);
    setFormData({
      full_name: '',
      email: '',
      company: '',
      source_platform: 'google',
      campaign_id: campaigns[0]?.id || '',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'enterprise_search',
      pipeline_stage: 'new',
      deal_value: 5000,
    });
  };

  const handleStageChange = async (leadId: string, newStage: LeadRecord['pipeline_stage']) => {
    if (!canEdit('leads')) return;
    const updated = leads.map(l => l.id === leadId ? { ...l, pipeline_stage: newStage } : l);
    setLeads(updated);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete('leads')) return;
    if (confirm('Soft delete this lead from attribution CRM?')) {
      await marketFlowClient.deleteRecord('leads_attribution', id);
      await loadData();
    }
  };

  // Pipeline Financial Computations
  const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
  const wonLeads = leads.filter(l => l.pipeline_stage === 'customer_won' || l.pipeline_stage === 'converted');
  const wonRevenue = wonLeads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
  const conversionRate = leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : '0';

  const filteredLeads = leads.filter(l => {
    if (l.deleted_at) return false;
    const matchStage = stageFilter === 'all' || l.pipeline_stage === stageFilter;
    const matchQuery = 
      l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStage && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Leads & Multi-Touch UTM Attribution
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            CRM pipeline lifecycle, UTM source parameters, conversion telemetry, and closed contract revenue.
          </p>
        </div>

        {canCreate('leads') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Ingest Inbound Lead</span>
          </button>
        )}
      </div>

      {/* 2. Conversion Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Active Pipeline</p>
            <h3 className="text-xl font-extrabold text-white mt-1">${totalPipelineValue.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Won Contract Revenue</p>
            <h3 className="text-xl font-extrabold text-emerald-400 mt-1">${wonRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Conversion Velocity</p>
            <h3 className="text-xl font-extrabold text-white mt-1">{conversionRate}%</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Target className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <input
          type="text"
          placeholder="Search by lead name, work email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Stage Filter:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Lifecycle Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Leads Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">Lead & Organization</th>
              <th className="py-3.5 px-3">UTM Channel & Campaign</th>
              <th className="py-3.5 px-3">Lifecycle Pipeline Stage</th>
              <th className="py-3.5 px-3 text-right">Deal Value</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLeads.map((lead) => {
              const matchedCamp = campaigns.find(c => c.id === lead.campaign_id);
              const stageMeta = PIPELINE_STAGES.find(s => s.key === lead.pipeline_stage) || PIPELINE_STAGES[0];

              return (
                <tr key={lead.id} className="hover:bg-slate-800/20 transition">
                  {/* Lead Info */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-xs">{lead.full_name}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-500" />
                        {lead.email}
                      </p>
                      {lead.company && (
                        <p className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                          <Building className="h-3 w-3 text-indigo-400" />
                          {lead.company}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* UTM Attribution */}
                  <td className="py-4 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                          {lead.source_platform}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          medium: <strong className="text-slate-300">{lead.utm_medium || 'direct'}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Tag className="h-3 w-3 text-slate-500" />
                        <span>{matchedCamp ? matchedCamp.name : lead.utm_campaign || 'General Inbound'}</span>
                      </p>
                    </div>
                  </td>

                  {/* Stage Dropdown */}
                  <td className="py-4 px-3">
                    {canEdit('leads') ? (
                      <select
                        value={lead.pipeline_stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${stageMeta.badgeColor}`}>
                        {stageMeta.label}
                      </span>
                    )}
                  </td>

                  {/* Deal Value */}
                  <td className="py-4 px-3 text-right">
                    <span className="font-extrabold text-slate-100 text-sm">
                      ${Number(lead.deal_value || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-center">
                    {canDelete('leads') && (
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 transition"
                        title="Soft delete lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Ingest Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Ingest Inbound Lead</h3>
                <p className="text-xs text-slate-400">Record prospect contact info, deal value, and UTM origins</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Rigby"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. erigby@enterprise.co"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rigby Global Dynamics"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estimated Deal Value ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.deal_value}
                    onChange={(e) => setFormData({ ...formData, deal_value: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Source Channel</label>
                  <select
                    value={formData.source_platform}
                    onChange={(e) => setFormData({ ...formData, source_platform: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="google">Google Search (CPC)</option>
                    <option value="facebook">Meta / Paid Social</option>
                    <option value="linkedin">LinkedIn Ads</option>
                    <option value="instagram">Instagram Ads</option>
                    <option value="organic">Organic Inbound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lifecycle Stage</label>
                  <select
                    value={formData.pipeline_stage}
                    onChange={(e) => setFormData({ ...formData, pipeline_stage: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parent Campaign Association</label>
                <select
                  value={formData.campaign_id}
                  onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- General Inbound (No Paid Campaign) --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.channel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  Ingest Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
