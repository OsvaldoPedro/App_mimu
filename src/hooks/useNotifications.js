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
    let query = supabase.from('profiles').select('id')
    if (targetRole && targetRole !== 'all') {
      query = query.eq('role', targetRole)
    }

    const { data: users, error: fetchError } = await query
    
    if (fetchError) throw fetchError
    if (!users || users.length === 0) return { success: true, count: 0 }

    const notifications = users.map(u => ({
      user_id: u.id,
      title,
      message,
      read: false
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) throw insertError

    return { success: true, count: users.length }
  } catch (error) {
    console.error('Erro ao enviar comunicado:', error)
    return { success: false, error }
  }
}
