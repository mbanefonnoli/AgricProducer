import Link from "next/link";
import { FinancialSummary } from "@/components/finances/financial-summary";
import { InventoryTable } from "@/components/inventory/inventory-table";
import {
    Package, TrendingUp, ClipboardList, Circle, Clock,
    CheckCircle2, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Plus
} from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const supabase = createServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    const producerId = session?.user?.id;

    // Fetch producer profile (includes role)
    const { data: producer } = await supabase
        .from('producers')
        .select('name, surname, role, employer_id')
        .eq('id', producerId)
        .single();

    const isEmployee = producer?.role === 'employee';
    const ownerId = isEmployee ? producer?.employer_id : producerId;

    // Fetch top stock items
    const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('producer_id', ownerId || producerId)
        .order('last_updated', { ascending: false })
        .limit(5);

    const stockItems = (inventory as any[])?.map(item => ({
        id: item.id,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit: item.unit,
        last_updated: item.last_updated,
        last_reason: item.last_reason ?? '',
        buying_price: item.buying_price,
        selling_price: item.selling_price,
    })) || [];

    // Fetch pending/in-progress tasks
    const tasksQuery = isEmployee
        ? supabase.from('tasks').select('id, title, status, priority, due_date').eq('assigned_to', producerId).neq('status', 'done').order('due_date', { ascending: true }).limit(5)
        : supabase.from('tasks').select('id, title, status, priority, due_date, assignee:assigned_to(name)').eq('producer_id', producerId).neq('status', 'done').order('created_at', { ascending: false }).limit(5);

    const { data: pendingTasks } = await tasksQuery;
    const tasks = (pendingTasks as any[]) || [];

    // Fetch recent transactions for activity feed
    const { data: recentTxns } = await supabase
        .from('transactions')
        .select('id, type, category, amount, description, created_at')
        .eq('producer_id', ownerId || producerId)
        .order('created_at', { ascending: false })
        .limit(4);

    const txns = (recentTxns as any[]) || [];

    // Build unified activity feed
    const activityFeed = [
        ...txns.map(t => ({
            id: t.id,
            type: 'transaction' as const,
            label: t.type === 'income' ? `Income: ${t.category}` : `Expense: ${t.category}`,
            sub: t.description || `€${Number(t.amount).toLocaleString()}`,
            date: t.created_at,
            isIncome: t.type === 'income',
        })),
        ...stockItems.slice(0, 2).map(item => ({
            id: item.id + '-stock',
            type: 'stock' as const,
            label: `Stock update: ${item.product_name}`,
            sub: `${item.quantity} ${item.unit}`,
            date: item.last_updated,
            isIncome: null,
        })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const priorityColors = {
        high: 'text-red-600 bg-red-50',
        normal: 'text-yellow-600 bg-yellow-50',
        low: 'text-slate-500 bg-slate-100',
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    {producer
                        ? `${producer.name}${producer.surname ? ' ' + producer.surname : ''}'s Dashboard`
                        : "Dashboard"}
                </h1>
                <p className="text-slate-500">
                    Welcome back, <span className="font-semibold text-slate-900">{producer?.name || "Farmer"}</span>! Here's an overview of your farm's operations.
                </p>
            </div>

            {/* Financial Summary — hidden from employees */}
            {!isEmployee && <FinancialSummary />}

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Critical Stock */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                            <Package className="h-5 w-5 text-slate-400" />
                            Critical Stock
                        </h2>
                        <Link href="/inventory" className="text-sm text-indigo-600 hover:underline">View all</Link>
                    </div>
                    <InventoryTable items={stockItems} />
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-slate-400" />
                        Recent Activity
                    </h2>
                    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
                        {activityFeed.length > 0 ? activityFeed.map((item) => (
                            <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'transaction' ? (item.isIncome ? 'bg-green-100' : 'bg-red-100') : 'bg-slate-100'}`}>
                                    {item.type === 'transaction'
                                        ? (item.isIncome
                                            ? <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                            : <ArrowDownCircle className="h-4 w-4 text-red-500" />)
                                        : <Package className="h-4 w-4 text-slate-500" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                                    <p className="text-xs text-slate-500">{item.sub} · {new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500 text-center py-4">No recent activity found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tasks Overview */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-slate-400" />
                        {isEmployee ? 'My Pending Tasks' : 'Active Tasks'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <Link href="/tasks" className="text-sm text-indigo-600 hover:underline">View all</Link>
                        <Link
                            href="/tasks"
                            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Task
                        </Link>
                    </div>
                </div>

                {tasks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tasks.map((task: any) => {
                            const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                            return (
                                <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <p className="text-sm font-semibold text-slate-900 leading-tight">{task.title}</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {task.status === 'in_progress' ? <Clock className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                            {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                        </span>
                                        {task.due_date && (
                                            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                                                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    {!isEmployee && task.assignee?.name && (
                                        <p className="text-xs text-slate-400 mt-1.5">→ {task.assignee.name}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border bg-white p-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-600">All caught up! No pending tasks.</p>
                        <Link href="/tasks" className="text-xs text-indigo-500 hover:underline mt-1 inline-block">Create a task →</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
