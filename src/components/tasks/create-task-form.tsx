"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface Employee {
    id: string;
    name: string;
    surname: string | null;
}

interface CreateTaskFormProps {
    producerId: string;
    employees: Employee[];
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateTaskForm({ producerId, employees, onSuccess, onCancel }: CreateTaskFormProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
    const [assignedTo, setAssignedTo] = useState("");
    const [dueDate, setDueDate] = useState("");
    const supabase = createBrowserClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('tasks').insert({
                producer_id: producerId,
                title: title.trim(),
                description: description.trim() || null,
                priority,
                assigned_to: assignedTo || null,
                due_date: dueDate || null,
                status: 'pending',
            } as any);
            if (error) throw error;
            toast.success("Task created successfully");
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";
    const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-900">Create New Task</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClass}>Title *</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Water the south field"
                    />
                </div>

                <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={inputClass + " resize-none h-20"}
                        placeholder="Optional details..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                            className={inputClass}
                        >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className={inputClass}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {employees.length > 0 && (
                    <div>
                        <label className={labelClass}>Assign To</label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name}{emp.surname ? ` ${emp.surname}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Create Task
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 border border-slate-200 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
