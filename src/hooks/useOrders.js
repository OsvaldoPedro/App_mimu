import { useState, useCallback, useEffect } from 'react'
import { storage, KEYS } from '../utils/storage'

export function useOrders(userId) {
  const [orders, setOrders] = useState([])

  const load = useCallback(() => {
    const all = storage.get(KEYS.ORDERS, [])
    setOrders(all.filter(o => o.clientId === userId))
  }, [userId])

  useEffect(() => { if (userId) load() }, [userId, load])

  return { orders, reload: load }
}

export function useOrdersByProvider(providerId) {
  const [orders, setOrders] = useState([])
  const load = useCallback(() => {
    const all = storage.get(KEYS.ORDERS, [])
    setOrders(all.filter(o => o.providerId === providerId))
  }, [providerId])
  useEffect(() => { if (providerId) load() }, [providerId, load])
  return { orders, reload: load }
}

export function useOrdersByCompany(companyId) {
  const [orders, setOrders] = useState([])
  const load = useCallback(() => {
    const all = storage.get(KEYS.ORDERS, [])
    setOrders(all.filter(o => o.companyId === companyId))
  }, [companyId])
  useEffect(() => { if (companyId) load() }, [companyId, load])
  return { orders, reload: load }
}

export function createOrder(order) {
  const all = storage.get(KEYS.ORDERS, [])
  const id = 'ord_' + Date.now()
  const newOrder = { ...order, id, status: 'pendente', createdAt: new Date().toISOString() }
  all.push(newOrder)
  storage.set(KEYS.ORDERS, all)
  addNotification(order.providerId || order.companyId, 'nova_reserva', newOrder)
  if (order.clientId) addNotification(order.clientId, 'reserva_enviada', newOrder)
  return newOrder
}

export function updateOrderStatus(orderId, status) {
  const all = storage.get(KEYS.ORDERS, [])
  const idx = all.findIndex(o => o.id === orderId)
  if (idx === -1) return null
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() }
  storage.set(KEYS.ORDERS, all)
  const order = all[idx]
  addNotification(order.clientId, 'estado_reserva', { ...order, status })
  return order
}

export function addNotification(userId, type, data) {
  const all = storage.get(KEYS.NOTIFICATIONS, [])
  all.push({ id: 'n_' + Date.now(), userId, type, data, read: false, createdAt: new Date().toISOString() })
  storage.set(KEYS.NOTIFICATIONS, all)
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  useEffect(() => {
    const all = storage.get(KEYS.NOTIFICATIONS, [])
    setNotifications(all.filter(n => n.userId === userId).reverse())
  }, [userId])
  const markRead = (id) => {
    const all = storage.get(KEYS.NOTIFICATIONS, [])
    const idx = all.findIndex(n => n.id === id)
    if (idx !== -1) { all[idx].read = true; storage.set(KEYS.NOTIFICATIONS, all); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)) }
  }
  return { notifications, markRead }
}
