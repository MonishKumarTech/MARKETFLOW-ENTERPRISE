import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  marketFlowClient, 
  TaskRecord, 
  StaffMemberRecord, 
  CampaignRecord, 
  ContentPostRecord 
} from '@/lib/marketflow-client';
import { useAppShell } from '@/lib/app-shell-context';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertCircle, 
  User, 
  Layers, 
  X, 
  Trash2, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: TasksView,
});

const COLUMNS: { id: TaskRecord['status']; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog Queue', color: 'border-slate-800' },
  { id: 'in_progress', label: 'In Production', color: 'border-indigo-500/40' },
  { id: 'in_review', label: 'Quality & Compliance Review', color: 'border-amber-500/40' },
  { id: 'completed', label: 'Completed & Delivered', color: 'border-emerald-500/40' },
];

function TasksView() {
  const { user, canCreate, canEdit, canDelete } = useAppShell();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffMemberRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [posts, setPosts] = useState<ContentPostRecord[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Task Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskRecord['priority'],
    status: 'backlog' as TaskRecord['status'],
    assigned_to: '',
    related_campaign_id: '',
    related_post_id: '',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedStaff, fetchedCamps, fetchedPosts] = await Promise.all([
        marketFlowClient.getTasks(),
        marketFlowClient.getStaff(),
        marketFlowClient.getCampaigns(),
        marketFlowClient.getContentPosts(),
      ]);
      setTasks(fetchedTasks);
      setStaffList(fetchedStaff);
      setCampaigns(fetchedCamps);
      setPosts(fetchedPosts);
      if (fetchedStaff.length > 0 && !formData.assigned_to) {
        setFormData(prev => ({ ...prev, assigned_to: fetchedStaff[0].id }));
      }
    } catch (e) {
      console.error('Error fetching tasks queue data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await marketFlowClient.createTask({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      assigned_to: formData.assigned_to || user.id,
      related_campaign_id: formData.related_campaign_id || undefined,
      related_post_id: formData.related_post_id || undefined,
      due_date: formData.due_date,
    });

    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'backlog',
      assigned_to: staffList[0]?.id || '',
      related_campaign_id: '',
      related_post_id: '',
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    });
    await loadData();
  };

  const handleStatusShift = async (task: TaskRecord, direction: 'forward' | 'backward') => {
    if (!canEdit('tasks')) return;
    const stages: TaskRecord['status'][] = ['backlog', 'in_progress', 'in_review', 'completed'];
    const currentIndex = stages.indexOf(task.status);
    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < stages.length) {
      const newStatus = stages[nextIndex];
      const updated = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
      setTasks(updated);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete('tasks')) return;
    if (confirm('Soft delete this task from production queue?')) {
      await marketFlowClient.deleteRecord('task_queue', id);
      await loadData();
    }
  };

  const getPriorityBadge = (priority: TaskRecord['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-slate-400">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Production Tasks & Pipeline Queue
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Workforce task allocation, creative deliverable workflows, and stage progress tracking.
          </p>
        </div>

        {canCreate('tasks') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Production Task</span>
          </button>
        )}
      </div>

      {/* 2. Responsive 4-Column Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id && !t.deleted_at);

          return (
            <div
              key={col.id}
              className={`bg-slate-900/40 border ${col.color} rounded-2xl p-4 space-y-3 min-h-[500px] flex flex-col justify-between`}
            >
              <div className="space-y-3">
                {/* Column Title & Count */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-slate-200">{col.label}</span>
                  <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-black flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks Cards List */}
                <div className="space-y-3">
                  {colTasks.map((task) => {
                    const assignee = staffList.find(s => s.id === task.assigned_to);

                    return (
                      <div
                        key={task.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition group shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          {getPriorityBadge(task.priority)}
                          {canDelete('tasks') && (
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white tracking-tight leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {task.due_date || 'No Date'}
                          </span>
                          <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                            <User className="h-3 w-3 text-indigo-400" />
                            {assignee ? assignee.full_name.split(' ')[0] : 'Unassigned'}
                          </span>
                        </div>

                        {/* Fast Shift Buttons */}
                        {canEdit('tasks') && (
                          <div className="pt-2 border-t border-slate-900 flex justify-between gap-1">
                            {col.id !== 'backlog' && (
                              <button
                                onClick={() => handleStatusShift(task, 'backward')}
                                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-400"
                              >
                                ← Prev
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button
                                onClick={() => handleStatusShift(task, 'forward')}
                                className="ml-auto px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-[10px] font-semibold text-indigo-300 hover:text-white transition flex items-center gap-0.5"
                              >
                                <span>Next</span>
                                <ArrowRight className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Create Production Task</h3>
                <p className="text-xs text-slate-400">Delegate tasks to team members across campaigns</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Objective / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design 3 carousel hooks for Meta campaign"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Acceptance Criteria</label>
                <textarea
                  rows={3}
                  placeholder="Detail exact specifications, assets needed, or key references..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assignee</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.role_key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent 🔥</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parent Campaign (Optional)</label>
                  <select
                    value={formData.related_campaign_id}
                    onChange={(e) => setFormData({ ...formData, related_campaign_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- None --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
