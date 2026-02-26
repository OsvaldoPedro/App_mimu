import { createContext, useContext, useCallback } from 'react'
import { storage, KEYS } from '../utils/storage'
import { API_BASE_URL } from '../config/api'

const ServicesContext = createContext(null)

function getCompanyServicesFromStorage() {
  return storage.get(KEYS.COMPANY_SERVICES, [])
}

function setCompanyServicesToStorage(list) {
  storage.set(KEYS.COMPANY_SERVICES, list)
}

function getProviderServicesFromStorage() {
  return storage.get(KEYS.PROVIDER_SERVICES, [])
}

function setProviderServicesToStorage(list) {
  storage.set(KEYS.PROVIDER_SERVICES, list)
}

export function ServicesProvider({ children }) {
  const getCompanyServices = useCallback((companyId) => {
    if (!companyId) return []
    const list = getCompanyServicesFromStorage()
    return list.filter((s) => s.companyId === companyId)
  }, [])

  const getProviderServices = useCallback((providerId) => {
    if (!providerId) return []
    const list = getProviderServicesFromStorage()
    return list.filter((s) => s.providerId === providerId)
  }, [])

  const createService = useCallback(async (serviceData) => {
    const { companyId } = serviceData
    if (!companyId) return { success: false, error: 'Empresa não identificada.' }

    const list = getCompanyServicesFromStorage()
    const id = 'srv_' + Date.now()
    const rawImages = Array.isArray(serviceData.images) ? serviceData.images : [serviceData.images].filter(Boolean)
    const placeholderImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'
    const service = {
      id,
      companyId,
      categoryId: serviceData.categoryId,
      serviceType: serviceData.serviceType || null,
      name: serviceData.name,
      description: serviceData.description || '',
      price: Number(serviceData.price) || 0,
      currency: serviceData.currency || 'AOA',
      priceType: serviceData.priceType || 'service',
      location: serviceData.location || '',
      images: rawImages.length > 0 ? rawImages : [placeholderImage],
      amenities: Array.isArray(serviceData.amenities) ? serviceData.amenities : [],
      rating: 0,
      reviewCount: 0,
      status: 'pending_validation',
      createdAt: new Date().toISOString()
    }

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/servicos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        const created = await res.json()
        list.push(created)
        setCompanyServicesToStorage(list)
        return { success: true, service: created }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    list.push(service)
    setCompanyServicesToStorage(list)
    return { success: true, service }
  }, [])

  const createProviderService = useCallback(async (serviceData) => {
    const { providerId } = serviceData
    if (!providerId) return { success: false, error: 'Prestador não identificado.' }

    const list = getProviderServicesFromStorage()
    const id = 'srv_' + Date.now()
    const rawImages = Array.isArray(serviceData.images) ? serviceData.images : [serviceData.images].filter(Boolean)
    const placeholderImage = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80'
    const service = {
      id,
      providerId,
      categoryId: serviceData.categoryId,
      serviceType: serviceData.serviceType || null,
      name: serviceData.name,
      description: serviceData.description || '',
      price: Number(serviceData.price) || 0,
      currency: serviceData.currency || 'AOA',
      priceType: serviceData.priceType || 'service',
      location: serviceData.location || '',
      images: rawImages.length > 0 ? rawImages : [placeholderImage],
      amenities: Array.isArray(serviceData.amenities) ? serviceData.amenities : [],
      rating: 0,
      reviewCount: 0,
      status: 'pending_validation',
      createdAt: new Date().toISOString()
    }

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/servicos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        const created = await res.json()
        list.push(created)
        setProviderServicesToStorage(list)
        return { success: true, service: created }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    list.push(service)
    setProviderServicesToStorage(list)
    return { success: true, service }
  }, [])

  const updateService = useCallback(async (serviceId, updates) => {
    const list = getCompanyServicesFromStorage()
    const idx = list.findIndex((s) => s.id === serviceId)
    if (idx === -1) return { success: false, error: 'Serviço não encontrado.' }

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/servicos/${serviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        const updated = await res.json()
        list[idx] = updated
        setCompanyServicesToStorage(list)
        return { success: true, service: updated }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    const current = list[idx]
    const service = {
      ...current,
      ...updates,
      id: current.id,
      companyId: current.companyId
    }
    if (updates.price !== undefined) service.price = Number(updates.price)
    if (updates.images !== undefined) service.images = Array.isArray(updates.images) ? updates.images : [updates.images].filter(Boolean)
    list[idx] = service
    setCompanyServicesToStorage(list)
    return { success: true, service }
  }, [])

  const updateProviderService = useCallback(async (serviceId, updates) => {
    const list = getProviderServicesFromStorage()
    const idx = list.findIndex((s) => s.id === serviceId)
    if (idx === -1) return { success: false, error: 'Serviço não encontrado.' }

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/servicos/${serviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        const updated = await res.json()
        list[idx] = updated
        setProviderServicesToStorage(list)
        return { success: true, service: updated }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    const current = list[idx]
    const service = {
      ...current,
      ...updates,
      id: current.id,
      providerId: current.providerId
    }
    if (updates.price !== undefined) service.price = Number(updates.price)
    if (updates.images !== undefined) service.images = Array.isArray(updates.images) ? updates.images : [updates.images].filter(Boolean)
    list[idx] = service
    setProviderServicesToStorage(list)
    return { success: true, service }
  }, [])

  const deleteService = useCallback(async (serviceId) => {
    const list = getCompanyServicesFromStorage()
    const idx = list.findIndex((s) => s.id === serviceId)
    if (idx === -1) return { success: false, error: 'Serviço não encontrado.' }

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/servicos/${serviceId}`, { method: 'DELETE' })
        if (!res.ok) return { success: false, error: `Erro ${res.status}` }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    list.splice(idx, 1)
    setCompanyServicesToStorage(list)
    return { success: true }
  }, [])

  const deleteProviderService = useCallback(async (serviceId) => {
    const list = getProviderServicesFromStorage()
    const idx = list.findIndex((s) => s.id === serviceId)
    if (idx === -1) return { success: false, error: 'Serviço não encontrado.' }

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/servicos/${serviceId}`, { method: 'DELETE' })
        if (!res.ok) return { success: false, error: `Erro ${res.status}` }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    list.splice(idx, 1)
    setProviderServicesToStorage(list)
    return { success: true }
  }, [])

  const value = {
    getCompanyServices,
    createService,
    updateService,
    deleteService,
    getProviderServices,
    createProviderService,
    updateProviderService,
    deleteProviderService
  }

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

export function useServices() {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used within ServicesProvider')
  return ctx
}
