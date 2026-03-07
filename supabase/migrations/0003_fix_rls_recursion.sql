-- Fix: infinite recursion in producers RLS policies
--
-- Root cause: "Employees can view employer profile" policy on producers
-- runs a subquery against producers, which re-triggers the same policy → infinite loop.
-- Same subquery pattern in inventory / ledger / transactions policies
-- also causes recursion because they all query producers while producers' RLS is being evaluated.
--
-- Solution: a SECURITY DEFINER function that reads employer_id bypassing RLS,
-- then use that function in every policy that needs it.

CREATE OR REPLACE FUNCTION public.get_my_employer_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT employer_id FROM public.producers WHERE id = auth.uid();
$$;

-- ── producers ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Employees can view employer profile" ON public.producers;
CREATE POLICY "Employees can view employer profile" ON public.producers
    FOR SELECT USING (id = public.get_my_employer_id());

-- ── inventory ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Producers can manage own inventory" ON public.inventory;
CREATE POLICY "Producers can manage own inventory" ON public.inventory
    FOR ALL USING (
        producer_id = auth.uid()
        OR producer_id = public.get_my_employer_id()
    );

-- ── inventory_ledger ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Producers can manage own ledger" ON public.inventory_ledger;
CREATE POLICY "Producers can manage own ledger" ON public.inventory_ledger
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inventory i
            WHERE i.id = inventory_id
            AND (
                i.producer_id = auth.uid()
                OR i.producer_id = public.get_my_employer_id()
            )
        )
    );

-- ── transactions ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Employees can view employer transactions" ON public.transactions;
CREATE POLICY "Employees can view employer transactions" ON public.transactions
    FOR SELECT USING (producer_id = public.get_my_employer_id());
