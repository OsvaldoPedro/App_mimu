import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ResetPasswordLinkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Verificar se há uma sessão activa (vinda do magic link de email ou do OTP de telefone)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      } else {
        // Aguardar o evento PASSWORD_RECOVERY (para magic links de email)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setSessionReady(true)
            subscription.unsubscribe()
          }
        })
      }
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError(t('auth.passwordLengthError', 'A nova palavra-passe deve ter pelo menos 6 caracteres.'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatchError', 'As palavras-passe não coincidem.'))
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('✅ Palavra-passe alterada com sucesso!')
      setTimeout(() => navigate('/entrar'), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">
            {t('auth.setNewPassword', 'Definir Nova Senha')}
          </h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6 text-sm">
            {t('auth.setNewPasswordDesc', 'Introduza a sua nova palavra-passe de acesso à plataforma Mimu.')}
          </p>

          {!sessionReady && !success && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-4 border-mimu-cream-border dark:border-[#2A2A2A] border-t-[#C58A2B] rounded-full animate-spin" />
              <p className="text-sm text-mimu-wine-light-text dark:text-gray-400">
                A verificar sessão...
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 mb-4 bg-green-100 text-green-800 rounded-xl text-sm font-medium">{success}</div>
          )}

          {sessionReady && !success && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                  {t('auth.newPassword', 'Nova Palavra-passe')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none dark:bg-transparent dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mimu-wine-light-text/60 dark:text-gray-500 hover:text-mimu-gold"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Barra de força da senha */}
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        password.length >= i * 2
                          ? password.length >= 8 ? 'bg-green-500' : password.length >= 6 ? 'bg-amber-500' : 'bg-red-400'
                          : 'bg-mimu-cream-border dark:bg-[#2A2A2A]'
                      }`} />
                    ))}
                    <span className="text-xs text-mimu-wine-light-text/60 dark:text-gray-500 ml-1 self-center">
                      {password.length < 6 ? 'Fraca' : password.length < 8 ? 'Média' : 'Forte'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                  {t('auth.confirmNewPassword', 'Confirmar Nova Palavra-passe')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none dark:bg-transparent dark:text-white transition-colors ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold'
                  }`}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-xs text-red-500">As palavras-passe não coincidem</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className="mt-2 w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
              >
                {loading ? t('auth.processing', 'A processar...') : t('auth.saveNewPassword', 'Gravar Nova Senha')}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
