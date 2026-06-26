import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const { user, login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fromState = location.state?.from
  const fromPath = typeof fromState === 'string' ? fromState : fromState?.pathname

  useEffect(() => {
    if (!user) return
    // Se houver um fromPath válido (diferente de /entrar e /), volta para onde tentou ir
    if (fromPath && fromPath !== '/entrar' && fromPath !== '/') {
      navigate(fromPath, { replace: true })
      return
    }
    const userRole = user.role ? user.role.trim().toLowerCase() : 'client'
    const target = ['company', 'empresa'].includes(userRole)
      ? '/empresa'
      : ['provider', 'prestador'].includes(userRole)
        ? '/prestador'
        : ['admin', 'administrador'].includes(userRole)
          ? '/admin'
          : '/painel'
    navigate(target, { replace: true })
  }, [user, navigate, fromPath])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError(t('auth.emailMissingError', 'Por favor, insira o seu e-mail ou telefone.'))
      return
    }

    setLoading(true)
    
    const result = await login(email.trim(), password)
    setLoading(false)
    
    if (result.success) {
      toast.success('Acesso aceite!')
      // Redirecionamento será feito pelo useEffect quando user for atualizado
    } else {
      setError(result.error || t('auth.invalidCredentials'))
    }
  }

  const showReserveMessage = Boolean(fromPath && fromPath.startsWith('/servico/') && fromPath.includes('/reservar'))

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('auth.login')}</h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6">{t('auth.loginSubtitle', 'Insira o seu e-mail ou telefone e palavra-passe para aceder à sua conta.')}</p>

          {showReserveMessage && !user && (
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl text-sm mb-4">
              {t('auth.loginToReserve')}
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.emailPhoneLabel', 'E-mail / Telefone')}</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                placeholder={t('auth.emailPhonePlaceholder', 'Digite seu e-mail ou telefone')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.passwordLabel', 'Palavra-passe')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
              />
            </div>
            <div className="text-right mt-1 mb-2">
              <Link to="/recuperar-senha" className="text-sm text-mimu-gold hover:underline font-medium">{t('auth.forgotPassword', 'Esqueceu a palavra-passe?')}</Link>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
            >
              {loading ? t('auth.loggingIn', 'A entrar...') : t('auth.login', 'Entrar')}
            </button>
          </form>

          <p className="mt-6 text-center text-mimu-wine-light-text dark:text-gray-300/80 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/registar" className="text-mimu-gold font-semibold hover:underline">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
