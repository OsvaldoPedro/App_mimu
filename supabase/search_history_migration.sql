-- Migração SQL: Sistema de Registo e Histórico de Pesquisas de Utilizadores
-- Execute este script no editor SQL do Supabase.

CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    filters JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Políticas
-- 1. Qualquer pessoa (incluindo anónimos) pode gravar uma pesquisa
DROP POLICY IF EXISTS "Qualquer pessoa pode inserir pesquisas" ON public.search_history;
CREATE POLICY "Qualquer pessoa pode inserir pesquisas"
ON public.search_history
FOR INSERT
TO public
WITH CHECK (true);

-- 2. Utilizadores podem ver o seu próprio histórico
DROP POLICY IF EXISTS "Utilizadores podem ver o seu próprio historico" ON public.search_history;
CREATE POLICY "Utilizadores podem ver o seu próprio historico"
ON public.search_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Administradores podem ler todo o histórico
DROP POLICY IF EXISTS "Admins podem ver todo o historico" ON public.search_history;
CREATE POLICY "Admins podem ver todo o historico"
ON public.search_history
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Service role pode fazer tudo
DROP POLICY IF EXISTS "Service Role pode fazer tudo em search_history" ON public.search_history;
CREATE POLICY "Service Role pode fazer tudo em search_history"
ON public.search_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON public.search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at);

-- Comentários descritivos
COMMENT ON TABLE public.search_history IS 'Guarda o historico de pesquisas de todos os utilizadores para analise de tendencias.';
