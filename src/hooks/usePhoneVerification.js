import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabaseClient'

export function usePhoneVerification() {
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Recuperar contador guardado para evitar bypass fazendo refresh à página
  useEffect(() => {
    const savedExpiry = localStorage.getItem('mimu_otp_expiry')
    if (savedExpiry) {
      const remaining = Math.ceil((parseInt(savedExpiry, 10) - Date.now()) / 1000)
      if (remaining > 0) {
        setResendCountdown(remaining)
      } else {
        localStorage.removeItem('mimu_otp_expiry')
      }
    }
  }, [])

  // Timer do contador regressivo
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          localStorage.removeItem('mimu_otp_expiry')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  const sendCode = useCallback(async (phone) => {
    if (resendCountdown > 0) {
      setError(`Aguarde ${resendCountdown} segundos para reenviar.`)
      return { success: false, error: 'Rate limit' }
    }

    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-verification-code', {
        body: { phone }
      })

      if (fnError) {
        // Extrair mensagem
        let msg = fnError.message
        try {
          const body = await fnError.context.json()
          if (body?.error) msg = body.error
        } catch (_) {}
        throw new Error(msg)
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setSuccess('Código de verificação enviado por SMS!')
      
      // Iniciar contador de 60 segundos
      const expiry = Date.now() + 60 * 1000
      localStorage.setItem('mimu_otp_expiry', expiry.toString())
      setResendCountdown(60)

      return { success: true }
    } catch (err) {
      console.error('[usePhoneVerification] Erro ao enviar:', err)
      setError(err.message || 'Erro ao enviar código SMS.')
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [resendCountdown])

  const verifyCode = useCallback(async (phone, code) => {
    setVerifying(true)
    setError(null)
    setSuccess(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-verification-code', {
        body: { phone, code }
      })

      if (fnError) {
        let msg = fnError.message
        try {
          const body = await fnError.context.json()
          if (body?.error) msg = body.error
        } catch (_) {}
        throw new Error(msg)
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setSuccess('Número verificado com sucesso!')
      localStorage.removeItem('mimu_otp_expiry')
      setResendCountdown(0)
      return { success: true }
    } catch (err) {
      console.error('[usePhoneVerification] Erro ao verificar:', err)
      setError(err.message || 'Código inválido ou expirado.')
      return { success: false, error: err.message }
    } finally {
      setVerifying(false)
    }
  }, [])

  const resetState = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  return {
    sendCode,
    verifyCode,
    sending,
    verifying,
    canResend: resendCountdown === 0,
    resendCountdown,
    error,
    success,
    resetState
  }
}
