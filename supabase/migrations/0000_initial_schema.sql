-- Initial Schema for Agricultural Marketplace Producer Dashboard

-- Enable RLS
-- Producers Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.producers (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT,
    company_name TEXT,
    produce TEXT,
    role TEXT DEFAULT 'company', -- 'company' or 'employee'
    num_employees INTEGER,
    location TEXT,
    additional_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inventory Table (Real-time stock levels)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL DEFAULT 0 NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'kg', 'liters', 'units'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inventory Ledger (History of adds/subtractions)
CREATE TABLE IF NOT EXISTS public.inventory_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL NOT NULL, -- Positive for addition, negative for subtraction
    reason TEXT NOT NULL, -- e.g., 'harvest', 'sale', 'spoilage'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transactions Table (Financials)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL, -- e.g., 'sale', 'payroll', 'equipment', 'seeds'
    amount DECIMAL NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.clients(id), -- Optional: Link income to a client
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Documents Table (Linked to clients or generic)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage Bucket
    type TEXT, -- e.g., 'contract', 'lab_result'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Users can only see/edit their own data)
CREATE POLICY "Producers can view own profile" ON public.producers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Producers can update own profile" ON public.producers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Producers can insert own profile" ON public.producers FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Producers can manage own clients" ON public.clients FOR ALL USING (producer_id = auth.uid());
CREATE POLICY "Producers can manage own inventory" ON public.inventory FOR ALL USING (producer_id = auth.uid());
CREATE POLICY "Producers can manage own ledger" ON public.inventory_ledger FOR ALL USING (EXISTS (SELECT 1 FROM public.inventory WHERE id = inventory_id AND producer_id = auth.uid()));
CREATE POLICY "Producers can manage own transactions" ON public.transactions FOR ALL USING (producer_id = auth.uid());
CREATE POLICY "Producers can manage own documents" ON public.documents FOR ALL USING (producer_id = auth.uid());
