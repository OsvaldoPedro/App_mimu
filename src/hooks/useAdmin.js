import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../config/supabaseClient'
import { addNotification } from './useNotifications'

export function usePendingUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const loadUsers = useCallback(async (reset = false) => {
    setLoading(true)
    if (reset) {
       currentCountRef.current = 0
    }
    const from = currentCountRef.current;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('id', { ascending: false })
      .range(from, from + 19)
    
    if (!error && data) {
      if (reset) setUsers(data)
      else setUsers(prev => [...prev, ...data])
      currentCountRef.current += data.length
      setHasMore(data.length === 20)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers(true) }, [loadUsers])

  return { users, reload: () => loadUsers(true), loadMore: () => loadUsers(false), hasMore, loading }
}

export async function approveUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', userId)

  if (!error) {
    await addNotification(userId, 'Conta Aprovada', 'A tua conta foi aprovada com sucesso! Já podes aceder livremente ao sistema.')
  }
  return { success: !error }
}

export async function rejectUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId)

  return { success: !error }
}

export async function deleteUser(userId) {
  const { data, error } = await supabase.rpc('delete_user_by_admin', { user_id: userId })
  if (error) {
    console.error("Erro ao apagar utilizador:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export function useAdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const loadCompanies = useCallback(async (reset = false) => {
    setLoading(true)
    if (reset) currentCountRef.current = 0;
    const from = currentCountRef.current;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*, nifs(nif)')
      .eq('role', 'company')
      .order('id', { ascending: false })
      .range(from, from + 19)
    
    if (!error && data) {
      const mappedData = data.map(d => ({ ...d, nif: d.nifs ? (Array.isArray(d.nifs) ? d.nifs[0]?.nif : d.nifs?.nif) : null }));
      if (reset) setCompanies(mappedData)
      else setCompanies(prev => [...prev, ...mappedData])
      currentCountRef.current += data.length
      setHasMore(data.length === 20)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadCompanies(true) }, [loadCompanies])

  return { companies, reload: () => loadCompanies(true), loadMore: () => loadCompanies(false), hasMore, loading }
}

export function useAdminProviders() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const loadProviders = useCallback(async (reset = false) => {
    setLoading(true)
    if (reset) currentCountRef.current = 0;
    const from = currentCountRef.current;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*, nifs(nif)')
      .eq('role', 'provider')
      .order('id', { ascending: false })
      .range(from, from + 19)
    
    if (!error && data) {
      const mappedData = data.map(d => ({ ...d, nif: d.nifs ? (Array.isArray(d.nifs) ? d.nifs[0]?.nif : d.nifs?.nif) : null }));
      if (reset) setProviders(mappedData)
      else setProviders(prev => [...prev, ...mappedData])
      currentCountRef.current += data.length
      setHasMore(data.length === 20)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadProviders(true) }, [loadProviders])

  return { providers, reload: () => loadProviders(true), loadMore: () => loadProviders(false), hasMore, loading }
}

export async function updateUserStatus(userId, status) {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId)

  if (!error) {
    let title = 'Atualização de Conta'
    let msg = `O estado da tua conta mudou para: ${status}`
    if (status === 'approved' || status === 'active') {
      title = 'Conta Aprovada'
      msg = 'A tua conta foi aprovada com sucesso! Já podes aceder livremente ao sistema.'
    } else if (status === 'suspended') {
      title = 'Conta Suspensa'
      msg = 'A tua conta foi suspensa temporariamente. Por favor, contacta o suporte.'
    } else if (status === 'rejected') {
      title = 'Conta Rejeitada'
      msg = 'Infelizmente a tua conta foi rejeitada.'
    }
    await addNotification(userId, title, msg)
  }
  return { success: !error }
}

