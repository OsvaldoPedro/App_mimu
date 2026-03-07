import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function LoginPage() {
  const { user, login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fromState = location.state?.from
  const fromPath = typeof fromState === 'string' ? fromState : fromState?.pathname

  useEffect(() => {
    if (!user) return
    if (fromPath && fromPath !== '/entrar') {
      navigate(fromPath, { replace: true })
      return
    }
    const target = user.role === 'company'
      ? '/empresa'
      : user.role === 'provider'
        ? '/prestador'
        : user.role === 'admin'
          ? '/admin'
          : '/painel'
    navigate(target, { replace: true })
  }, [user, navigate, fromPath])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = login(email.trim(), password)
    if (result.success) {
      const u = result.user
      const fallback = u?.role === 'company'
        ? '/empresa'
        : u?.role === 'provider'
          ? '/prestador'
          : u?.role === 'admin'
            ? '/admin'
            : '/painel'
      const target = fromPath && fromPath !== '/entrar' ? fromPath : fallback
      navigate(target, { replace: true })
    } else {
      setError(result.error || t('auth.invalidCredentials'))
    }
  }

  const showReserveMessage = Boolean(fromPath && fromPath.startsWith('/servico/') && fromPath.includes('/reservar'))

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">{t('auth.login')}</h1>
          <p className="text-[#5C1A1A]/80 mb-6">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {showReserveMessage && !user && (
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl text-sm">
                {t('auth.loginToReserve')}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('auth.emailOrPhone')}</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors"
            >{t('auth.login')}</button>

          </form>
          <p className="text-center mt-2 text-[#5C1A1A]/80"><a href="/recover-password">{t('auth.forgotPassword')}</a></p>
          <p className="mt-6 text-center text-[#5C1A1A]/80 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/registar" className="text-[#C58A2B] font-semibold hover:underline">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
