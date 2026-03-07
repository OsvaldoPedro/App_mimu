import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { storage, KEYS } from '../utils/storage'
import { API_BASE_URL, getProfileEndpoint } from '../config/api'

const AuthContext = createContext(null)

const ROLE_TO_USER_TYPE = {
  client: 'cliente',
  company: 'empresa',
  provider: 'prestador'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const userType = useMemo(
    () => (user?.role ? ROLE_TO_USER_TYPE[user.role] ?? null : null),
    [user?.role]
  )

  useEffect(() => {
    const saved = storage.get(KEYS.USER)
    if (saved?.id) setUser(saved)
  }, [])

  const login = (emailOrPhone, password) => {
    const users = storage.get(KEYS.USERS, [])
    const found = users.find(
      u => (u.email === emailOrPhone || u.phone === emailOrPhone) && u.password === password
    )
    if (found) {
      const { password: _, ...safe } = found
      setUser(safe)
      storage.set(KEYS.USER, safe)
      return { success: true, user: safe }
    }
    return { success: false, error: 'Credenciais inválidas' }
  }

  const logout = () => {
    setUser(null)
    storage.remove(KEYS.USER)
  }

  const registerClient = (data) => {
    const users = storage.get(KEYS.USERS, [])
    if (users.some(u => (data.email && u.email === data.email) || u.phone === data.phone)) {
      return { success: false, error: 'Email ou telefone já registado' }
    }
    const id = 'usr_' + Date.now()
    const newUser = { ...data, id, role: 'client', photo: data.photo || null, email: data.email || null }
    users.push(newUser)
    storage.set(KEYS.USERS, users)
    const { password: _, ...safe } = newUser
    setUser(safe)
    storage.set(KEYS.USER, safe)
    return { success: true }
  }

  /**
   * NOTA DE SEGURANÇA (mock):
   * Neste modo demo as palavras-passe são guardadas em texto simples em localStorage.
   * Num backend real deve-se usar hash seguro (ex: bcrypt) e NUNCA guardar a senha em claro.
   */

  const registerCompany = (data) => {
    const users = storage.get(KEYS.USERS, [])
    if (users.some(u => u.email === data.email || u.phone === data.phone)) {
      return { success: false, error: 'Email ou telefone já registado' }
    }
    const id = 'cmp_' + Date.now()
    const newUser = { ...data, id, role: 'company', status: 'pending_approval', logo: data.logo || null }
    users.push(newUser)
    storage.set(KEYS.USERS, users)
    const { password: _, ...safe } = newUser
    setUser(safe)
    storage.set(KEYS.USER, safe)
    return { success: true }
  }

  const registerProvider = (data) => {
    const users = storage.get(KEYS.USERS, [])
    if (users.some(u => u.email === data.email || u.phone === data.phone)) {
      return { success: false, error: 'Email ou telefone já registado' }
    }
    const id = 'prv_' + Date.now()
    const newUser = { ...data, id, role: 'provider', status: 'pending_approval' }
    users.push(newUser)
    storage.set(KEYS.USERS, users)
    const { password: _, ...safe } = newUser
    setUser(safe)
    storage.set(KEYS.USER, safe)
    return { success: true }
  }

  const updateUser = (updates) => {
    const users = storage.get(KEYS.USERS, [])
    const idx = users.findIndex(u => u.id === user?.id)
    if (idx === -1) return
    users[idx] = { ...users[idx], ...updates }
    storage.set(KEYS.USERS, users)
    const { password: _, ...safe } = users[idx]
    setUser(safe)
    storage.set(KEYS.USER, safe)
  }

  /**
   * Atualiza o perfil do utilizador consoante o tipo de conta.
   * Aceita um objeto com os campos a atualizar ou FormData (para upload de imagem).
   * Em modo API: PUT /cliente|empresa|prestador/:id
   * Sem API: atualiza localStorage e estado global.
   */
  const updateProfile = async (payloadOrFormData) => {
    const type = user?.role ? ROLE_TO_USER_TYPE[user.role] : null
    if (!type || !user?.id) {
      return { success: false, error: 'Utilizador não autenticado ou tipo desconhecido.' }
    }

    const endpoint = getProfileEndpoint(type, user.id)
    const useApi = Boolean(API_BASE_URL && endpoint)

    if (useApi) {
      try {
        const isFormData = payloadOrFormData instanceof FormData
        const options = {
          method: 'PUT',
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          body: isFormData ? payloadOrFormData : JSON.stringify(payloadOrFormData)
        }

        const res = await fetch(endpoint, options)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }

        const updated = res.status === 204 ? user : await res.json()
        const { password: _, ...safe } = updated || user
        setUser(safe)
        storage.set(KEYS.USER, safe)
        return { success: true, user: safe }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    let payload = payloadOrFormData instanceof FormData
      ? Object.fromEntries(payloadOrFormData.entries())
      : { ...payloadOrFormData }

    if (typeof payload.serviceTypes === 'string') {
      try {
        payload.serviceTypes = JSON.parse(payload.serviceTypes)
      } catch {
        payload.serviceTypes = payload.serviceTypes ? [payload.serviceTypes] : []
      }
    }
    if (payload.basePrice !== undefined && payload.basePrice !== '') {
      payload.basePrice = Number(payload.basePrice)
    }

    const users = storage.get(KEYS.USERS, [])
    const idx = users.findIndex(u => u.id === user.id)
    if (idx === -1) return { success: false, error: 'Utilizador não encontrado.' }

    const current = users[idx]
    const updates = { ...payload }

    if (payload.photo instanceof File) {
      const reader = new FileReader()
      updates.photo = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(payload.photo)
      })
    } else if (payload.photo === '' || payload.photo === undefined) {
      delete updates.photo
    }

    if (payload.logo instanceof File) {
      const reader = new FileReader()
      updates.logo = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(payload.logo)
      })
    } else if (payload.logo === '' || payload.logo === undefined) {
      delete updates.logo
    }

    users[idx] = { ...current, ...updates }
    storage.set(KEYS.USERS, users)
    const { password: _, ...safe } = users[idx]
    setUser(safe)
    storage.set(KEYS.USER, safe)
    return { success: true, user: safe }
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (!user?.id) return { success: false, error: 'Utilizador não autenticado.' }

    // Modo API real – pronto para integração futura
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    const users = storage.get(KEYS.USERS, [])
    const idx = users.findIndex(u => u.id === user.id)
    if (idx === -1) return { success: false, error: 'Utilizador não encontrado.' }

    const record = users[idx]
    if (record.password !== currentPassword) {
      return { success: false, error: 'A palavra-passe actual está incorreta.' }
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' }
    }

    users[idx] = { ...record, password: newPassword }
    storage.set(KEYS.USERS, users)
    return { success: true }
  }

  const forgotPassword = async (identifier) => {
    if (!identifier) return { success: false, error: 'Indica email ou telefone.' }

    // Modo API real
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    // Mock com localStorage
    const users = storage.get(KEYS.USERS, [])
    const target = users.find(
      u => u.email === identifier || u.phone === identifier
    )
    if (!target) {
      return { success: false, error: 'Conta não encontrada para estes dados.' }
    }

    const token = 'rst_' + Date.now()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutos
    const tokens = storage.get(KEYS.RESET_TOKENS, [])
    tokens.push({ token, userId: target.id, expiresAt })
    storage.set(KEYS.RESET_TOKENS, tokens)

    // Simulação de envio de código – apenas para desenvolvimento
    // eslint-disable-next-line no-console
    console.log('Token de recuperação (mock):', token)

    return { success: true, token }
  }

  const resetPassword = async (token, newPassword) => {
    if (!token) return { success: false, error: 'Token inválido.' }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' }
    }

    // Modo API real
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, error: err.message || `Erro ${res.status}` }
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: err.message || 'Erro de rede.' }
      }
    }

    const tokens = storage.get(KEYS.RESET_TOKENS, [])
    const entry = tokens.find(t => t.token === token)
    if (!entry) return { success: false, error: 'Token inválido ou expirado.' }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      return { success: false, error: 'Token expirado. Faz o pedido novamente.' }
    }

    const users = storage.get(KEYS.USERS, [])
    const idx = users.findIndex(u => u.id === entry.userId)
    if (idx === -1) return { success: false, error: 'Utilizador não encontrado.' }

    users[idx] = { ...users[idx], password: newPassword }
    storage.set(KEYS.USERS, users)

    const remaining = tokens.filter(t => t.token !== token)
    storage.set(KEYS.RESET_TOKENS, remaining)

    return { success: true }
  }

  const value = {
    user,
    userType,
    login,
    logout,
    registerClient,
    registerCompany,
    registerProvider,
    updateUser,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    isClient: user?.role === 'client',
    isCompany: user?.role === 'company',
    isProvider: user?.role === 'provider',
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthContext }
