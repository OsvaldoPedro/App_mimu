import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

export function useUpcomingEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:created_by (name, company_name, avatar_url, role)
      `)
      .eq('status', 'approved')
      .order('date', { ascending: true })

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  return { events, loading, reload: loadEvents }
}

export function useMyEvents(userId) {
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const loadMyEvents = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('date', { ascending: true })

    if (!error && data) {
      setMyEvents(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { loadMyEvents() }, [loadMyEvents])

  return { myEvents, loading, reload: loadMyEvents }
}



// Actions
export async function createEvent(eventData) {
  // Ensure default status is 'pending' for moderation flow
  const payload = { ...eventData, status: 'pending' };
  const { data, error } = await supabase
    .from('events')
    .insert([payload])
    .select()

  if (error) return { success: false, error: error.message }
  return { success: true, event: data[0] }
}

export async function deleteEvent(eventId) {
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .select()

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: 'Permissão negada (RLS) ou evento não encontrado.' }
  }
  return { success: true }
}

// ADMIN ACTIONS
export async function getAllEventsForAdmin() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles:created_by (name, company_name, phone, role)
    `)
    .order('created_at', { ascending: false })
    
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateEventStatus(eventId, newStatus) {
  const { data, error } = await supabase
    .from('events')
    .update({ status: newStatus })
    .eq('id', eventId)
    .select()
    
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: 'Permissão negada (RLS) ou evento não encontrado ao alterar estado.' }
  }
  return { success: true, data: data[0] }
}

export async function updateEvent(eventId, payload) {
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId)
    .select()
    
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: 'Permissão negada (RLS) ou evento não encontrado ao atualizar.' }
  }
  return { success: true, data: data[0] }
}


