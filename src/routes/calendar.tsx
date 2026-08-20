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
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  X, 
  Trash2, 
  ShieldAlert,
  Sparkles,
  Share2
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarView,
});

// Clean, Zero-Dependency Platform Icons
function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg className={`${className} text-pink-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={`${className} text-blue-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect width="4" height="12" x="2" y="9"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg className={`${className} text-indigo-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg className={`${className} text-red-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
          <polygon points="10 15 15 12 10 9 10 15"/>
        </svg>
      );
    default:
      return <Share2 className={`${className} text-slate-400`} />;
  }
}

function CalendarView() {
  const { user, role, canCreate, canDelete, canApprove, canDirectSchedule } = useAppShell();
  const [posts, setPosts] = useState<ContentPostRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activePlatformFilter, setActivePlatformFilter] = useState<'all' | 'instagram' | 'linkedin' | 'facebook' | 'youtube'>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'draft' | 'pending_approval' | 'scheduled' | 'published'>('all');

  // New Post Form State
  const [formData, setFormData] = useState({
    title: '',
    platform: 'instagram' as ContentPostRecord['platform'],
    campaign_id: '',
    copy_body: '',
    media_type: 'single_image' as ContentPostRecord['media_type'],
    scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    status: 'draft' as ContentPostRecord['status'],
  });

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
      if (fetchedCamps.length > 0 && !formData.campaign_id) {
        setFormData(prev => ({ ...prev, campaign_id: fetchedCamps[0].id }));
      }
    } catch (e) {
      console.error('Error fetching calendar data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Strict state assignment based on active user's approval authority
    let initialStatus: ContentPostRecord['status'] = formData.status;
    if (!canApprove('content_calendar') && initialStatus === 'scheduled') {
      initialStatus = 'pending_approval'; // Trigger rule enforcement
    }

    await marketFlowClient.createContentPost({
      title: formData.title,
      platform: formData.platform,
      campaign_id: formData.campaign_id || undefined,
      copy_body: formData.copy_body,
      media_type: formData.media_type,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      status: initialStatus,
      author_id: user.id,
      approved_by: (canApprove('content_calendar') && initialStatus === 'scheduled') ? user.id : null,
      custom_attributes: {},
    });

    setIsModalOpen(false);
    setFormData({
      title: '',
      platform: 'instagram',
      campaign_id: campaigns[0]?.id || '',
      copy_body: '',
      media_type: 'single_image',
      scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      status: 'draft',
    });
    await loadData();
  };

  const handleStatusTransition = async (postId: string, newStatus: ContentPostRecord['status']) => {
    if ((newStatus === 'approved' || newStatus === 'scheduled') && !canApprove('content_calendar')) {
      alert('Security Protection: Only Campaign Managers or Workspace Admins can approve and schedule content directly.');
      return;
    }

    await marketFlowClient.updatePostStatus(
      postId, 
      newStatus, 
      (newStatus === 'approved' || newStatus === 'scheduled') ? user.id : undefined
    );
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!canDelete('content_calendar')) return;
    if (confirm('Soft delete this post from the calendar pipeline?')) {
      await marketFlowClient.deleteRecord('content_posts', id);
      await loadData();
    }
  };

  const filteredPosts = posts.filter(p => {
    if (p.deleted_at) return false;
    const matchPlatform = activePlatformFilter === 'all' || p.platform === activePlatformFilter;
    const matchStatus = activeStatusFilter === 'all' || p.status === activeStatusFilter;
    return matchPlatform && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header with Role Gate Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Master Content Calendar & State Machine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Omnichannel content pipeline with multi-stage approval enforcement ({role.replace('_', ' ')} session active).
          </p>
        </div>

        {canCreate('content_calendar') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Draft Post</span>
          </button>
        )}
      </div>

      {/* 2. Platform & State Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Platform Pills */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'instagram', 'linkedin', 'facebook', 'youtube'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatformFilter(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize flex items-center gap-1.5 ${
                activePlatformFilter === p
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {p !== 'all' && <PlatformIcon platform={p} className="h-3.5 w-3.5" />}
              <span>{p === 'all' ? 'All Platforms' : p}</span>
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">State:</span>
          <select
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All States</option>
            <option value="draft">Drafts</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* 3. Content Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.map((post) => {
          const isPending = post.status === 'pending_approval';
          const isDraft = post.status === 'draft';
          const isScheduled = post.status === 'scheduled';

          return (
            <div
              key={post.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg shadow-black/20"
            >
              <div className="space-y-3">
                {/* Platform & Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-950 text-slate-200 border border-slate-800 tracking-wider">
                    <PlatformIcon platform={post.platform} className="h-3.5 w-3.5" />
                    <span>{post.platform}</span>
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                      isScheduled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isPending
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : post.status === 'published'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {post.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Title & Copy Body Preview */}
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{post.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {post.copy_body || 'No copy description attached.'}
                  </p>
                </div>

                {/* Scheduled Pacing Info */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : 'Unscheduled'}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                    {post.media_type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* State Transition Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {isDraft && (
                  <button
                    onClick={() => handleStatusTransition(post.id, 'pending_approval')}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs transition border border-indigo-500/30"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit for Review
                  </button>
                )}

                {isPending && canApprove('content_calendar') && (
                  <button
                    onClick={() => handleStatusTransition(post.id, 'scheduled')}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Authorize & Schedule
                  </button>
                )}

                {isPending && !canApprove('content_calendar') && (
                  <div className="text-[11px] text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Pending Manager Sign-off
                  </div>
                )}

                {isScheduled && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" /> Scheduled for Broadcast
                  </div>
                )}

                {canDelete('content_calendar') && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 transition"
                    title="Soft delete post"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Create Post Modal with RBAC Schedule Controls */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Create Social Post</h3>
                <p className="text-xs text-slate-400">Omnichannel publishing with stage approval</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Post Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Growth Case Study Breakdown"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Publishing Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Asset Format</label>
                  <select
                    value={formData.media_type}
                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="single_image">Single Image</option>
                    <option value="carousel">Carousel (Multi-Slide)</option>
                    <option value="video_reel">Reel / Short Video</option>
                    <option value="article">Long-Form Article</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parent Campaign</label>
                <select
                  value={formData.campaign_id}
                  onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Standalone (No Campaign) --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.channel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Copy / Post Caption</label>
                <textarea
                  rows={3}
                  placeholder="Write post content, hashtags, and call-to-action link..."
                  value={formData.copy_body}
                  onChange={(e) => setFormData({ ...formData, copy_body: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Workflow State</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Draft (Work in progress)</option>
                    <option value="pending_approval">Submit for Review</option>
                    {canDirectSchedule && (
                      <option value="scheduled">Direct Schedule (Authorized)</option>
                    )}
                  </select>
                </div>
              </div>

              {!canDirectSchedule && formData.status === 'scheduled' && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Your role will automatically route this post to 'Pending Approval' for manager review.</span>
                </p>
              )}

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
                  Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}