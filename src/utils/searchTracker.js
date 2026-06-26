import { supabase } from '../config/supabaseClient'

/**
 * Grava uma pesquisa no histórico de pesquisas (public.search_history).
 * Se o utilizador estiver autenticado, associa o user_id correspondente.
 *
 * @param {string} query Termo de pesquisa de texto
 * @param {object} filters Filtros adicionais (categorias, província, cidade, aba activa)
 */
export async function trackSearch(query, filters = {}) {
  const cleanQuery = query ? String(query).trim() : ''
  if (!cleanQuery || cleanQuery.length < 2) return

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id || null

    const payload = {
      query: cleanQuery,
      user_id: userId,
      filters: filters && Object.keys(filters).length > 0 ? filters : null
    }

    const { error } = await supabase
      .from('search_history')
      .insert(payload)

    if (error) {
      console.error('[searchTracker] Erro ao gravar histórico de pesquisa:', error.message)
    }
  } catch (err) {
    console.error('[searchTracker] Erro inesperado ao rastrear pesquisa:', err)
  }
}
