-- Migration SQL: Sistema de Bloqueio e Desbloqueio de Tickets
-- Execute este script no editor SQL do Supabase.

-- =========================================================================
-- 0. Alterações na Tabela public.events para associar MKT360/GoTicket
-- =========================================================================

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS mkt360_event_id BIGINT UNIQUE NULL;

-- Criar índice para otimização de consultas por ID externo de evento
CREATE INDEX IF NOT EXISTS idx_events_mkt360_event_id ON public.events(mkt360_event_id);

-- =========================================================================
-- 1. Alterações na Tabela public.tickets
-- =========================================================================

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT NULL;

-- Criar índice para otimização de consultas por tickets bloqueados
CREATE INDEX IF NOT EXISTS idx_tickets_is_blocked ON public.tickets(is_blocked);

-- =========================================================================
-- 2. Criação da Tabela de Logs de Auditoria (ticket_audit_logs)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ticket_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('TICKET_BLOCKED', 'TICKET_UNBLOCKED', 'BLOCKED_VALIDATION_ATTEMPT', 'BLOCKED_CHECKIN_ATTEMPT')),
    performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    details JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para otimização de buscas na auditoria
CREATE INDEX IF NOT EXISTS idx_ticket_audit_logs_ticket_id ON public.ticket_audit_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_audit_logs_event_id ON public.ticket_audit_logs(event_id);

-- =========================================================================
-- 3. Configurações de RLS (Row Level Security)
-- =========================================================================

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.ticket_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3.1. Políticas de SELECT para a tabela public.tickets (para permitir que os organizadores e administradores vejam os tickets dos seus eventos)
CREATE POLICY "Organizadores e admins podem ver tickets dos seus eventos"
ON public.tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.mkt360_event_id = tickets.event_id
      AND events.created_by = auth.uid()
  )
  OR (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  ) = 'admin'
);

-- 3.2. Políticas de UPDATE para a tabela public.tickets
CREATE POLICY "Organizadores e admins podem atualizar tickets (bloquear/desbloquear)"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.mkt360_event_id = tickets.event_id
      AND events.created_by = auth.uid()
  )
  OR (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  ) = 'admin'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.mkt360_event_id = tickets.event_id
      AND events.created_by = auth.uid()
  )
  OR (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  ) = 'admin'
);

-- 3.3. Políticas para public.ticket_audit_logs (Leitura)
CREATE POLICY "Utilizadores podem ver logs de auditoria dos seus tickets"
ON public.ticket_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_audit_logs.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.events
          WHERE events.mkt360_event_id = tickets.event_id
            AND events.created_by = auth.uid()
        )
      )
  )
  OR (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  ) = 'admin'
);

-- 3.4. Políticas para public.ticket_audit_logs (Escrita via service_role/Edge Functions)
CREATE POLICY "Service Role pode fazer tudo em ticket_audit_logs"
ON public.ticket_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comentários das tabelas
COMMENT ON TABLE public.ticket_audit_logs IS 'Log de auditoria para ações de bloqueio, desbloqueio e tentativas de check-in/validação de tickets bloqueados.';
