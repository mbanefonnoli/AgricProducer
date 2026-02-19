"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { TaskList, Task } from "@/components/tasks/task-list";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { ClipboardList, Plus, CheckCircle2, Clock, Circle } from "lucide-react";
import { toast } from "sonner";

interface Employee {
    id: string;
    name: string;
    surname: string | null;
}

export default function TasksPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const supabase = createBrowserClient();

    const isOwner = profile?.role === 'company';

    const fetchTasks = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            let query;
            if (isOwner) {
                // Company owners see all tasks they created
                query = supabase
                    .from('tasks')
                    .select('*, assignee:assigned_to(name, surname)')
                    .eq('producer_id', profile.id)
                    .order('created_at', { ascending: false });
            } else {
                // Employees see only tasks assigned to them (under employer's producer_id)
                query = supabase
                    .from('tasks')
                    .select('*, assignee:assigned_to(name, surname)')
                    .eq('assigned_to', profile.id)
                    .order('created_at', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;

            const mapped: Task[] = (data || []).map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                due_date: t.due_date,
                created_at: t.created_at,
                assigned_to: t.assigned_to,
                assignee_name: t.assignee ? `${t.assignee.name}${t.assignee.surname ? ' ' + t.assignee.surname : ''}` : null,
            }));
            setTasks(mapped);
        } catch (err: any) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        if (!profile || !isOwner) return;
        const { data } = await supabase
            .from('producers')
            .select('id, name, surname')
            .eq('employer_id', profile.id)
            .eq('role', 'employee');
        setEmployees((data as Employee[]) || []);
    };

    useEffect(() => {
        if (!profileLoading && profile) {
            fetchTasks();
            if (isOwner) fetchEmployees();
        }
    }, [profile, profileLoading]);

    // Stats
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ClipboardList className="h-10 w-10 text-blue-600" />
                        {isOwner ? 'Task Manager' : 'My Tasks'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isOwner ? 'Create and assign tasks to your team.' : 'View and update your assigned tasks.'}
                    </p>
                </div>
                {isOwner && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        New Task
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending', value: pending, icon: Circle, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
                    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                    { label: 'Done', value: done, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                    { label: 'Overdue', value: overdue, icon: ClipboardList, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                            <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div className={`text-3xl font-black ${color}`}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Create Form */}
            {showCreateForm && isOwner && (
                <CreateTaskForm
                    producerId={profile!.id}
                    employees={employees}
                    onSuccess={() => { setShowCreateForm(false); fetchTasks(); }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {/* Task List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        {isOwner ? 'All Tasks' : 'Tasks Assigned to Me'}
                    </h2>
                </div>
                {loading || profileLoading ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Loading tasks...</div>
                ) : (
                    <TaskList
                        tasks={tasks}
                        isOwner={isOwner}
                        onRefresh={fetchTasks}
                    />
                )}
            </div>
        </div>
    );
}
