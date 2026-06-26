import { useState } from 'react'
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

  // The user should already have an active session thanks to the magic link in Supabase
  // We just call updateUser to change their password securely

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
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(t('auth.passwordChangedSuccess', 'Palavra-passe alterada com sucesso!'))
      setTimeout(() => {
        navigate('/entrar') // Redirecionar para o login
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('auth.setNewPassword', 'Definir Nova Senha')}</h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6 text-sm">
            {t('auth.setNewPasswordDesc', 'Bem-vindo de volta! Introduza abaixo a sua nova palavra-passe de acesso à plataforma Mimu.')}
          </p>

          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
          {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-xl text-sm">{success}</div>}

          {!success && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.newPassword', 'Nova Palavra-passe')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.confirmNewPassword', 'Confirmar Nova Palavra-passe')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
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