export function useAdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const loadServices = useCallback(async (reset = false) => {
    setLoading(true)
    if (reset) currentCountRef.current = 0;
    const from = currentCountRef.current;
    
    const { data, error } = await supabase
      .from('services')
      .select('*, profiles(name, company_name, phone)')
      .order('created_at', { ascending: false })
      .range(from, from + 19)
    
    if (!error && data) {
      const mappedData = data.map(s => ({
         ...s,
         provider_name: s.profiles?.company_name || s.profiles?.name || 'Desconhecido',
         provider_phone: s.profiles?.phone || 'N/A'
      }))
      if (reset) setServices(mappedData)
      else setServices(prev => [...prev, ...mappedData])
      currentCountRef.current += data.length
      setHasMore(data.length === 20)
    }
    setLoading(false)
  }, [])

  useEffect(() => { 
    loadServices(true) 
    
    // Subscribe to real-time changes in services table
    const subscription = supabase
      .channel('services_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'services' 
        },
        (payload) => {
          console.log('Service change detected:', payload)
          loadServices(true)
        }
      )
      .subscribe()

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadServices])

  return { services, reload: () => loadServices(true), loadMore: () => loadServices(false), hasMore, loading }
}

export async function updateServiceStatus(serviceId, status, ownerId, serviceName) {
  const { error } = await supabase
    .from('services')
    .update({ status })
    .eq('id', serviceId)

  if (!error && ownerId) {
    let title = 'Atualização de Serviço'
    let msg = `O estado do teu serviço mudou para: ${status}`
    if (status === 'approved') {
      title = 'Serviço Aprovado'
      msg = `O teu serviço "${serviceName || 'Publicado'}" foi aprovado e já está público!`
    } else if (status === 'rejected') {
      title = 'Serviço Rejeitado'
      msg = `Infelizmente, o teu serviço "${serviceName || 'Submetido'}" foi rejeitado.`
    }
    await addNotification(ownerId, title, msg)
  }
  return { success: !error }
}

export function useAllUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const loadUsers = useCallback(async (reset = false) => {
    setLoading(true)
    if (reset) currentCountRef.current = 0;
    const from = currentCountRef.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, nifs(nif)')
        .order('created_at', { ascending: false })
        .range(from, from + 19)
      
      if (!error && data) {
        const mappedData = data.map(d => ({ ...d, nif: d.nifs ? (Array.isArray(d.nifs) ? d.nifs[0]?.nif : d.nifs?.nif) : null }));
        if (reset) setUsers(mappedData)
        else setUsers(prev => [...prev, ...mappedData])
        currentCountRef.current += data.length
        setHasMore(data.length === 20)
      }
      if (error) console.error('Error loading users:', error)
    } catch (err) {
      console.error('Error in loadUsers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers(true)

    // Subscribe to real-time changes in profiles table
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        },
        (payload) => {
          console.log('Profile change detected:', payload)
          // Reload users when any profile changes
          loadUsers(true)
        }
      )
      .subscribe()

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadUsers])

  return { users, reload: () => loadUsers(true), loadMore: () => loadUsers(false), hasMore, loading }
}

export function useAllOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const loadOrders = useCallback(async (reset = false) => {
    setLoading(true)
    if (reset) currentCountRef.current = 0;
    const from = currentCountRef.current;
    try {
      // Usamos inner join customizado com !owner_id para evitar ambiguidades com 'client_id' se existirem foreign keys
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          provider:profiles!owner_id(name, company_name)
        `)
        .order('created_at', { ascending: false })
        .range(from, from + 19)
      
      if (!error && data) {
        const mappedData = data.map(o => ({
           ...o,
           serviceName: o.service_name,
           clientName: o.client_name,
           providerName: o.provider?.company_name || o.provider?.name || 'Desconhecido'
        }))
        if (reset) setOrders(mappedData)
        else setOrders(prev => [...prev, ...mappedData])
        currentCountRef.current += data.length
        setHasMore(data.length === 20)
      }
      if (error) console.error('Error loading orders:', error)
    } catch (err) {
      console.error('Error in loadOrders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders(true)

    // Subscribe to real-time changes in orders table
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        },
        (payload) => {
          console.log('Order change detected:', payload)
          loadOrders(true)
        }
      )
      .subscribe()

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadOrders])

  return { orders, reload: () => loadOrders(true), loadMore: () => loadOrders(false), hasMore, loading }
}
