-- Tasks table for employee task management

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES public.producers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'done')) DEFAULT 'pending' NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'normal', 'high')) DEFAULT 'normal' NOT NULL,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Owner can see all tasks under their account
-- Employees can see tasks assigned to them OR tasks under their employer
CREATE POLICY "Users can view relevant tasks" ON public.tasks
    FOR SELECT USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
        OR producer_id IN (
            SELECT employer_id FROM public.producers WHERE id = auth.uid() AND employer_id IS NOT NULL
        )
    );

-- Owner can insert tasks (producer_id = own id)
-- Employee can insert tasks under their employer's producer_id
CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        producer_id = auth.uid()
        OR producer_id IN (
            SELECT employer_id FROM public.producers WHERE id = auth.uid() AND employer_id IS NOT NULL
        )
    );

-- Owner can update all their tasks; assigned employee can update status
CREATE POLICY "Users can update relevant tasks" ON public.tasks
    FOR UPDATE USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
    );

-- Owner or assigned employee can delete tasks
CREATE POLICY "Users can delete relevant tasks" ON public.tasks
    FOR DELETE USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
    );
