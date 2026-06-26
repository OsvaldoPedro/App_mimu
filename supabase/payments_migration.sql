-- Migração SQL: Criação do Módulo de Pagamentos
-- Execute este script no editor SQL do painel do Supabase.

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0.00),
    currency TEXT NOT NULL DEFAULT 'AOA',
    payment_method TEXT NOT NULL,
    transaction_reference TEXT UNIQUE NULL,
    transaction_id TEXT UNIQUE NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'expired')) DEFAULT 'pending',
    metadata JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- 1. Utilizadores autenticados podem ver os seus próprios pagamentos
DROP POLICY IF EXISTS "Utilizadores podem ver os seus proprios pagamentos" ON public.payments;
CREATE POLICY "Utilizadores podem ver os seus proprios pagamentos"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Utilizadores autenticados podem submeter/criar os seus próprios pagamentos
DROP POLICY IF EXISTS "Utilizadores podem inserir os seus proprios pagamentos" ON public.payments;
CREATE POLICY "Utilizadores podem inserir os seus proprios pagamentos"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Administradores podem ler todas as transações
DROP POLICY IF EXISTS "Admins podem ver todos os pagamentos" ON public.payments;
CREATE POLICY "Admins podem ver todos os pagamentos"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Service role / Edge Functions têm controle total (para processar webhooks, reembolsos, etc.)
DROP POLICY IF EXISTS "Service Role pode gerir todos os pagamentos" ON public.payments;
CREATE POLICY "Service Role pode gerir todos os pagamentos"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Prestadores/Empresas podem ver pagamentos associados aos seus serviços
DROP POLICY IF EXISTS "Prestadores podem ver pagamentos dos seus servicos" ON public.payments;
CREATE POLICY "Prestadores podem ver pagamentos dos seus servicos"
ON public.payments
FOR SELECT
TO authenticated
USING (
  service_id IN (
    SELECT id FROM public.services WHERE owner_id = auth.uid()
  )
);

-- Criar Índices de Performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_reference ON public.payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Comentários das Tabelas e Campos
COMMENT ON TABLE public.payments IS 'Regista as transações financeiras e o estado de pagamento de serviços, reservas e bilhetes.';
COMMENT ON COLUMN public.payments.booking_id IS 'Associação opcional a uma reserva de serviço (tabela public.orders).';
COMMENT ON COLUMN public.payments.ticket_id IS 'Associação opcional a um bilhete digital (tabela public.tickets).';
