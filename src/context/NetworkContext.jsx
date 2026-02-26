import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const NetworkContext = createContext(null)

export function NetworkProvider({ children }) {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [booting, setBooting] = useState(true)

  const checkConnection = useCallback(async () => {
    setChecking(true)
    setError('')
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setOnline(false)
        setError('Sem conexão com a internet. Conecte-se para continuar.')
        return
      }

      // Futuro: aqui podemos fazer um ping ao backend ou Supabase.
      setOnline(true)
    } catch {
      setOnline(false)
      setError('Não foi possível verificar a conexão.')
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    checkConnection()

    // Splash mínimo de 10 segundos para simular carregamento inicial (dados + verificação).
    const timer = setTimeout(() => {
      setBooting(false)
    }, 10000)

    const handleOnline = () => {
      setOnline(true)
      setError('')
    }
    const handleOffline = () => {
      setOnline(false)
      setError('Sem conexão com a internet. Conecte-se para continuar.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(timer)
    }
  }, [checkConnection])

  const value = {
    online,
    checking,
    booting,
    error,
    retry: checkConnection
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}

