-- Fix: infinite recursion in tasks RLS policies
--
-- Tasks policies use "SELECT employer_id FROM public.producers WHERE id = auth.uid()"
-- which triggers producers RLS → which triggers itself → infinite loop.
-- Replace those subqueries with the get_my_employer_id() security definer function
-- created in migration 0003.

-- ── tasks SELECT ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view relevant tasks" ON public.tasks;
CREATE POLICY "Users can view relevant tasks" ON public.tasks
    FOR SELECT USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
        OR producer_id = public.get_my_employer_id()
    );

-- ── tasks INSERT ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        producer_id = auth.uid()
        OR producer_id = public.get_my_employer_id()
    );
