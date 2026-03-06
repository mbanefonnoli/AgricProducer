-- Add pricing columns to inventory table
ALTER TABLE public.inventory
    ADD COLUMN IF NOT EXISTS buying_price DECIMAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS selling_price DECIMAL DEFAULT 0;
