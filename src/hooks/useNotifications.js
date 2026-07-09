import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15

  const loadNotifications = useCallback(async (reset = false) => {
    if (!userId) return

    const currentPage = reset ? 0 : page
    if (!reset && !hasMore) return

    setLoading(true)
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setNotifications(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
      setPage(currentPage + 1)
    }
    setLoading(false)
  }, [userId, page, hasMore])

  useEffect(() => {
    loadNotifications(true)
  }, [userId])

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
    }
  }

  return { notifications, markAsRead, loading, reload: () => loadNotifications(true), loadMore: () => loadNotifications(false), hasMore }
}

export async function addNotification(userId, title, message) {
  if (!userId) return

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      read: false
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao adicionar notificação:', error)
  }

  return data
}

export async function sendBroadcastNotification(targetRole, title, message) {
  if (!title || !message) return { success: false, error: 'Título e mensagem são obrigatórios' }

  try {
    // Gravar o comunicado na tabela announcements — acessível a todos os utilizadores
    // com o role correspondente, sem necessidade de inserir uma linha por utilizador
    const { data: { session } } = await supabase.auth.getSession()
    const adminId = session?.user?.id || null

    const { error: announcementError } = await supabase
      .from('announcements')
      .insert({
        title,
        message,
        target_role: targetRole || 'all',
        created_by: adminId
      })

    if (announcementError) throw announcementError

    // Também inserir notificações individuais para os utilizadores já existentes
    // (compatibilidade com o sistema de notificações na Navbar)
    let query = supabase.from('profiles').select('id')
    if (targetRole && targetRole !== 'all') {
      query = query.eq('role', targetRole)
    }

    const { data: users, error: fetchError } = await query

    if (fetchError) throw fetchError

    if (users && users.length > 0) {
      const notifications = users.map(u => ({
        user_id: u.id,
        title,
        message,
        read: false
      }))

      // Inserir em lotes de 50 para evitar timeouts
      for (let i = 0; i < notifications.length; i += 50) {
        const batch = notifications.slice(i, i + 50)
        const { error: batchError } = await supabase.from('notifications').insert(batch)
        if (batchError) console.warn('Erro ao inserir lote de notificações:', batchError)
      }
    }

    return { success: true, count: users?.length || 0 }
  } catch (error) {
    console.error('Erro ao enviar comunicado:', error)
    return { success: false, error }
  }
}
