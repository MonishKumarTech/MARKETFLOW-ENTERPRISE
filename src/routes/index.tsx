import React, { useState, useEffect } from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { 
  marketFlowClient, 
  CampaignRecord, 
  LeadRecord, 
  ContentPostRecord 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { TelemetryCard } from '@/components/telemetry-card';
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user, role, canView } = useAppShell();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [posts, setPosts] = useState<ContentPostRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [fetchedCampaigns, fetchedLeads, fetchedPosts] = await Promise.all([
        marketFlowClient.getCampaigns(),
        marketFlowClient.getLeads(),
        marketFlowClient.getContentPosts(),
      ]);
      setCampaigns(fetchedCampaigns || []);
      setLeads(fetchedLeads || []);
      setPosts(fetchedPosts || []);
    } catch (e) {
      console.error('Error fetching dashboard telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = marketFlowClient.calculateAttributionMetrics(campaigns, leads);

  // Group performance by channel
  const channelBreakdown = React.useMemo(() => {
    const channels = ['facebook', 'google', 'linkedin', 'instagram', 'youtube'] as const;
    return channels.map(ch => {
      const channelCamps = campaigns.filter(c => c.channel === ch && !c.deleted_at);
      const spend = channelCamps.reduce((sum, c) => sum + Number(c.actual_spend || 0), 0);
      const budget = channelCamps.reduce((sum, c) => sum + Number(c.total_budget || 0), 0);
      const channelLeads = leads.filter(l => l.source_platform === ch && !l.deleted_at);
      const revenue = channelLeads
        .filter(l => l.pipeline_stage === 'customer_won' || l.pipeline_stage === 'converted')
        .reduce((sum, l) => sum + Number(l.deal_value || 0), 0);
      const cpl = channelLeads.length > 0 ? (spend / channelLeads.length).toFixed(2) : '0.00';
      const roas = spend > 0 ? (revenue / spend).toFixed(2) : '0.00';

      return {
        channel: ch,
        campaignsCount: channelCamps.length,
        spend,
        budget,
        leadsCount: channelLeads.length,
        revenue,
        cpl,
        roas,
      };
    }).filter(ch => ch.campaignsCount > 0 || ch.leadsCount > 0);
  }, [campaigns, leads]);

  const pendingApprovalsCount = posts.filter(p => p.status === 'pending_approval' && !p.deleted_at).length;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Enterprise Command Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Welcome back, <span className="font-semibold text-slate-200">{user.name}</span>. Real-time multi-touch attribution & budget pacing active.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {pendingApprovalsCount > 0 && canView('content_calendar') && (
            <Link
              to={'/calendar' as any}
              className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{pendingApprovalsCount} Approvals</span>
            </Link>
          )}
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Telemetry Grid (Even 2-col on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <TelemetryCard
          title="Total Ad Spend"
          value={metrics.totalSpend}
          subtitle={`Pacing: ${metrics.budgetPacing}% of $${metrics.totalBudget.toLocaleString()} cap`}
          change={+6.8}
          changeLabel="vs target allocation"
          icon={DollarSign}
          variant="indigo"
          isCurrency={true}
        />
        <TelemetryCard
          title="Blended CPL"
          value={metrics.blendedCPL}
          subtitle={`${metrics.totalLeadsCount} qualified leads`}
          change={-12.4}
          changeLabel="improvement vs last week"
          icon={Target}
          variant="emerald"
          isCurrency={true}
        />
        <TelemetryCard
          title="Won Deal Pipeline"
          value={metrics.totalPipelineRevenue}
          subtitle={`${metrics.totalConversions} closed contracts`}
          change={+18.5}
          changeLabel="YoY revenue growth"
          icon={TrendingUp}
          variant="purple"
          isCurrency={true}
        />
        <TelemetryCard
          title="Realized ROAS"
          value={`${metrics.roas}x`}
          subtitle={`Blended CAC: $${metrics.blendedCAC}`}
          change={+0.4}
          changeLabel="vs 2.0x target threshold"
          icon={PieChart}
          variant="amber"
        />
      </div>

      {/* 3. Operational Overview & Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Channel Attribution Matrix (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Paid Media & Attribution Matrix</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Aggregated channel performance, spend allocation and realized ROAS</p>
            </div>
            {canView('campaigns') && (
              <Link
                to={'/campaigns' as any}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-2"
              >
                <span className="hidden sm:inline">View All</span> <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Platform</th>
                  <th className="py-2.5 sm:py-3 px-2.5 text-right">Spend</th>
                  <th className="py-2.5 sm:py-3 px-2.5 text-right">Leads</th>
                  <th className="py-2.5 sm:py-3 px-2.5 text-right">CPL</th>
                  <th className="py-2.5 sm:py-3 px-2.5 text-right">Won Rev</th>
                  <th className="py-2.5 sm:py-3 px-3 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {channelBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 text-xs">
                      No active channel telemetry data recorded.
                    </td>
                  </tr>
                ) : (
                  channelBreakdown.map((item) => (
                    <tr key={item.channel} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 sm:px-4">
                        <span className="font-bold text-slate-200 capitalize block">{item.channel}</span>
                        <span className="text-[10px] text-slate-400 block">{item.campaignsCount} campaigns</span>
                      </td>
                      <td className="py-3 px-2.5 text-right font-semibold text-slate-200">
                        ${item.spend.toLocaleString()}
                      </td>
                      <td className="py-3 px-2.5 text-right font-medium text-slate-300">
                        {item.leadsCount}
                      </td>
                      <td className="py-3 px-2.5 text-right font-semibold text-emerald-400">
                        ${item.cpl}
                      </td>
                      <td className="py-3 px-2.5 text-right font-medium text-slate-200">
                        ${item.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {item.roas}x
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Pipeline & Quick Queue (1 Col) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Content Pipeline</h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Upcoming assets & approval state</p>
              </div>
              {canView('content_calendar') && (
                <Link
                  to={'/calendar' as any}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-2"
                >
                  <span className="hidden sm:inline">Calendar</span> <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
              {posts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No scheduled content posts.</p>
              ) : (
                posts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5 sm:space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 tracking-wider">
                        {post.platform}
                      </span>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          post.status === 'scheduled'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : post.status === 'pending_approval'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {post.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 line-clamp-1">{post.title}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Unscheduled Draft'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Dynamic RBAC Security:</span>
              <span className="font-semibold text-indigo-400 capitalize">{role.replace('_', ' ')} Node</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}