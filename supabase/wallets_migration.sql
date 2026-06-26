-- ============================================================
-- Migration: Carteira Digital (wallets + wallet_transactions)
-- Execute no editor SQL do painel Supabase.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Tabela de carteiras (wallets)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'AOA',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.wallets IS 'Carteira digital de cada utilizador Mimu.';
COMMENT ON COLUMN public.wallets.balance IS 'Saldo disponível em kwanzas (AOA).';

-- ----------------------------------------------------------------
-- 2. Tabela de transações da carteira (wallet_transactions)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'transfer_in', 'transfer_out', 'refund')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(14, 2) NOT NULL,
    balance_after NUMERIC(14, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    reference TEXT UNIQUE,
    description TEXT,
    metadata JSONB,
    related_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.wallet_transactions IS 'Histórico de todas as movimentações da carteira digital.';
COMMENT ON COLUMN public.wallet_transactions.type IS 'deposit=depósito, withdrawal=levantamento, payment=pagamento interno, transfer_in=recebimento, transfer_out=envio.';
COMMENT ON COLUMN public.wallet_transactions.related_user_id IS 'Utilizado em transferências: ID do utilizador origem ou destino.';

-- ----------------------------------------------------------------
-- 3. Índices de performance
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- ----------------------------------------------------------------
-- 4. Função auto-update de updated_at
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_wallet_updated ON public.wallets;
CREATE TRIGGER on_wallet_updated
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_wallet_updated_at();

-- ----------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ----------------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- wallets: utilizadores veem e atualizam a sua própria carteira
DROP POLICY IF EXISTS "Utilizadores veem a sua carteira" ON public.wallets;
CREATE POLICY "Utilizadores veem a sua carteira"
ON public.wallets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service Role total acesso wallets" ON public.wallets;
CREATE POLICY "Service Role total acesso wallets"
ON public.wallets FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins veem todas as carteiras" ON public.wallets;
CREATE POLICY "Admins veem todas as carteiras"
ON public.wallets FOR SELECT TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- wallet_transactions: utilizadores veem as suas transações
DROP POLICY IF EXISTS "Utilizadores veem as suas transacoes" ON public.wallet_transactions;
CREATE POLICY "Utilizadores veem as suas transacoes"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service Role total acesso wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Service Role total acesso wallet_transactions"
ON public.wallet_transactions FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins veem todas as transacoes" ON public.wallet_transactions;
CREATE POLICY "Admins veem todas as transacoes"
ON public.wallet_transactions FOR SELECT TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
