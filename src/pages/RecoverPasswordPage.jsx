import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const formatPhoneForAuth = (digits) => {
  if (digits.startsWith('244') && digits.length === 12) return '+' + digits
  if (digits.length === 9) return '+244' + digits
  return '+' + digits
}

export default function RecoverPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')   // email ou telefone
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Fase 2 — apenas para telefone: digitar o OTP recebido
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [formattedPhone, setFormattedPhone] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const cleanDigits = identifier.replace(/\D/g, '')
  const isPhone = !identifier.includes('@') &&
    (cleanDigits.length === 9 || (cleanDigits.length === 12 && cleanDigits.startsWith('244')))
  const isEmail = identifier.includes('@') && identifier.includes('.')

  // ── Limitar dígitos a 9 quando for telefone ─────────────────────────────
  const handleIdentifierChange = (e) => {
    const val = e.target.value
    const onlyDigits = val.trim() !== '' && !val.includes('@') && val.replace(/\D/g, '') === val.trim()
    if (onlyDigits && val.replace(/\D/g, '').length > 9) return
    setIdentifier(val)
    setError('')
    setSuccessMsg('')
    setPhoneOtpSent(false)
    setOtp('')
  }

  // ── PASSO 1: Enviar link/OTP ─────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!identifier.trim()) {
      setError(t('auth.emailMissingError', 'Por favor, insira o seu e-mail ou número de telefone.'))
      return
    }

    if (!isEmail && !isPhone) {
      setError('Formato inválido. Insira um e-mail válido ou um número de telefone com 9 dígitos.')
      return
    }

    setLoading(true)

    if (isEmail) {
      // ── Recuperação por E-mail: magic link ──────────────────────────────
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`
      })
      setLoading(false)
      if (resetError) {
        setError(resetError.message)
      } else {
        setSuccessMsg('✅ Enviámos um link de recuperação para o seu e-mail. Verifique a sua caixa de entrada e pasta de spam.')
      }

    } else {
      // ── Recuperação por Telefone: OTP via SMS ───────────────────────────
      const phone = formatPhoneForAuth(cleanDigits)
      setFormattedPhone(phone)

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false }  // não criar conta — apenas verificar existência
      })
      setLoading(false)

      if (otpError) {
        // Supabase retorna erro se o número não existir
        if (otpError.message.toLowerCase().includes('user not found') ||
            otpError.message.toLowerCase().includes('phone not found') ||
            otpError.message.includes('Unable to validate')) {
          setError('Não encontrámos nenhuma conta associada a este número de telefone.')
        } else {
          setError(otpError.message)
        }
      } else {
        setPhoneOtpSent(true)
        setSuccessMsg(`📱 Enviámos um código de 6 dígitos para ${phone}. Introduza-o abaixo.`)
      }
    }
  }

  // ── PASSO 2: Verificar OTP e redirecionar para redefinir senha ───────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('O código deve ter 6 dígitos.')
      return
    }

    setVerifyingOtp(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    })
    setVerifyingOtp(false)

    if (verifyError) {
      setError('Código inválido ou expirado. Tente novamente.')
    } else {
      // OTP correto — a sessão ficou activa, ir definir nova senha
      navigate('/redefinir-senha')
    }
  }

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">
            {t('auth.recoverPasswordTitle', 'Recuperar Palavra-passe')}
          </h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6 text-sm">
            Insira o e-mail ou número de telefone da sua conta. Enviaremos um código de verificação para recuperar o acesso.
          </p>

          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
          )}
          {successMsg && (
            <div className="p-4 mb-4 bg-green-100 text-green-800 rounded-xl text-sm leading-relaxed font-medium">
              {successMsg}
            </div>
          )}

          {/* ── PASSO 1: Input de e-mail ou telefone ── */}
          {!phoneOtpSent && !successMsg && (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                  E-mail / Telefone
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  required
                  maxLength={identifier.includes('@') ? undefined : 9}
                  placeholder="E-mail ou telefone (9 dígitos)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none dark:bg-transparent dark:text-white"
                />
                {/* Indicador de modo */}
                {identifier.trim() !== '' && (
                  <p className="mt-1 text-xs text-mimu-wine-light-text/70 dark:text-gray-500">
                    {isEmail
                      ? '📧 Recuperação por e-mail — enviaremos um link seguro'
                      : isPhone
                      ? '📱 Recuperação por telefone — enviaremos um código SMS'
                      : '⚠️ Insira um e-mail válido ou 9 dígitos de telefone'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (!isEmail && !isPhone)}
                className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
              >
                {loading
                  ? 'A enviar...'
                  : isPhone
                  ? 'Enviar Código SMS'
                  : 'Enviar Link de Recuperação'}
              </button>
            </form>
          )}

          {/* ── PASSO 2 (Telefone): Inserir OTP ── */}
          {phoneOtpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                  Código de Verificação (6 dígitos)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none text-center text-2xl tracking-[0.5em] font-mono dark:bg-transparent dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
              >
                {verifyingOtp ? 'A verificar...' : 'Verificar Código'}
              </button>

              <button
                type="button"
                onClick={() => { setPhoneOtpSent(false); setSuccessMsg(''); setOtp('') }}
                className="w-full text-sm text-mimu-gold hover:underline"
              >
                ← Usar outro número ou e-mail
              </button>
            </form>
          )}

          {/* Após sucesso por email: botão de voltar */}
          {successMsg && isEmail && (
            <div className="mt-4 text-center">
              <Link to="/entrar" className="text-sm text-mimu-gold hover:underline">
                ← Voltar ao início de sessão
              </Link>
            </div>
          )}

          {!phoneOtpSent && !successMsg && (
            <p className="mt-6 text-center text-mimu-wine-light-text dark:text-gray-300/80 text-sm">
              Lembrou-se?{' '}
              <Link to="/entrar" className="text-mimu-gold font-semibold hover:underline">
                Entrar
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
