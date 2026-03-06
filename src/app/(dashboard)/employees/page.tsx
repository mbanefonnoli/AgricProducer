import { createServerClient } from "@/lib/supabase/server";
import { EmployeeList, Employee } from "@/components/employees/employee-list";
import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
    const supabase = createServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Role guard — employees are redirected away
    const { data: profile } = await supabase
        .from('producers')
        .select('role')
        .eq('id', userId)
        .single();

    if (profile?.role !== 'company') {
        redirect('/');
    }

    // Fetch all employees linked to this owner
    const { data: employees } = await supabase
        .from('producers')
        .select('id, name, surname, produce, created_at')
        .eq('employer_id', userId)
        .eq('role', 'employee')
        .order('name');

    const employeeIds = ((employees as any[]) || []).map((e: any) => e.id);

    // Fetch all tasks assigned to any of the employees in one query
    let tasksByEmployee: Record<string, any[]> = {};
    if (employeeIds.length > 0) {
        const { data: tasks } = await supabase
            .from('tasks')
            .select('assigned_to, status, due_date')
            .in('assigned_to', employeeIds);

        ((tasks as any[]) || []).forEach((t: any) => {
            if (!tasksByEmployee[t.assigned_to]) tasksByEmployee[t.assigned_to] = [];
            tasksByEmployee[t.assigned_to].push(t);
        });
    }

    const now = new Date();
    const employeesWithTasks: Employee[] = ((employees as any[]) || []).map(emp => {
        const tasks = tasksByEmployee[emp.id] || [];
        return {
            id: emp.id,
            name: emp.name,
            surname: emp.surname,
            produce: emp.produce,
            created_at: emp.created_at,
            task_counts: {
                total: tasks.length,
                pending: tasks.filter((t: any) => t.status === 'pending').length,
                in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
                done: tasks.filter((t: any) => t.status === 'done').length,
                overdue: tasks.filter((t: any) =>
                    t.due_date && t.status !== 'done' && new Date(t.due_date) < now
                ).length,
            },
        };
    });

    const totalTasks = employeesWithTasks.reduce((sum, e) => sum + e.task_counts.total, 0);
    const totalOverdue = employeesWithTasks.reduce((sum, e) => sum + e.task_counts.overdue, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <UserCog className="h-10 w-10 text-blue-600" />
                    Team
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Manage your workforce and monitor task progress.
                </p>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Employees', value: employeesWithTasks.length, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
                    { label: 'Active Tasks', value: totalTasks, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
                    { label: 'Overdue', value: totalOverdue, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className={`text-3xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Info banner */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-3.5 text-sm text-blue-700">
                <strong>How employees join:</strong> When a new user registers and selects "Employee" with your exact company name, they are automatically linked to your account.
            </div>

            <EmployeeList employees={employeesWithTasks} />
        </div>
    );
}
