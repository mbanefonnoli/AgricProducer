"use client";

import { UserCog, CheckCircle2, Clock, Circle, AlertTriangle } from "lucide-react";

export interface Employee {
    id: string;
    name: string;
    surname: string | null;
    produce: string | null;
    created_at: string;
    task_counts: {
        total: number;
        pending: number;
        in_progress: number;
        done: number;
        overdue: number;
    };
}

interface EmployeeListProps {
    employees: Employee[];
}

export function EmployeeList({ employees }: EmployeeListProps) {
    if (employees.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <UserCog className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">No employees yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Employees who register with your exact company name will appear here automatically.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
                const { total, pending, in_progress, done, overdue } = emp.task_counts;
                const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
                const initials = `${emp.name[0]}${emp.surname ? emp.surname[0] : ''}`.toUpperCase();

                return (
                    <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                        {/* Avatar + Identity */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-white font-bold text-sm">{initials}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {emp.name}{emp.surname ? ` ${emp.surname}` : ''}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {emp.produce || 'No specialization set'}
                                </p>
                            </div>
                        </div>

                        {/* Task stats */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">{total} task{total !== 1 ? 's' : ''} total</span>
                                <span className={`font-semibold ${overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {overdue > 0 ? `${overdue} overdue` : 'On track'}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 text-right mt-0.5">{completionRate}% complete</p>
                            </div>

                            {/* Status badges */}
                            {total > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {pending > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                            <Circle className="h-2.5 w-2.5" /> {pending} pending
                                        </span>
                                    )}
                                    {in_progress > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                            <Clock className="h-2.5 w-2.5" /> {in_progress} active
                                        </span>
                                    )}
                                    {done > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> {done} done
                                        </span>
                                    )}
                                    {overdue > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                            <AlertTriangle className="h-2.5 w-2.5" /> {overdue} overdue
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No tasks assigned yet</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                Joined {new Date(emp.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
