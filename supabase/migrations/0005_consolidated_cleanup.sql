-- ═══════════════════════════════════════════════════════════════════════════
-- CONSOLIDATED CLEANUP SCRIPT
-- Safe to run on the current Supabase state.
-- Removes duplicate/recursive policies, creates missing table/columns.
-- Requires get_my_employer_id() function (already exists in your DB).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. ENSURE MISSING COLUMNS EXIST ───────────────────────────────────────

-- employer_id on producers (links employees to their company owner)
ALTER TABLE public.producers
    ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.producers(id) ON DELETE SET NULL;

-- transaction_id on inventory_ledger (optional link to a financial transaction)
ALTER TABLE public.inventory_ledger
    ADD COLUMN IF NOT EXISTS transaction_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'inventory_ledger_transaction_id_fkey'
          AND table_name = 'inventory_ledger'
    ) THEN
        ALTER TABLE public.inventory_ledger
            ADD CONSTRAINT inventory_ledger_transaction_id_fkey
            FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- client_id and inventory_id on transactions (optional links)
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- Inventory pricing columns
ALTER TABLE public.inventory
    ADD COLUMN IF NOT EXISTS buying_price  DECIMAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS selling_price DECIMAL DEFAULT 0;


-- ── 2. CREATE MISSING TABLES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE  NOT NULL,
    assigned_to UUID REFERENCES public.producers(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT CHECK (status IN ('pending', 'in_progress', 'done'))  DEFAULT 'pending'  NOT NULL,
    priority    TEXT CHECK (priority IN ('low', 'normal', 'high'))          DEFAULT 'normal'   NOT NULL,
    start_date  DATE,
    due_date    DATE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;


-- ── 3. REMOVE DUPLICATE / RECURSIVE / STALE POLICIES ──────────────────────

-- clients
DROP POLICY IF EXISTS "Manage own clients"                          ON public.clients;

-- documents
DROP POLICY IF EXISTS "Manage own documents"                        ON public.documents;

-- inventory  (keep only "Producers can manage own inventory" which uses get_my_employer_id)
DROP POLICY IF EXISTS "Manage own inventory"                        ON public.inventory;
DROP POLICY IF EXISTS "Producers and Employees can view inventory"  ON public.inventory;

-- inventory_ledger  (keep only "Producers can manage own ledger")
DROP POLICY IF EXISTS "Producers and Employees can manage ledger"   ON public.inventory_ledger;

-- producers  (remove duplicates and the overly-broad "Allow viewing companies")
DROP POLICY IF EXISTS "Allow viewing companies"                     ON public.producers;
DROP POLICY IF EXISTS "Producers view own profile"                  ON public.producers;
DROP POLICY IF EXISTS "Producers update own profile"                ON public.producers;

-- transactions  (keep "Producers can manage own transactions" + "Employees can view employer transactions")
DROP POLICY IF EXISTS "Manage own transactions"                     ON public.transactions;
DROP POLICY IF EXISTS "Owners can manage own transactions"          ON public.transactions;


-- ── 4. TASKS RLS POLICIES ──────────────────────────────────────────────────

-- Owner sees all tasks under their account; employees see tasks assigned to them
-- or tasks belonging to their employer
DROP POLICY IF EXISTS "Users can view relevant tasks"   ON public.tasks;
CREATE POLICY "Users can view relevant tasks" ON public.tasks
    FOR SELECT USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
        OR producer_id = public.get_my_employer_id()
    );

DROP POLICY IF EXISTS "Users can create tasks"          ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        producer_id = auth.uid()
        OR producer_id = public.get_my_employer_id()
    );

DROP POLICY IF EXISTS "Users can update relevant tasks" ON public.tasks;
CREATE POLICY "Users can update relevant tasks" ON public.tasks
    FOR UPDATE USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
    );

DROP POLICY IF EXISTS "Users can delete relevant tasks" ON public.tasks;
CREATE POLICY "Users can delete relevant tasks" ON public.tasks
    FOR DELETE USING (
        producer_id = auth.uid()
        OR assigned_to = auth.uid()
    );
