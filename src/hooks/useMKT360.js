import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

/**
 * Extrai a mensagem de erro detalhada retornada pela Edge Function
 */
async function extractErrorMessage(fnError) {
  if (!fnError) return 'Erro desconhecido.'
  let msg = fnError.message
  if (fnError.context) {
    try {
      const body = await fnError.context.json()
      if (body && (body.error || body.message)) {
        msg = body.error || body.message
      }
    } catch (_) {}
  }
  return msg
}

/**
 * Hook para listar eventos vindos da MKT360
 */
export function useMKT360Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('mkt360-api', {
        body: { action: 'list-events' }
      })

      if (fnError) {
        const msg = await extractErrorMessage(fnError)
        throw new Error(msg)
      }

      // Tratar dados de resposta. A GoTicket retorna { value: [...], Count: N }
      const list = data?.value || data?.events || data?.data || (Array.isArray(data) ? data : [])
      setEvents(list)
    } catch (err) {
      console.error('Erro ao carregar eventos MKT360:', err)
      setError(err.message || 'Erro ao carregar eventos da MKT360.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return { events, loading, error, reload: loadEvents }
}

/**
 * Hook para obter detalhes de um evento específico MKT360
 */
export function useMKT360EventDetails(eventId) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(!!eventId) // Only loading if we have an external ID
  const [error, setError] = useState(null)

  const loadDetails = useCallback(async () => {
    if (!eventId) {
      // Local-only event: no GoTicket ID, skip external call
      setLoading(false)
      setEvent(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('mkt360-api', {
        body: { action: 'get-event-details', data: { eventId } }
      })

      if (fnError) {
        const msg = await extractErrorMessage(fnError)
        throw new Error(msg)
      }
      setEvent(data?.event || data || null)
    } catch (err) {
      console.error('Erro ao carregar detalhes do evento MKT360:', err)
      setError(err.message || 'Erro ao carregar detalhes do evento.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  return { event, loading, error, reload: loadDetails }
}

/**
 * Hook para gerir os bilhetes locais comprados pelo utilizador Mimu logado
 */
export function useMyMKT360Tickets(userId) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      setTickets(data || [])
    } catch (err) {
      console.error('Erro ao buscar bilhetes locais:', err)
      setError(err.message || 'Erro ao carregar os seus bilhetes.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  return { tickets, loading, error, reload: loadTickets }
}

/**
 * Ação para compra de bilhetes via Edge Function
 */
export async function purchaseMKT360Tickets(eventId, ticketTypeId, qty, buyerName, buyerEmail, buyerPhone) {
  try {
    const { data, error } = await supabase.functions.invoke('mkt360-api', {
      body: {
        action: 'purchase-tickets',
        data: {
          eventId,
          ticketTypeId,
          qty: parseInt(qty, 10),
          buyerName,
          buyerEmail,
          buyerPhone
        }
      }
    })

    if (error) {
      console.error('Erro de Edge Function na compra:', error)
      const msg = await extractErrorMessage(error)
      return { success: false, error: msg }
    }

    if (data?.error) {
      return { success: false, error: data.error }
    }

    return { success: true, order: data }
  } catch (err) {
    console.error('Erro geral ao processar a compra de tickets:', err)
    return { success: false, error: err.message || 'Falha ao efetuar a compra do ticket.' }
  }
}

/**
 * Ações de portaria (Validação e Check-in)
 */
export async function validateMKT360Ticket(ticketCode, eventId) {
  try {
    const { data, error } = await supabase.functions.invoke('mkt360-api', {
      body: {
        action: 'validate-ticket',
        data: { ticketCode, eventId }
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      throw new Error(msg)
    }
    if (data?.error) return { success: false, error: data.error }
    return { success: true, data }
  } catch (err) {
    console.error('Erro ao validar bilhete:', err)
    return { success: false, error: err.message || 'Falha ao validar o bilhete.' }
  }
}

export async function checkinMKT360Ticket(ticketCode, eventId) {
  try {
    const { data, error } = await supabase.functions.invoke('mkt360-api', {
      body: {
        action: 'checkin',
        data: { ticketCode, eventId }
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      throw new Error(msg)
    }
    if (data?.error) return { success: false, error: data.error }
    return { success: true, data }
  } catch (err) {
    console.error('Erro ao registar check-in de bilhete:', err)
    return { success: false, error: err.message || 'Falha ao registar o check-in.' }
  }
}

/**
 * Ações de Bloqueio e Desbloqueio de Tickets
 */
export async function blockMKT360Ticket(ticketId, reason) {
  try {
    const { data, error } = await supabase.functions.invoke('mkt360-api', {
      body: {
        action: 'block-ticket',
        data: { ticketId, reason }
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      throw new Error(msg)
    }
    if (data?.error) return { success: false, error: data.error }
    return { success: true, data }
  } catch (err) {
    console.error('Erro ao bloquear ticket:', err)
    return { success: false, error: err.message || 'Falha ao bloquear o ticket.' }
  }
}

export async function unblockMKT360Ticket(ticketId) {
  try {
    const { data, error } = await supabase.functions.invoke('mkt360-api', {
      body: {
        action: 'unblock-ticket',
        data: { ticketId }
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      throw new Error(msg)
    }
    if (data?.error) return { success: false, error: data.error }
    return { success: true, data }
  } catch (err) {
    console.error('Erro ao desbloquear ticket:', err)
    return { success: false, error: err.message || 'Falha ao desbloquear o ticket.' }
  }
}

export async function createMKT360Event(eventData) {
  try {
    const { data, error } = await supabase.functions.invoke('mkt360-api', {
      body: {
        action: 'create-event',
        data: eventData
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      return { success: false, error: msg }
    }

    if (data?.error) {
      return { success: false, error: data.error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Erro ao criar evento na GoTicket:', err)
    return { success: false, error: err.message || 'Falha ao criar evento integrado.' }
  }
}


