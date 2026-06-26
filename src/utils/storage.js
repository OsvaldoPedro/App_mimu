const PREFIX = 'mimu_'

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PREFIX + key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key)
  }
}

export const KEYS = {
  PROFILES: 'profiles', // Users, Companies, Providers
  SERVICES: 'services', // All services
  ORDERS: 'orders',
  NOTIFICATIONS: 'notifications',
  RESET_TOKENS: 'reset_tokens'
}
