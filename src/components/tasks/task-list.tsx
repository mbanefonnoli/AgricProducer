"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, CheckCircle2, Clock, Circle } from "lucide-react";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'done';
    priority: 'low' | 'normal' | 'high';
    due_date: string | null;
    created_at: string;
    assigned_to: string | null;
    assignee_name?: string | null;
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface TaskListProps {
    tasks: Task[];
    isOwner: boolean;
    onRefresh: () => void;
}

const statusConfig = {
    pending: { label: 'Pending', icon: Circle, className: 'bg-slate-100 text-slate-600' },
    in_progress: { label: 'In Progress', icon: Clock, className: 'bg-blue-100 text-blue-700' },
    done: { label: 'Done', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
};

const priorityConfig = {
    low: { label: 'Low', className: 'bg-slate-100 text-slate-500' },
    normal: { label: 'Normal', className: 'bg-yellow-100 text-yellow-700' },
    high: { label: 'High', className: 'bg-red-100 text-red-700' },
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDirection }) {
    if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-slate-400 inline" />;
    return sortDir === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />
        : <ChevronDown className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />;
}

export function TaskList({ tasks, isOwner, onRefresh }: TaskListProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>('asc');
    const supabase = createBrowserClient();

    const toggleSelectAll = () => {
        if (selected.size === tasks.length) setSelected(new Set());
        else setSelected(new Set(tasks.map(t => t.id)));
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!sortField) return 0;
        const statusOrder = { pending: 0, in_progress: 1, done: 2 };
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        let aVal: any, bVal: any;
        switch (sortField) {
            case 'title': aVal = a.title.toLowerCase(); bVal = b.title.toLowerCase(); break;
            case 'status': aVal = statusOrder[a.status]; bVal = statusOrder[b.status]; break;
            case 'priority': aVal = priorityOrder[a.priority]; bVal = priorityOrder[b.priority]; break;
            case 'due_date': aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity; bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity; break;
            case 'created_at': aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
            default: return 0;
        }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        setLoadingId(taskId);
        try {
            const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
            if (error) throw error;
            toast.success("Task updated");
            onRefresh();
        } catch {
            toast.error("Failed to update task");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete selected tasks? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('tasks').delete().in('id', Array.from(selected));
            if (error) throw error;
            toast.success("Tasks deleted");
            setSelected(new Set());
            onRefresh();
        } catch {
            toast.error("Failed to delete tasks");
        } finally {
            setDeleting(false);
        }
    };

    const thSort = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 select-none";
    const colSpanCount = isOwner ? 7 : 6;

    return (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            {selected.size > 0 && (
                <div className="bg-slate-50 p-2 flex justify-end border-b border-slate-200">
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete Selected ({selected.size})
                    </button>
                </div>
            )}
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 w-10">
                            <input
                                type="checkbox"
                                checked={tasks.length > 0 && selected.size === tasks.length}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th className={thSort} onClick={() => handleSort('title')}>
                            <span className="flex items-center">Task <SortIcon field="title" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        <th className={thSort} onClick={() => handleSort('status')}>
                            <span className="flex items-center">Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        <th className={thSort} onClick={() => handleSort('priority')}>
                            <span className="flex items-center">Priority <SortIcon field="priority" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        {isOwner && (
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Assigned To</th>
                        )}
                        <th className={thSort} onClick={() => handleSort('due_date')}>
                            <span className="flex items-center">Due Date <SortIcon field="due_date" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Update Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {sortedTasks.map((task) => {
                        const status = statusConfig[task.status];
                        const priority = priorityConfig[task.priority];
                        const StatusIcon = status.icon;
                        const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

                        return (
                            <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(task.id)}
                                        onChange={() => toggleSelect(task.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="text-sm font-medium text-slate-900">{task.title}</div>
                                    {task.description && (
                                        <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{task.description}</div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {status.label}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${priority.className}`}>
                                        {priority.label}
                                    </span>
                                </td>
                                {isOwner && (
                                    <td className="px-4 py-4 text-sm text-slate-600">
                                        {task.assignee_name || <span className="text-slate-400">Unassigned</span>}
                                    </td>
                                )}
                                <td className={`px-4 py-4 text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="text-slate-400">—</span>}
                                    {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    {loadingId === task.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin ml-auto text-slate-400" />
                                    ) : (
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                                            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {tasks.length === 0 && (
                        <tr>
                            <td colSpan={colSpanCount} className="px-4 py-10 text-center text-sm text-slate-500">
                                No tasks found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
