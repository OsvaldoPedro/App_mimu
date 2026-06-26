-- Migration: Create payment_logs table

CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    event_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 1. Admins can view all payment logs
DROP POLICY IF EXISTS "Admins podem ver todos os logs de pagamento" ON public.payment_logs;
CREATE POLICY "Admins podem ver todos os logs de pagamento"
ON public.payment_logs
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. Service role / Edge Functions can do anything
DROP POLICY IF EXISTS "Service Role pode gerir todos os logs" ON public.payment_logs;
CREATE POLICY "Service Role pode gerir todos os logs"
ON public.payment_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON public.payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON public.payment_logs(event_type);
