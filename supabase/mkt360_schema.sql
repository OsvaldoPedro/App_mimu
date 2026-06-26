-- Script de migração para o Novo Sistema de Tickets MKT360 na Mimu
-- Execute este script no editor SQL do painel do Supabase.
-- Corrigido: Usa ticket_orders para evitar conflito com a tabela orders nativa da app.

-- =========================================================================
-- 1. Criação das Tabelas
-- =========================================================================

-- Tabela de Pedidos de Tickets (Ticket Orders)
CREATE TABLE IF NOT EXISTS public.ticket_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_ref TEXT UNIQUE NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Tickets Individuais
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL,
    order_ref TEXT NOT NULL REFERENCES public.ticket_orders(order_ref) ON DELETE CASCADE,
    ticket_code TEXT UNIQUE NOT NULL,
    qr_data TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('NOT_USED', 'INSIDE', 'OUTSIDE', 'CANCELLED')) DEFAULT 'NOT_USED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_ticket_orders_user_id ON public.ticket_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order_ref ON public.tickets(order_ref);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);

-- =========================================================================
-- 2. Configuração do Row Level Security (RLS)
-- =========================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Políticas para public.ticket_orders
CREATE POLICY "Utilizadores autenticados podem ver os seus próprios pedidos" 
ON public.ticket_orders 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Service Role e Edge Functions podem fazer tudo em ticket_orders"
ON public.ticket_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Políticas para public.tickets
CREATE POLICY "Utilizadores autenticados podem ver os seus próprios tickets" 
ON public.tickets 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Service Role e Edge Functions podem fazer tudo em tickets"
ON public.tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comentários descritivos das tabelas
COMMENT ON TABLE public.ticket_orders IS 'Regista as transações dos bilhetes integrados com a MKT360.';
COMMENT ON TABLE public.tickets IS 'Regista cada bilhete individual associado aos utilizadores da Mimu.';
