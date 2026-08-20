import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  marketFlowClient, 
  ContentPostRecord, 
  CampaignRecord 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { 
  CheckCircle2, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  DollarSign,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/approvals',
  component: ApprovalsView,
});

function ApprovalsView() {
  const { user, canApprove } = useAppShell();
  const [posts, setPosts] = useState<ContentPostRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'campaigns'>('posts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPosts, fetchedCamps] = await Promise.all([
        marketFlowClient.getContentPosts(),
        marketFlowClient.getCampaigns(),
      ]);
      setPosts(fetchedPosts);
      setCampaigns(fetchedCamps);
    } catch (e) {
      console.error('Error fetching approvals queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (postId: string) => {
    if (!canApprove('content_calendar')) return;
    await marketFlowClient.updatePostStatus(postId, 'scheduled', user.id);
    await loadData();
  };

  const handleRejectPost = async (postId: string) => {
    if (!canApprove('content_calendar')) return;
    await marketFlowClient.updatePostStatus(postId, 'rejected', user.id);
    await loadData();
  };

  const handleApproveCampaign = async (campId: string) => {
    if (!canApprove('campaigns')) return;
    const updated = campaigns.map(c => 
      c.id === campId ? { ...c, approval_status: 'approved' as const, approved_by: user.id } : c
    );
    setCampaigns(updated);
  };

  const handleRejectCampaign = async (campId: string) => {
    if (!canApprove('campaigns')) return;
    const updated = campaigns.map(c => 
      c.id === campId ? { ...c, approval_status: 'rejected' as const } : c
    );
    setCampaigns(updated);
  };

  const pendingPosts = posts.filter(p => p.status === 'pending_approval' && !p.deleted_at);
  const pendingCampaigns = campaigns.filter(c => c.approval_status === 'pending_review' && !c.deleted_at);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Approvals & Decision Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized queue for creative content broadcasting and paid media budget PO authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'posts'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Creative Posts ({pendingPosts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'campaigns'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Budget POs ({pendingCampaigns.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Creative Posts Approval List */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {pendingPosts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">All Clear! No Pending Post Submissions</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All creative posts have been approved and scheduled into the production pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg shadow-black/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-950 text-indigo-400 border border-slate-800">
                        {post.platform}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Awaiting Review
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{post.title}</h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                        {post.copy_body}
                      </p>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Target Publish Date:</span>
                      <span className="font-semibold text-slate-200">
                        {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : 'Unscheduled'}
                      </span>
                    </div>
                  </div>

                  {canApprove('content_calendar') ? (
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => handleRejectPost(post.id)}
                        className="w-1/2 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 font-bold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprovePost(post.id)}
                        className="w-1/2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve & Schedule
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> View Only (Requires Manager / Admin Authority)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Budget PO Approvals List */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {pendingCampaigns.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">All Budget POs Cleared</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active campaign purchase orders are pending executive sign-off.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg shadow-black/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-950 text-indigo-400 border border-slate-800">
                        {camp.channel}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending PO Release
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{camp.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Requested Cap: <strong className="text-white">${Number(camp.total_budget).toLocaleString()}</strong> (${camp.daily_budget}/day)
                      </p>
                    </div>
                  </div>

                  {canApprove('campaigns') ? (
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => handleRejectCampaign(camp.id)}
                        className="w-1/2 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 font-bold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" /> Decline PO
                      </button>
                      <button
                        onClick={() => handleApproveCampaign(camp.id)}
                        className="w-1/2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" /> Authorize Budget Release
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Requires Accountant / Manager Approval
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
