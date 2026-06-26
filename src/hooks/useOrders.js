import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

export function useOrders(userId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15

  const load = useCallback(async (reset = false) => {
    if (!userId) return

    const currentPage = reset ? 0 : page
    if (!reset && !hasMore) return

    setLoading(true)
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (!error && data) {
      const mapped = data.map(o => ({
        ...o,
        serviceName: o.service_name,
        clientName: o.client_name,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        specialRequests: o.special_requests
      }))
      setOrders(prev => reset ? mapped : [...prev, ...mapped])
      setHasMore(data.length === PAGE_SIZE)
      setPage(currentPage + 1)
    }
    setLoading(false)
  }, [userId, page, hasMore])

  useEffect(() => { load(true) }, [userId])

  return { orders, reload: () => load(true), loadMore: () => load(false), hasMore, loading }
}

export function useOrdersByProvider(providerId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15

  const load = useCallback(async (reset = false) => {
    if (!providerId) return

    const currentPage = reset ? 0 : page
    if (!reset && !hasMore) return

    setLoading(true)
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('owner_id', providerId)
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (!error && data) {
      const mapped = data.map(o => ({
        ...o,
        serviceName: o.service_name,
        clientName: o.client_name,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        specialRequests: o.special_requests
      }))
      setOrders(prev => reset ? mapped : [...prev, ...mapped])
      setHasMore(data.length === PAGE_SIZE)
      setPage(currentPage + 1)
    }
    setLoading(false)
  }, [providerId, page, hasMore])

  useEffect(() => { load(true) }, [providerId])

  return { orders, reload: () => load(true), loadMore: () => load(false), hasMore, loading }
}

export function useOrdersByCompany(companyId) {
  // It's the same logic since owner_id is either company or provider
  return useOrdersByProvider(companyId)
}

export async function createOrder(order) {
  const newOrder = {
    client_id: order.clientId,
    owner_id: order.providerId || order.companyId,
    service_id: order.serviceId,
    client_name: order.clientName || 'Cliente',
    service_name: order.serviceName || 'Serviço',
    date: order.date !== '-' ? new Date(order.date.split('/').reverse().join('-')) : null,
    time: order.time === '-' ? null : order.time,
    status: 'pendente',
    total: order.total !== undefined ? order.total : 0,
    payment_method: order.paymentMethod || 'A definir',
    payment_status: order.paymentStatus || 'pendente',
    guests: order.guests || null,
    special_requests: order.specialRequests || null
  }
  
  const { data, error } = await supabase.from('orders').insert(newOrder).select().single()
  if (error) {
    console.error('Erro ao criar reserva:', error)
    return null
  }
  
  // Create push notification for the provider/company
  if (data && newOrder.owner_id) {
    await supabase.from('notifications').insert([{
      user_id: newOrder.owner_id,
      title: 'Nova Reserva Recebida',
      message: `O cliente ${newOrder.client_name} acabou de reservar o serviço "${newOrder.service_name}". Verifique o seu painel de pedidos!`,
      read: false
    }])
  }
  
  return data
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single()
  if (error) console.error('Erro ao atualizar status:', error)
  return data
}

