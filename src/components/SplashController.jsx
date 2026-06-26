import { useEffect, useState } from 'react'
import SplashScreen from './SplashScreen'
import { initializeApp } from '../utils/appInitializer'

export default function SplashController({ onReady }) {
  const [progressPercent, setProgressPercent] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Carregando a aplicação...')
  const [error, setError] = useState(null)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    let isCancelled = false
    let completionTimeout = null

    const init = async () => {
      const startTime = performance.now()

      try {
        const result = await initializeApp({
          maxDurationMs: 2500,
          onProgress: ({ message, percent }) => {
            if (isCancelled) return
            setStatusMessage(message || 'Carregando a aplicação...')
            setProgressPercent(percent ?? 0)
          }
        })

        if (isCancelled) return

        setStatusMessage(result.message)

        if (result.status === 'error') {
          setError('Carregamento inicial concluiu com advertência; tentando continuar.')
        }
      } catch (err) {
        if (isCancelled) return
        setError('Falha inesperada na inicialização: ' + (err?.message || err))
      } finally {
        if (!isCancelled) {
          const elapsed = performance.now() - startTime
          const minSplash = 800

          const triggerReady = () => {
            if (isCancelled) return
            setIsFadingOut(true)
            setTimeout(() => {
              if (!isCancelled) onReady()
            }, 300)
          }

          if (elapsed >= minSplash) {
            setProgressPercent(100)
            triggerReady()
          } else {
            completionTimeout = setTimeout(() => {
              setProgressPercent(100)
              triggerReady()
            }, minSplash - elapsed)
          }
        }
      }
    }

    init()

    return () => {
      isCancelled = true
      if (completionTimeout) clearTimeout(completionTimeout)
    }
  }, [onReady])

  return (
    <SplashScreen
      progress={progressPercent}
      statusMessage={statusMessage}
      errorMessage={error}
      isFadingOut={isFadingOut}
    />
  )
}
